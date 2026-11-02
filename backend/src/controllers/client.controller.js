const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const {
  CLIENT_STATUSES,
  INTERACTION_TYPES,
  FOLLOW_UP_STATUSES,
  NOTIFICATION_TYPES,
  ROLES,
} = require('../utils/constants');

// ---------- Clientes ----------

exports.getClients = asyncHandler(async (req, res, next) => {
  const {
    search,
    status,
    assignedTo,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

  const where = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = Number(assignedTo);

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { interactions: true, followUps: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.client.count({ where }),
  ]);

  res.json({
    success: true,
    data: clients,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

exports.getStatusCounts = asyncHandler(async (req, res, next) => {
  const statuses = await prisma.client.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const counts = {};
  for (const s of CLIENT_STATUSES) counts[s] = 0;
  for (const s of statuses) counts[s.status] = s._count._all;

  res.json({ success: true, data: counts });
});

exports.getClient = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
      interactions: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
      followUps: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) throw new AppError('Cliente no encontrado.', 404);

  res.json({ success: true, data: client });
});

exports.createClient = asyncHandler(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    birthDate,
    status,
    notes,
    assignedTo,
  } = req.body;

  if (status && !CLIENT_STATUSES.includes(status)) {
    throw new AppError('Estado de cliente inválido.', 400);
  }

  let assigned = null;
  if (assignedTo) {
    assigned = Number(assignedTo);
    const user = await prisma.user.findUnique({ where: { id: assigned } });
    if (!user) throw new AppError('El responsable asignado no existe.', 400);
  }

  const client = await prisma.client.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      address,
      birthDate,
      status: status || 'NUEVO',
      notes,
      assignedTo: assigned,
      createdBy: req.user.id,
    },
    include: {
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (assigned && assigned !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assigned,
        type: NOTIFICATION_TYPES.ASIGNACION,
        message: `Se te asignó el cliente ${firstName} ${lastName}.`,
      },
    });
  }

  res.status(201).json({ success: true, data: client });
});

exports.updateClient = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    birthDate,
    status,
    notes,
    assignedTo,
  } = req.body;

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) throw new AppError('Cliente no encontrado.', 404);

  if (status && !CLIENT_STATUSES.includes(status)) {
    throw new AppError('Estado de cliente inválido.', 400);
  }

  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (email !== undefined) data.email = email;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;
  if (birthDate !== undefined) data.birthDate = birthDate;
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;
  if (assignedTo !== undefined) {
    data.assignedTo = assignedTo ? Number(assignedTo) : null;
  }

  const isCollaborator = req.user.role.name === ROLES.COLABORADOR;
  if (isCollaborator && existing.assignedTo && existing.assignedTo !== req.user.id) {
    throw new AppError('No tienes permisos para editar este cliente.', 403);
  }

  const client = await prisma.client.update({
    where: { id },
    data,
    include: {
      assignedUser: { select: { id: true, firstName: true, lastName: true } },
      creator: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (data.assignedTo && data.assignedTo !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: data.assignedTo,
        type: NOTIFICATION_TYPES.ASIGNACION,
        message: `Se te asignó el cliente ${client.firstName} ${client.lastName}.`,
      },
    });
  }

  res.json({ success: true, data: client });
});

exports.deleteClient = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  await prisma.client.delete({ where: { id } });
  res.json({ success: true, message: 'Cliente eliminado.' });
});

// ---------- Interacciones ----------

exports.getClientInteractions = asyncHandler(async (req, res, next) => {
  const clientId = Number(req.params.clientId);

  const interactions = await prisma.interaction.findMany({
    where: { clientId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: interactions });
});

exports.createInteraction = asyncHandler(async (req, res, next) => {
  const clientId = Number(req.params.clientId);
  const { type, description } = req.body;

  if (type && !INTERACTION_TYPES.includes(type)) {
    throw new AppError('Tipo de interacción inválido.', 400);
  }
  if (!description || !description.trim()) {
    throw new AppError('La descripción de la interacción es obligatoria.', 400);
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);

  const interaction = await prisma.interaction.create({
    data: {
      clientId,
      userId: req.user.id,
      type: type || 'OTRO',
      description,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (client.status === 'NUEVO') {
    await prisma.client.update({ where: { id: clientId }, data: { status: 'CONTACTADO' } });
  }

  res.status(201).json({ success: true, data: interaction });
});

exports.deleteInteraction = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  await prisma.interaction.delete({ where: { id } });
  res.json({ success: true, message: 'Interacción eliminada.' });
});

// ---------- Seguimientos ----------

exports.getClientFollowUps = asyncHandler(async (req, res, next) => {
  const clientId = Number(req.params.clientId);

  const followUps = await prisma.followUp.findMany({
    where: { clientId },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  res.json({ success: true, data: followUps });
});

exports.createFollowUp = asyncHandler(async (req, res, next) => {
  const clientId = Number(req.params.clientId);
  const { status, description, dueDate, userId } = req.body;

  if (status && !FOLLOW_UP_STATUSES.includes(status)) {
    throw new AppError('Estado de seguimiento inválido.', 400);
  }
  if (!description || !description.trim()) {
    throw new AppError('La descripción del seguimiento es obligatoria.', 400);
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new AppError('Cliente no encontrado.', 404);

  const assignedUserId = userId ? Number(userId) : req.user.id;

  const followUp = await prisma.followUp.create({
    data: {
      clientId,
      userId: assignedUserId,
      status: status || 'PENDIENTE',
      description,
      dueDate: dueDate || null,
      completedAt: status === 'COMPLETADO' ? new Date().toISOString() : null,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (assignedUserId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: assignedUserId,
        type: NOTIFICATION_TYPES.SEGUIMIENTO,
        message: `Tienes un nuevo seguimiento pendiente para ${client.firstName} ${client.lastName}.`,
      },
    });
  }

  if (client.status === 'NUEVO' || client.status === 'CONTACTADO') {
    await prisma.client.update({
      where: { id: clientId },
      data: { status: 'EN_SEGUIMIENTO' },
    });
  }

  res.status(201).json({ success: true, data: followUp });
});

exports.updateFollowUp = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { status, description, dueDate } = req.body;

  const existing = await prisma.followUp.findUnique({ where: { id } });
  if (!existing) throw new AppError('Seguimiento no encontrado.', 404);

  if (status && !FOLLOW_UP_STATUSES.includes(status)) {
    throw new AppError('Estado de seguimiento inválido.', 400);
  }

  const data = {};
  if (description !== undefined) data.description = description;
  if (dueDate !== undefined) data.dueDate = dueDate;
  if (status !== undefined) {
    data.status = status;
    if (status === 'COMPLETADO' && !existing.completedAt) {
      data.completedAt = new Date().toISOString();
    }
    if (status !== 'COMPLETADO') data.completedAt = null;
  }

  const followUp = await prisma.followUp.update({
    where: { id },
    data,
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.json({ success: true, data: followUp });
});

exports.deleteFollowUp = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  await prisma.followUp.delete({ where: { id } });
  res.json({ success: true, message: 'Seguimiento eliminado.' });
});

module.exports = exports;