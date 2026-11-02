const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const { RESOURCE_TYPES, ROLES } = require('../utils/constants');
const { assertModuleAccessible } = require('../services/course.service');

// Resuelve el módulo de un curso. Sin moduleId se usa el Módulo 1.
async function resolveModuleId(courseId, moduleId) {
  if (!courseId) return null;
  if (moduleId) {
    const mod = await prisma.courseModule.findUnique({ where: { id: Number(moduleId) } });
    if (!mod || mod.courseId !== Number(courseId)) {
      throw new AppError('El módulo indicado no pertenece a este curso.', 400);
    }
    return mod.id;
  }
  const first = await prisma.courseModule.findFirst({
    where: { courseId: Number(courseId), position: 1 },
  });
  return first ? first.id : null;
}

exports.getResources = asyncHandler(async (req, res, next) => {
  const { type, courseId, search } = req.query;

  const where = {};
  if (type) where.type = type;
  if (courseId) where.courseId = Number(courseId);
  if (search) where.title = { contains: search };

  const resources = await prisma.resource.findMany({
    where,
    include: {
      course: { select: { id: true, name: true } },
      uploader: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: resources });
});

exports.downloadResource = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new AppError('Recurso no encontrado.', 404);

  const isStaff = req.user.role.name === ROLES.ADMIN || req.user.role.name === ROLES.COLABORADOR;

  let enrolled = isStaff;
  if (!enrolled && resource.courseId) {
    enrolled = Boolean(
      await prisma.enrollment.findFirst({
        where: { courseId: resource.courseId, userId: req.user.id, status: 'ACEPTADA' },
      })
    );
  }
  if (!enrolled && resource.activityId) {
    enrolled = Boolean(
      await prisma.participant.findFirst({
        where: {
          activityId: resource.activityId,
          userId: req.user.id,
          status: { not: 'CANCELADO' },
        },
      })
    );
  }

  if (!enrolled) {
    throw new AppError(
      'No tienes acceso a este recurso. Necesitas una inscripción aprobada en el curso.',
      403
    );
  }

  // Un alumno solo accede a materiales de módulos ya desbloqueados.
  if (!isStaff && resource.courseId && resource.moduleId) {
    await assertModuleAccessible(req.user.id, resource.courseId, resource.moduleId);
  }

  if (!resource.fileUrl) throw new AppError('Este recurso no tiene archivo asociado.', 400);

  const filePath = path.join(__dirname, '..', 'uploads', resource.fileUrl.replace('/uploads/', ''));
  if (!fs.existsSync(filePath)) throw new AppError('El archivo ya no existe en el servidor.', 404);

  res.download(filePath);
});

exports.getResource = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true } },
      uploader: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!resource) throw new AppError('Recurso no encontrado.', 404);

  res.json({ success: true, data: resource });
});

exports.createResource = asyncHandler(async (req, res, next) => {
  const { title, description, type, externalUrl, courseId, moduleId } = req.body;
  const file = req.file;

  if (!title || !title.trim()) throw new AppError('El título es obligatorio.', 400);
  if (!type || !RESOURCE_TYPES.includes(type)) {
    throw new AppError('Tipo de recurso inválido.', 400);
  }

  if (type === 'ENLACE') {
    if (!externalUrl) throw new AppError('Debes proporcionar el enlace externo.', 400);
  } else {
    if (!file) throw new AppError('Debes adjuntar el archivo.', 400);
  }

  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) throw new AppError('El curso indicado no existe.', 400);
  }

  const resolvedModuleId = await resolveModuleId(courseId, moduleId);

  const data = {
    title,
    description,
    type,
    externalUrl: type === 'ENLACE' ? externalUrl : null,
    fileUrl: file ? `/uploads/documents/${file.filename}` : null,
    courseId: courseId ? Number(courseId) : null,
    moduleId: resolvedModuleId,
    uploadedBy: req.user.id,
  };

  const resource = await prisma.resource.create({
    data,
    include: {
      course: { select: { id: true, name: true } },
      uploader: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ success: true, data: resource });
});

exports.updateResource = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { title, description, externalUrl, courseId, moduleId } = req.body;
  const file = req.file;

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (!existing) throw new AppError('Recurso no encontrado.', 404);

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (externalUrl !== undefined) data.externalUrl = externalUrl;
  if (courseId !== undefined) {
    data.courseId = courseId ? Number(courseId) : null;
    // Si cambia de curso sin indicar módulo, se asigna el Módulo 1 del nuevo curso.
    if (!moduleId) data.moduleId = await resolveModuleId(courseId, null);
  }
  if (moduleId !== undefined && moduleId !== '') {
    const targetCourse = data.courseId !== undefined ? data.courseId : existing.courseId;
    data.moduleId = await resolveModuleId(targetCourse, moduleId);
  }
  if (courseId !== undefined && !courseId) data.moduleId = null;
  if (file) data.fileUrl = `/uploads/documents/${file.filename}`;

  const resource = await prisma.resource.update({
    where: { id },
    data,
    include: {
      course: { select: { id: true, name: true } },
      uploader: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.json({ success: true, data: resource });
});

exports.deleteResource = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) throw new AppError('Recurso no encontrado.', 404);

  if (resource.fileUrl && process.env.NODE_ENV !== 'production') {
    const { unlink } = require('fs/promises');
    const filePath = path.join(__dirname, '..', 'uploads', resource.fileUrl.replace('/uploads/', ''));
    try {
      await unlink(filePath);
    } catch {
      // El archivo podría no existir; se ignora.
    }
  }

  await prisma.resource.delete({ where: { id } });
  res.json({ success: true, message: 'Recurso eliminado.' });
});

module.exports = exports;
