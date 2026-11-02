const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const service = require('../services/course.service');

// Cursos aceptados del usuario con su resumen de progreso
exports.getMyClassroom = asyncHandler(async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.user.id, status: 'ACEPTADA' },
    include: {
      course: {
        select: { id: true, name: true, description: true, duration: true, modality: true, imageUrl: true },
      },
    },
    orderBy: { reviewedAt: 'desc' },
  });

  const data = [];
  for (const e of enrollments) {
    const progress = await service.buildCourseProgress(req.user.id, e.courseId);
    data.push({
      courseId: e.courseId,
      name: e.course.name,
      description: e.course.description,
      duration: e.course.duration,
      modality: e.course.modality,
      imageUrl: e.course.imageUrl,
      enrolledAt: e.reviewedAt || e.createdAt,
      overall: progress.overall,
      modules: progress.modules.map((m) => ({
        id: m.id,
        position: m.position,
        title: m.title,
        status: m.status,
        percent: m.percent,
      })),
    });
  }

  res.json({ success: true, data });
});

// Aula de un curso: tres módulos, materiales, progreso y cuestionarios
exports.getClassroom = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.id);
  await service.requireAcceptedEnrollment(req.user.id, courseId);

  const progress = await service.buildCourseProgress(req.user.id, courseId);
  res.json({ success: true, data: progress });
});

// Registra la finalización automática de un material al abrirlo
exports.completeMaterial = asyncHandler(async (req, res) => {
  const resourceId = Number(req.params.resourceId);
  const result = await service.markResourceCompleted(req.user.id, resourceId);
  res.json({ success: true, data: result });
});

exports.getQuiz = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const moduleId = Number(req.params.moduleId);
  const data = await service.getStudentQuiz(req.user.id, courseId, moduleId);
  res.json({ success: true, data });
});

exports.submitQuiz = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.courseId);
  const moduleId = Number(req.params.moduleId);
  const data = await service.submitQuizAttempt(req.user.id, courseId, moduleId, req.body?.answers);
  res.status(201).json({ success: true, data });
});

module.exports = exports;
