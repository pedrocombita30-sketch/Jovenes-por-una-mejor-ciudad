const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const {
  ACTIVITY_TYPES,
  ACTIVITY_STATUSES,
  ACTIVITY_MODALITIES,
  PARTICIPANT_STATUSES,
  NOTIFICATION_TYPES,
} = require('../utils/constants');

// Solo el personal autorizado ve quién está inscrito. El público recibe la actividad sin participantes.
const esPersonal = (req) => ['ADMIN', 'COLABORADOR'].includes(req.user?.role?.name);

const sinParticipantes = (data) => {
  const quitar = (a) => {
    const { participants, ...resto } = a;
    return resto;
  };
  return Array.isArray(data) ? data.map(quitar) : quitar(data);
};

exports.getActivities = asyncHandler(async (req, res, next) => {
  const { type, status, upcoming, search } = req.query;

  const where = {};
  if (type) {
    const types = type.split(',').map((t) => t.trim()).filter(Boolean);
    where.type = types.length > 1 ? { in: types } : types[0];
  }
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
  }
  if (upcoming === 'true') {
    where.startDate = { gte: new Date() };
    where.status = { not: 'CANCELADA' };
  }
  if (search) where.title = { contains: search };

  const activities = await prisma.activity.findMany({
    where,
    include: {
      creator: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { participants: true } },
      participants: {
        select: {
          id: true,
          status: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { startDate: 'asc' },
  });

  res.json({ success: true, data: esPersonal(req) ? activities : sinParticipantes(activities) });
});

exports.getActivity = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true } },
      resources: { select: { id: true, title: true, type: true, description: true } },
      _count: { select: { participants: true } },
      participants: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!activity) throw new AppError('Actividad no encontrada.', 404);

  res.json({ success: true, data: esPersonal(req) ? activity : sinParticipantes(activity) });
});

exports.createActivity = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    type,
    startDate,
    endDate,
    location,
    modality,
    status,
    maxParticipants,
    imageUrl,
  } = req.body;

  if (!title || !title.trim()) throw new AppError('El título es obligatorio.', 400);
  if (!type || !ACTIVITY_TYPES.includes(type)) {
    throw new AppError('Tipo de actividad inválido.', 400);
  }
  if (!startDate) throw new AppError('La fecha de inicio es obligatoria.', 400);
  if (modality && !ACTIVITY_MODALITIES.includes(modality)) {
    throw new AppError('Modalidad inválida.', 400);
  }
  if (status && !ACTIVITY_STATUSES.includes(status)) {
    throw new AppError('Estado inválido.', 400);
  }

  const coverUrl = req.file ? `/uploads/images/${req.file.filename}` : (imageUrl || null);

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location,
      imageUrl: coverUrl,
      modality: modality || 'PRESENCIAL',
      status: status || 'PROGRAMADA',
      maxParticipants: maxParticipants ? Number(maxParticipants) : null,
      createdBy: req.user.id,
    },
    include: { creator: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.status(201).json({ success: true, data: activity });
});

exports.updateActivity = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const {
    title,
    description,
    type,
    startDate,
    endDate,
    location,
    modality,
    status,
    maxParticipants,
    imageUrl,
  } = req.body;

  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) throw new AppError('Actividad no encontrada.', 404);

  if (type && !ACTIVITY_TYPES.includes(type)) throw new AppError('Tipo inválido.', 400);
  if (modality && !ACTIVITY_MODALITIES.includes(modality)) throw new AppError('Modalidad inválida.', 400);
  if (status && !ACTIVITY_STATUSES.includes(status)) throw new AppError('Estado inválido.', 400);

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (type !== undefined) data.type = type;
  if (startDate !== undefined) data.startDate = new Date(startDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (location !== undefined) data.location = location;
  if (modality !== undefined) data.modality = modality;
  if (status !== undefined) data.status = status;
  if (maxParticipants !== undefined) data.maxParticipants = maxParticipants ? Number(maxParticipants) : null;
  if (req.file) {
    data.imageUrl = `/uploads/images/${req.file.filename}`;
  } else if (imageUrl !== undefined) {
    data.imageUrl = imageUrl;
  }

  const activity = await prisma.activity.update({
    where: { id },
    data,
    include: { creator: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.json({ success: true, data: activity });
});

exports.deleteActivity = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  await prisma.activity.delete({ where: { id } });
  res.json({ success: true, message: 'Actividad eliminada.' });
});

// ---------- Participantes ----------

exports.registerToActivity = asyncHandler(async (req, res, next) => {
  const activityId = Number(req.params.activityId);
  const userId = req.user.id;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { _count: { select: { participants: true } } },
  });

  if (!activity) throw new AppError('Actividad no encontrada.', 404);
  if (activity.status === 'CANCELADA') {
    throw new AppError('Esta actividad fue cancelada.', 400);
  }
  if (activity.status === 'COMPLETADA') {
    throw new AppError('Esta actividad ya finalizó.', 400);
  }

  const alreadyRegistered = await prisma.participant.findUnique({
    where: { activityId_userId: { activityId, userId } },
  });
  if (alreadyRegistered) {
    throw new AppError('Ya estás inscrito en esta actividad.', 409);
  }

  if (activity.maxParticipants && activity._count.participants >= activity.maxParticipants) {
    throw new AppError('Esta actividad alcanzó el cupo máximo.', 400);
  }

  const participant = await prisma.participant.create({
    data: { activityId, userId, status: 'REGISTRADO' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });

  res.status(201).json({ success: true, data: participant });
});

exports.unregisterFromActivity = asyncHandler(async (req, res, next) => {
  const activityId = Number(req.params.activityId);
  const userId = req.user.id;

  await prisma.participant.delete({
    where: { activityId_userId: { activityId, userId } },
  });

  res.json({ success: true, message: 'Inscripción cancelada.' });
});

exports.updateParticipantStatus = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status || !PARTICIPANT_STATUSES.includes(status)) {
    throw new AppError('Estado de participante inválido.', 400);
  }

  const participant = await prisma.participant.update({
    where: { id },
    data: { status },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      activity: { select: { id: true, title: true } },
    },
  });

  res.json({ success: true, data: participant });
});

exports.getUserActivities = asyncHandler(async (req, res, next) => {
  const participants = await prisma.participant.findMany({
    where: { userId: req.user.id },
    include: { activity: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: participants.map((p) => ({ ...p.activity, participationStatus: p.status })),
  });
});

module.exports = exports;