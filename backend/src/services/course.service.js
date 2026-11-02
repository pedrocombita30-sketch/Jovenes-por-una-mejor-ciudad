const prisma = require('../config/database');
const { AppError } = require('../utils/helpers');

const MODULE_COUNT = 3;
const DEFAULT_PASSING_SCORE = 70;
const MAX_OPTIONS = 6;
const MIN_OPTIONS = 2;

// Garantiza que el curso tenga exactamente sus tres módulos y un cuestionario por módulo.
// Es idempotente: puede ejecutarse varias veces sin duplicar registros.
async function ensureCourseStructure(courseId) {
  for (let position = 1; position <= MODULE_COUNT; position += 1) {
    const mod = await prisma.courseModule.upsert({
      where: { courseId_position: { courseId, position } },
      update: {},
      create: { courseId, position, title: `Módulo ${position}` },
    });

    await prisma.quiz.upsert({
      where: { moduleId: mod.id },
      update: {},
      create: {
        moduleId: mod.id,
        title: `Cuestionario del Módulo ${position}`,
        passingScore: DEFAULT_PASSING_SCORE,
      },
    });
  }
}

// Solo los alumnos con inscripción ACEPTADA pueden acceder al contenido del curso.
async function requireAcceptedEnrollment(userId, courseId) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  if (!enrollment || enrollment.status !== 'ACEPTADA') {
    throw new AppError('No tienes una inscripción aprobada en este curso.', 403);
  }
  return enrollment;
}

// Calcula, para un usuario y un curso, el estado de cada módulo.
// Toda la lógica de desbloqueo vive aquí (backend), no en el frontend.
async function buildCourseProgress(userId, courseId) {
  await ensureCourseStructure(courseId);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, name: true, description: true, duration: true, modality: true, imageUrl: true },
  });

  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { position: 'asc' },
    include: {
      resources: {
        select: { id: true, title: true, description: true, type: true, externalUrl: true },
        orderBy: { createdAt: 'asc' },
      },
      quiz: {
        include: { questions: { select: { id: true } } },
      },
    },
  });

  const progressRows = await prisma.resourceProgress.findMany({
    where: { userId, courseId },
    select: { resourceId: true },
  });
  const completedIds = new Set(progressRows.map((p) => p.resourceId));

  const quizIds = modules.map((m) => m.quiz?.id).filter(Boolean);
  const attempts = quizIds.length
    ? await prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: quizIds } },
        orderBy: { createdAt: 'desc' },
        select: { quizId: true, score: true, passed: true, createdAt: true },
      })
    : [];

  const result = [];
  let previousCompleted = true; // El Módulo 1 se habilita con la inscripción aceptada.

  for (const m of modules) {
    const unlocked = previousCompleted;

    const allMaterials = m.resources.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      externalUrl: r.type === 'ENLACE' ? r.externalUrl : null,
      completed: completedIds.has(r.id),
    }));

    const total = allMaterials.length;
    const done = allMaterials.filter((x) => x.completed).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const materialsDone = total > 0 && done === total;
    // Un módulo bloqueado no revela el contenido (solo sus contadores)
    const materials = unlocked ? allMaterials : [];

    const quizAttempts = m.quiz ? attempts.filter((a) => a.quizId === m.quiz.id) : [];
    const passed = quizAttempts.some((a) => a.passed);
    const lastAttempt = quizAttempts[0] || null;
    const questionCount = m.quiz?.questions.length || 0;

    let status;
    if (!unlocked) status = 'BLOQUEADO';
    else if (passed) status = 'COMPLETADO';
    else if (total === 0) status = 'SIN_CONTENIDO';
    else if (!materialsDone) status = 'EN_PROGRESO';
    else status = 'PENDIENTE_CUESTIONARIO';

    let quizBlockedReason = null;
    if (!unlocked) {
      quizBlockedReason = `Aprueba el cuestionario del Módulo ${m.position - 1} para desbloquear este módulo.`;
    } else if (passed) {
      quizBlockedReason = 'Ya aprobaste este cuestionario.';
    } else if (total === 0) {
      quizBlockedReason = 'Este módulo aún no tiene materiales disponibles.';
    } else if (!materialsDone) {
      quizBlockedReason = `Completa los ${total - done} material(es) pendiente(s) para habilitar el cuestionario.`;
    } else if (questionCount === 0) {
      quizBlockedReason = 'El cuestionario de este módulo aún no tiene preguntas.';
    }

    const quizAvailable = quizBlockedReason === null;

    result.push({
      id: m.id,
      position: m.position,
      title: m.title,
      description: m.description,
      status,
      unlocked,
      percent,
      completedMaterials: done,
      totalMaterials: total,
      materials,
      blockedReason: unlocked ? null : quizBlockedReason,
      quiz: m.quiz
        ? {
            id: m.quiz.id,
            title: m.quiz.title,
            instructions: m.quiz.instructions,
            passingScore: m.quiz.passingScore,
            questionCount,
            available: quizAvailable,
            blockedReason: unlocked ? quizBlockedReason : null,
            passed,
            attemptCount: quizAttempts.length,
            lastAttempt: lastAttempt
              ? { score: lastAttempt.score, passed: lastAttempt.passed, createdAt: lastAttempt.createdAt }
              : null,
          }
        : null,
    });

    previousCompleted = unlocked && passed;
  }

  // Progreso general: cada material cuenta como un elemento y cada cuestionario como otro.
  let totalItems = 0;
  let doneItems = 0;
  for (const m of result) {
    totalItems += m.totalMaterials + 1;
    doneItems += m.completedMaterials + (m.quiz?.passed ? 1 : 0);
  }
  const overallPercent = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const last = result[result.length - 1];
  const finished = result.length === MODULE_COUNT && Boolean(last?.quiz?.passed);

  return {
    course,
    overall: {
      percent: overallPercent,
      finished,
      completedModules: result.filter((m) => m.status === 'COMPLETADO').length,
      totalModules: result.length,
    },
    modules: result,
  };
}

// Verifica inscripción aceptada y que el módulo esté desbloqueado.
async function assertModuleAccessible(userId, courseId, moduleId) {
  await requireAcceptedEnrollment(userId, courseId);
  const progress = await buildCourseProgress(userId, courseId);
  const mod = progress.modules.find((m) => m.id === moduleId);
  if (!mod) throw new AppError('Módulo no encontrado en este curso.', 404);
  if (!mod.unlocked) {
    throw new AppError(
      mod.blockedReason || 'Este módulo está bloqueado.',
      403
    );
  }
  return { progress, module: mod };
}

// Registra la finalización de un material. Es idempotente: no genera duplicados.
async function markResourceCompleted(userId, resourceId) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    select: { id: true, courseId: true, moduleId: true },
  });
  if (!resource) throw new AppError('Recurso no encontrado.', 404);
  if (!resource.courseId || !resource.moduleId) {
    throw new AppError('Este material no está asignado a un módulo de curso.', 403);
  }

  await assertModuleAccessible(userId, resource.courseId, resource.moduleId);

  await prisma.resourceProgress.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    update: {},
    create: { userId, resourceId, courseId: resource.courseId },
  });

  return { resourceId, completed: true };
}

// Cuestionario tal como lo ve el alumno: sin respuestas correctas.
async function getStudentQuiz(userId, courseId, moduleId) {
  const { module: mod } = await assertModuleAccessible(userId, courseId, moduleId);
  if (!mod.quiz) throw new AppError('Este módulo no tiene cuestionario.', 404);
  if (!mod.quiz.available) {
    throw new AppError(mod.quiz.blockedReason || 'El cuestionario no está disponible todavía.', 403);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: mod.quiz.id },
    select: {
      id: true,
      title: true,
      instructions: true,
      passingScore: true,
      questions: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          text: true,
          options: {
            orderBy: { position: 'asc' },
            select: { id: true, text: true },
          },
        },
      },
    },
  });

  return { moduleId, position: mod.position, quiz };
}

// Califica el intento en el backend. El frontend nunca decide la aprobación.
async function submitQuizAttempt(userId, courseId, moduleId, answers) {
  const { module: mod } = await assertModuleAccessible(userId, courseId, moduleId);
  if (!mod.quiz) throw new AppError('Este módulo no tiene cuestionario.', 404);
  if (!mod.quiz.available) {
    throw new AppError(mod.quiz.blockedReason || 'El cuestionario no está disponible todavía.', 403);
  }

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    throw new AppError('Formato de respuestas inválido.', 400);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: mod.quiz.id },
    include: {
      questions: {
        orderBy: { position: 'asc' },
        include: { options: { orderBy: { position: 'asc' } } },
      },
    },
  });

  let correctCount = 0;
  quiz.questions.forEach((q, index) => {
    const raw = answers[String(q.id)];
    if (raw === undefined || raw === null || raw === '') {
      throw new AppError(`Falta responder la pregunta ${index + 1}.`, 400);
    }
    const optionId = Number(raw);
    const option = q.options.find((o) => o.id === optionId);
    if (!option) {
      throw new AppError(`La respuesta de la pregunta ${index + 1} no es válida.`, 400);
    }
    if (option.isCorrect) correctCount += 1;
  });

  const totalQuestions = quiz.questions.length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= quiz.passingScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId,
      courseId,
      score,
      correctCount,
      totalQuestions,
      passed,
    },
  });

  // Aprobar el cuestionario del Módulo 3 finaliza el curso.
  if (passed && mod.position === MODULE_COUNT) {
    await prisma.enrollment.updateMany({
      where: { courseId, userId, completedAt: null },
      data: { completedAt: new Date() },
    });
  }

  return {
    score,
    passed,
    correctCount,
    totalQuestions,
    passingScore: quiz.passingScore,
    attemptedAt: attempt.createdAt,
  };
}

// Valida el cuerpo de una pregunta (texto + opciones con una sola correcta).
function validateQuestionPayload(body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) throw new AppError('La pregunta no puede estar vacía.', 400);

  if (!Array.isArray(body.options)) throw new AppError('Debes enviar las opciones de respuesta.', 400);

  const options = body.options.map((o) => ({
    text: typeof o?.text === 'string' ? o.text.trim() : '',
    isCorrect: Boolean(o?.isCorrect),
  }));

  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new AppError(`Cada pregunta debe tener entre ${MIN_OPTIONS} y ${MAX_OPTIONS} opciones.`, 400);
  }
  if (options.some((o) => !o.text)) {
    throw new AppError('Todas las opciones deben tener texto.', 400);
  }
  if (options.filter((o) => o.isCorrect).length !== 1) {
    throw new AppError('Debes marcar exactamente una respuesta correcta.', 400);
  }

  return { text, options };
}

module.exports = {
  MODULE_COUNT,
  DEFAULT_PASSING_SCORE,
  ensureCourseStructure,
  requireAcceptedEnrollment,
  buildCourseProgress,
  assertModuleAccessible,
  markResourceCompleted,
  getStudentQuiz,
  submitQuizAttempt,
  validateQuestionPayload,
};
