const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const { ENROLLMENT_STATUSES } = require('../utils/constants');
const { ensureCourseStructure, syncCourseModules } = require('../services/course.service');

const courseInclude = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  _count: { select: { resources: true, enrollments: true } },
  modules: {
    orderBy: { position: 'asc' },
    select: { id: true, position: true, title: true, description: true },
  },
};

// ========== CURSOS ==========

// Catálogo público de cursos
exports.getCourses = asyncHandler(async (req, res, next) => {
  const courses = await prisma.course.findMany({
    where: { active: true },
    include: {
      ...courseInclude,
      enrollments: req.user?.id
        ? { where: { userId: req.user.id }, select: { id: true, status: true } }
        : false,
    },
    orderBy: { createdAt: 'asc' },
  });

  const data = courses.map((c) => {
    const mine = req.user?.id ? c.enrollments?.[0] || null : null;
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      duration: c.duration,
      modality: c.modality,
      imageUrl: c.imageUrl,
      createdAt: c.createdAt,
      totalResources: c._count.resources,
      totalEnrollments: c._count.enrollments,
      myEnrollment: mine ? { id: mine.id, status: mine.status } : null,
    };
  });

  res.json({ success: true, data });
});

// Todos los cursos, incluidos los inactivos (para el panel)
exports.getAllCourses = asyncHandler(async (req, res, next) => {
  const courses = await prisma.course.findMany({
    include: courseInclude,
    orderBy: { createdAt: 'desc' },
  });

  const accepted = await prisma.enrollment.groupBy({
    by: ['courseId'],
    where: { status: 'ACEPTADA' },
    _count: { _all: true },
  });
  const pending = await prisma.enrollment.groupBy({
    by: ['courseId'],
    where: { status: 'PENDIENTE' },
    _count: { _all: true },
  });

  const acceptedMap = new Map(accepted.map((a) => [a.courseId, a._count._all]));
  const pendingMap = new Map(pending.map((a) => [a.courseId, a._count._all]));

  res.json({
    success: true,
    data: courses.map((c) => ({
      ...c,
      acceptedCount: acceptedMap.get(c.id) || 0,
      pendingCount: pendingMap.get(c.id) || 0,
    })),
  });
});

exports.getCourse = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const course = await prisma.course.findUnique({ where: { id }, include: courseInclude });
  if (!course) throw new AppError('Curso no encontrado.', 404);
  res.json({ success: true, data: course });
});

exports.createCourse = asyncHandler(async (req, res, next) => {
  const { name, description, duration, modality, imageUrl, active } = req.body;

  if (!name || !name.trim()) throw new AppError('El nombre del curso es obligatorio.', 400);

  const course = await prisma.course.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      duration: duration?.trim() || null,
      modality: modality || 'PRESENCIAL',
      imageUrl: imageUrl?.trim() || null,
      active: active === undefined ? true : Boolean(active),
      createdBy: req.user.id,
    },
    include: courseInclude,
  });

  // Un curso nuevo parte con 3 módulos por defecto; el formulario puede enviar los suyos.
  if (Array.isArray(req.body.modules) && req.body.modules.length > 0) {
    await syncCourseModules(course.id, req.body.modules);
  } else {
    await ensureCourseStructure(course.id);
  }

  const full = await prisma.course.findUnique({ where: { id: course.id }, include: courseInclude });
  res.status(201).json({ success: true, data: full });
});

exports.updateCourse = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { name, description, duration, modality, imageUrl, active } = req.body;

  const current = await prisma.course.findUnique({ where: { id } });
  if (!current) throw new AppError('Curso no encontrado.', 404);

  const data = {};
  if (name !== undefined) {
    if (!name.trim()) throw new AppError('El nombre del curso es obligatorio.', 400);
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description.trim() || null;
  if (duration !== undefined) data.duration = duration.trim() || null;
  if (modality !== undefined) data.modality = modality;
  if (imageUrl !== undefined) data.imageUrl = imageUrl.trim() || null;
  if (active !== undefined) data.active = Boolean(active);

  await ensureCourseStructure(id);
  await syncCourseModules(id, req.body.modules);

  const course = await prisma.course.update({ where: { id }, data, include: courseInclude });
  res.json({ success: true, data: course });
});

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new AppError('Curso no encontrado.', 404);

  await prisma.course.delete({ where: { id } });
  res.json({ success: true, message: 'Curso eliminado.' });
});

// ========== INSCRIPCIONES ==========

// Solicitar inscripción (cualquier usuario con cuenta)
exports.enroll = asyncHandler(async (req, res, next) => {
  const courseId = Number(req.params.id);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Curso no encontrado.', 404);
  if (!course.active) throw new AppError('Este curso no está disponible para inscripción.', 400);

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: req.user.id } },
  });

  if (existing) {
    if (existing.status === 'RECHAZADA') {
      // Permite volver a solicitar tras un rechazo.
      const updated = await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'PENDIENTE', notes: null, reviewedBy: null, reviewedAt: null },
      });
      return res.json({ success: true, data: updated, message: 'Solicitud reenviada. Queda pendiente de aprobación.' });
    }
    throw new AppError('Ya tienes una inscripción en este curso.', 409);
  }

  const enrollment = await prisma.enrollment.create({
    data: { courseId, userId: req.user.id, status: 'PENDIENTE' },
    include: { course: { select: { id: true, name: true } } },
  });

  res.status(201).json({
    success: true,
    data: enrollment,
    message: 'Solicitud enviada. Un colaborador debe aprobar tu inscripción.',
  });
});

// Cancelar la propia solicitud
exports.cancelEnrollment = asyncHandler(async (req, res, next) => {
  const courseId = Number(req.params.id);

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId: req.user.id } },
  });
  if (!enrollment) throw new AppError('No tienes inscripción en este curso.', 404);

  await prisma.enrollment.delete({ where: { id: enrollment.id } });
  res.json({ success: true, message: 'Inscripción cancelada.' });
});

// Listado de inscripciones para el personal
exports.getEnrollments = asyncHandler(async (req, res, next) => {
  const { status, courseId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (courseId) where.courseId = Number(courseId);

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      course: { select: { id: true, name: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: enrollments });
});

// Aprobar o rechazar una inscripción
exports.reviewEnrollment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { status, notes } = req.body;

  if (!ENROLLMENT_STATUSES.includes(status)) {
    throw new AppError('Estado de inscripción inválido.', 400);
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw new AppError('Inscripción no encontrada.', 404);

  const updated = await prisma.enrollment.update({
    where: { id },
    data: {
      status,
      notes: notes?.trim() || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      course: { select: { id: true, name: true } },
      reviewer: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (status === 'ACEPTADA') {
    await ensureCourseStructure(enrollment.courseId);
  }

  const mensaje =
    status === 'ACEPTADA'
      ? 'Inscripción aprobada. Ya puede acceder al aula extendida.'
      : 'Inscripción rechazada.';

  res.json({ success: true, data: updated, message: mensaje });
});

exports.deleteEnrollment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) throw new AppError('Inscripción no encontrada.', 404);

  await prisma.enrollment.delete({ where: { id } });
  res.json({ success: true, message: 'Inscripción eliminada.' });
});