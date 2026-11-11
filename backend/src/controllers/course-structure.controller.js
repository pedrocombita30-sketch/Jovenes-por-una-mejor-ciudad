const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const service = require('../services/course.service');

const resourceSelect = {
  id: true,
  title: true,
  description: true,
  type: true,
  externalUrl: true,
  fileUrl: true,
  createdAt: true,
};

// Estructura completa para el personal: módulos, materiales y cuestionarios con respuestas
exports.getStructure = asyncHandler(async (req, res) => {
  const courseId = Number(req.params.id);
  await service.ensureCourseStructure(courseId);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true, description: true, duration: true, modality: true, active: true },
  });
  if (!course) throw new AppError('Curso no encontrado.', 404);

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    include: {
      resources: { select: resourceSelect, orderBy: { createdAt: 'asc' } },
      quiz: {
        include: {
          questions: {
            orderBy: { position: 'asc' },
            include: { options: { orderBy: { position: 'asc' } } },
          },
          _count: { select: { attempts: true } },
        },
      },
    },
  });

  res.json({
    success: true,
    data: {
      course,
      modules: modules.map((m) => ({ ...m, number: service.moduleNumber(m.position) })),
    },
  });
});

exports.updateModule = asyncHandler(async (req, res) => {
  const id = Number(req.params.moduleId);
  const { title, description } = req.body;

  const current = await prisma.courseModule.findUnique({ where: { id } });
  if (!current) throw new AppError('Módulo no encontrado.', 404);

  const data = {};
  if (title !== undefined) {
    if (!String(title).trim()) throw new AppError('El título del módulo es obligatorio.', 400);
    data.title = String(title).trim();
  }
  if (description !== undefined) data.description = String(description).trim() || null;

  const updated = await prisma.courseModule.update({ where: { id }, data });
  res.json({ success: true, data: updated });
});

exports.updateQuiz = asyncHandler(async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const { title, instructions, passingScore } = req.body;

  const quiz = await prisma.quiz.findUnique({ where: { moduleId } });
  if (!quiz) throw new AppError('Este módulo no tiene cuestionario.', 404);

  const data = {};
  if (title !== undefined) {
    if (!String(title).trim()) throw new AppError('El título del cuestionario es obligatorio.', 400);
    data.title = String(title).trim();
  }
  if (instructions !== undefined) data.instructions = String(instructions).trim() || null;
  if (passingScore !== undefined) {
    const score = Number(passingScore);
    if (!Number.isInteger(score) || score < 1 || score > 100) {
      throw new AppError('El porcentaje mínimo debe ser un número entero entre 1 y 100.', 400);
    }
    data.passingScore = score;
  }

  const updated = await prisma.quiz.update({ where: { id: quiz.id }, data });
  res.json({ success: true, data: updated });
});

exports.createQuestion = asyncHandler(async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const quiz = await prisma.quiz.findUnique({
    where: { moduleId },
    include: { _count: { select: { questions: true } } },
  });
  if (!quiz) throw new AppError('Este módulo no tiene cuestionario.', 404);

  const { text, options } = service.validateQuestionPayload(req.body);

  const question = await prisma.quizQuestion.create({
    data: {
      quizId: quiz.id,
      text,
      position: quiz._count.questions + 1,
      options: {
        create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i + 1 })),
      },
    },
    include: { options: { orderBy: { position: 'asc' } } },
  });

  res.status(201).json({ success: true, data: question });
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const id = Number(req.params.questionId);
  const existing = await prisma.quizQuestion.findUnique({ where: { id } });
  if (!existing) throw new AppError('Pregunta no encontrada.', 404);

  const { text, options } = service.validateQuestionPayload(req.body);

  // Las opciones se reemplazan completas para garantizar una única respuesta correcta.
  const [, question] = await prisma.$transaction([
    prisma.quizOption.deleteMany({ where: { questionId: id } }),
    prisma.quizQuestion.update({
      where: { id },
      data: {
        text,
        options: {
          create: options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i + 1 })),
        },
      },
      include: { options: { orderBy: { position: 'asc' } } },
    }),
  ]);

  res.json({ success: true, data: question });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  const id = Number(req.params.questionId);
  const existing = await prisma.quizQuestion.findUnique({ where: { id } });
  if (!existing) throw new AppError('Pregunta no encontrada.', 404);

  await prisma.quizQuestion.delete({ where: { id } });
  res.json({ success: true, message: 'Pregunta eliminada.' });
});

module.exports = exports;
