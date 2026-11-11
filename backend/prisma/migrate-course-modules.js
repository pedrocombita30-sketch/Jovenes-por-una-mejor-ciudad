// Migración de datos para el módulo de cursos por módulos.
// Idempotente: puede ejecutarse varias veces sin duplicar nada.
//   1. Crea los tres módulos y su cuestionario en cada curso existente.
//   2. Asigna al Módulo 1 los materiales que tienen curso pero aún no tienen módulo.
// Uso: node prisma/migrate-course-modules.js
const prisma = require('../src/config/database');
const { ensureCourseStructure } = require('../src/services/course.service');

async function main() {
  const courses = await prisma.course.findMany({ select: { id: true, name: true } });
  console.log(`Cursos encontrados: ${courses.length}`);

  for (const course of courses) {
    await ensureCourseStructure(course.id);

    const firstModule = await prisma.courseModule.findFirst({
      where: { courseId: course.id, position: 1 },
    });

    // Numeración desde 0: los títulos por defecto "Módulo N" (y sus cuestionarios) pasan a "Módulo N-1".
    // Solo se renombran los títulos que siguen siendo los genéricos; los personalizados no se tocan.
    const modules = await prisma.courseModule.findMany({
      where: { courseId: course.id },
      include: { quiz: true },
    });
    for (const m of modules) {
      if (m.title === `Módulo ${m.position}`) {
        await prisma.courseModule.update({
          where: { id: m.id },
          data: { title: `Módulo ${m.position - 1}` },
        });
      }
      if (m.quiz && m.quiz.title === `Cuestionario del Módulo ${m.position}`) {
        await prisma.quiz.update({
          where: { id: m.quiz.id },
          data: { title: `Cuestionario del Módulo ${m.position - 1}` },
        });
      }
    }

    const moved = await prisma.resource.updateMany({
      where: { courseId: course.id, moduleId: null },
      data: { moduleId: firstModule.id },
    });

    console.log(`- ${course.name}: 3 módulos listos; ${moved.count} material(es) asignados al Módulo 1.`);
  }

  console.log('Migración completada.');
}

main()
  .catch((e) => {
    console.error('Error en la migración:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
