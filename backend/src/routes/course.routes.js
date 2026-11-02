const router = require('express').Router();
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const courseCtrl = require('../controllers/course.controller');
const classroomCtrl = require('../controllers/classroom.controller');
const structureCtrl = require('../controllers/course-structure.controller');

// ========== Publico ==========
// Catalogo visible sin sesion; si hay token, muestra el estado de mi inscripcion.
router.get('/', optionalAuth, courseCtrl.getCourses);

router.use(protect);

// ========== Alumno (inscripcion aceptada) ==========
// Resumen de progreso de mis cursos aceptados
router.get('/mine/classroom', classroomCtrl.getMyClassroom);

// Aula de un curso: modulos, materiales, progreso y cuestionarios
router.get('/:id/classroom', classroomCtrl.getClassroom);

// Finalizacion automatica de un material (al abrirlo)
router.post('/materials/:resourceId/complete', classroomCtrl.completeMaterial);

// Cuestionario de un modulo (sin respuestas correctas) y envio de intentos
router.get('/:courseId/modules/:moduleId/quiz', classroomCtrl.getQuiz);
router.post('/:courseId/modules/:moduleId/quiz/attempts', classroomCtrl.submitQuiz);

// Solicitar inscripción (queda pendiente de aprobación)
router.post('/:id/enroll', courseCtrl.enroll);
router.delete('/:id/enroll', courseCtrl.cancelEnrollment);

// ========== Personal: ADMIN y COLABORADOR ==========
router.use(authorize('ADMIN', 'COLABORADOR'));

router.get('/manage/all', courseCtrl.getAllCourses);
router.post('/', courseCtrl.createCourse);
router.put('/:id', courseCtrl.updateCourse);
router.delete('/:id', courseCtrl.deleteCourse);

// Estructura del curso: modulos, cuestionarios y preguntas
router.get('/manage/:id/structure', structureCtrl.getStructure);
router.put('/manage/modules/:moduleId', structureCtrl.updateModule);
router.put('/manage/modules/:moduleId/quiz', structureCtrl.updateQuiz);
router.post('/manage/modules/:moduleId/quiz/questions', structureCtrl.createQuestion);
router.put('/manage/questions/:questionId', structureCtrl.updateQuestion);
router.delete('/manage/questions/:questionId', structureCtrl.deleteQuestion);

// Inscripciones
router.get('/enrollments/all', courseCtrl.getEnrollments);
router.put('/enrollments/:id', courseCtrl.reviewEnrollment);
router.delete('/enrollments/:id', courseCtrl.deleteEnrollment);

module.exports = router;
