const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Roles
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Acceso completo al sistema' },
  });
  const roleColab = await prisma.role.upsert({
    where: { name: 'COLABORADOR' },
    update: {},
    create: { name: 'COLABORADOR', description: 'Gestiona usuarios, clientes y actividades' },
  });
  const roleCliente = await prisma.role.upsert({
    where: { name: 'CLIENTE' },
    update: {},
    create: { name: 'CLIENTE', description: 'Usuario final de la plataforma' },
  });

  console.log('Roles listos.');

  // Usuarios de prueba
  const password = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@jovenes-ciudad.org' },
    update: {},
    create: {
      email: 'admin@jovenes-ciudad.org',
      password,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      phone: '+58 555-0101',
      roleId: roleAdmin.id,
    },
  });

  const colaborador = await prisma.user.upsert({
    where: { email: 'colaborador@jovenes-ciudad.org' },
    update: {},
    create: {
      email: 'colaborador@jovenes-ciudad.org',
      password,
      firstName: 'Carlos',
      lastName: 'Pérez',
      phone: '+58 555-0102',
      roleId: roleColab.id,
    },
  });

  const usuario = await prisma.user.upsert({
    where: { email: 'usuario@example.com' },
    update: {},
    create: {
      email: 'usuario@example.com',
      password,
      firstName: 'Laura',
      lastName: 'Gómez',
      phone: '+58 555-0103',
      roleId: roleCliente.id,
    },
  });

  console.log('Usuarios de prueba listos.');

  // Páginas de contenido por defecto
  const defaultPages = [
    {
      slug: 'inicio',
      title: 'Fundación Jóvenes por una Mejor Ciudad',
      content:
        'Somos una organización juvenil dedicada a transformar nuestra ciudad a través de la participación ciudadana, la educación y el voluntariado social. Trabajamos junto a jóvenes, comunidades y aliados para construir una ciudad más justa, inclusiva y sostenible.',
      imageUrl: null,
    },
    {
      slug: 'quienes-somos',
      title: 'Quiénes Somos',
      content:
        'Somos una fundación comprometida con el desarrollo integral de la juventud y el fortalecimiento de nuestras comunidades. Desde las diferentes ciudades de Colombia, trabajamos por un país más equitativo, educado y sostenible, donde los jóvenes sean protagonistas de la transformación.',
      imageUrl: null,
    },
    {
      slug: 'programas',
      title: 'Programas y Actividades',
      content:
        'Desarrollamos programas y actividades orientados a la participación ciudadana, el desarrollo comunitario y la formación juvenil.\n\nEntre nuestros programas destacados se incluyen jornadas de limpieza urbana, talleres de liderazgo, ferias comunitarias, campañas de concienciación ambiental y espacios de formación en ciudadanía activa.\n\nConsulta la sección de actividades para conocer las próximas convocatorias y cómo participar.',
      imageUrl: null,
    },
    {
      slug: 'capacitaciones',
      title: 'Capacitaciones y Charlas',
      content:
        'Ofrecemos capacitaciones y charlas gratuitas para jóvenes y miembros de la comunidad.\n\nLos temas incluyen: liderazgo juvenil, primeros auxilios, emprendimiento social, manejo de residuos, participación ciudadana, herramientas digitales y más.\n\nLas capacitaciones son impartidas por especialistas y voluntarios con experiencia en cada área.',
      imageUrl: null,
    },
    {
      slug: 'actividades',
      title: 'Actividades de la Fundación',
      content:
        'Conoce todas las capacitaciones, charlas y actividades que realizamos.\n\nInscríbete en las que te interesen: todas son gratuitas y abiertas a la comunidad. Publicamos nuevas convocatorias con regularidad, así que revisa esta sección con frecuencia.',
      imageUrl: null,
    },
    {
      slug: 'recursos',
      title: 'Recursos',
      content:
        'Ponemos a disposición de la comunidad materiales educativos, presentaciones, guías y enlaces de interés.\n\nTodos nuestros recursos son de acceso gratuito y pueden descargarse desde esta sección.',
      imageUrl: null,
    },
    {
      slug: 'contacto',
      title: 'Contacto',
      content:
        '¿Quieres participar o tienes alguna pregunta?\n\nEscríbenos a jovenesunamejorciudad@gmail.com o visítanos en nuestra sede comunitaria.\n\nTambién puedes utilizar nuestro asistente virtual para recibir atención inmediata.',
      imageUrl: null,
    },
  ];

  for (const page of defaultPages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('Páginas de contenido listas.');

  // Base de conocimientos del chatbot
  const knowledge = [
    {
      keywords: 'horario,atencion,contactar',
      question: '¿Cuál es el horario de atención de la organización?',
      answer:
        'Nuestro horario de atención es de lunes a viernes de 9:00 a.m. a 5:00 p.m. Puedes contactarnos escribiendo a jovenesunamejorciudad@gmail.com o llamándonos al +58 555-0101.',
    },
    {
      keywords: 'actividades,programas,participar,inscribirse',
      question: '¿Cómo puedo participar en las actividades?',
      answer:
        'Puedes participar registrándote en nuestro sitio web. Ve a la sección "Programas y Actividades", elige la actividad de tu interés y pulsa el botón de inscripción. Si tienes una cuenta, tu registro queda confirmado automáticamente.',
    },
    {
      keywords: 'capacitaciones,charlas,talleres,cursos',
      question: '¿Qué capacitaciones ofrecen?',
      answer:
        'Ofrecemos capacitaciones y charlas gratuitas sobre liderazgo juvenil, emprendimiento social, participación ciudadana, primeros auxilios, manejo de residuos y herramientas digitales. Revisa la sección "Capacitaciones" para ver las próximas fechas.',
    },
    {
      keywords: 'misión,vision,objetivo',
      question: '¿Cuál es la misión de la organización?',
      answer:
        'Nuestra misión es empoderar a la juventud para que participe activamente en la construcción de comunidades más justas y sostenibles. Nuestra visión: ser una ciudad donde cada joven tenga las herramientas y oportunidades para transformar su entorno.',
    },
    {
      keywords: 'voluntariado,voluntario,ayudar,donar,colaborar',
      question: '¿Cómo puedo ser voluntario o colaborar?',
      answer:
        '¡Nos encantaría contar contigo! Puedes escribirnos a jovenesunamejorciudad@gmail.com para unirte como voluntario, o registrarte en nuestro sitio para recibir información sobre oportunidades de participación. También aceptamos donaciones y alianzas institucionales.',
    },
    {
      keywords: 'contacto,telefono,email,correo,direccion,ubicacion',
      question: '¿Cómo puedo contactarlos?',
      answer:
        'Puedes escribirnos a jovenesunamejorciudad@gmail.com, llamarnos al +58 555-0101, o visitar nuestra sede comunitaria de lunes a viernes de 9:00 a.m. a 5:00 p.m.',
    },
    {
      keywords: 'recursos,documentos,materiales,descargar,descarga',
      question: '¿Dónde puedo descargar materiales y recursos?',
      answer:
        'Todos nuestros recursos educativos están disponibles en la sección "Recursos" de este sitio web. Allí encontrarás documentos, presentaciones y enlaces de interés de acceso gratuito.',
    },
    {
      keywords: 'inscripcion,registro,cuenta,crear cuenta',
      question: '¿Cómo creo una cuenta?',
      answer:
        'Pulsa el botón "Ingresar" en la parte superior y selecciona la opción "Registrarse". Completa el formulario con tus datos y podrás inscribirte en actividades y acceder a todos nuestros servicios.',
    },
  ];

  for (const k of knowledge) {
    await prisma.chatbotKnowledge.create({ data: k });
  }

  console.log('Conocimiento del chatbot listo.');

  // Clientes de ejemplo
  const clientesDemo = [
    {
      firstName: 'Mariana',
      lastName: 'Fernández',
      email: 'mariana@example.com',
      phone: '+58 555-0201',
      status: 'EN_SEGUIMIENTO',
      notes: 'Interesada en el programa de liderazgo juvenil.',
      assignedTo: colaborador.id,
      createdBy: admin.id,
    },
    {
      firstName: 'Diego',
      lastName: 'Martínez',
      email: 'diego@example.com',
      phone: '+58 555-0202',
      status: 'CONTACTADO',
      notes: 'Asistió a la charla de participación ciudadana.',
      assignedTo: colaborador.id,
      createdBy: admin.id,
    },
    {
      firstName: 'Sofía',
      lastName: 'Rojas',
      email: 'sofia@example.com',
      phone: '+58 555-0203',
      status: 'NUEVO',
      notes: '',
      assignedTo: null,
      createdBy: colaborador.id,
    },
    {
      firstName: 'Andrés',
      lastName: 'Torres',
      email: 'andres@example.com',
      phone: '+58 555-0204',
      status: 'ATENDIDO',
      notes: 'Completó el taller de emprendimiento social.',
      assignedTo: colaborador.id,
      createdBy: admin.id,
    },
  ];

  for (const c of clientesDemo) {
    await prisma.client.create({ data: c });
  }

  console.log('Clientes de ejemplo listos.');

  // Actividades de ejemplo
  const actividades = [
    {
      title: 'Taller de Liderazgo Juvenil',
      description: 'Taller práctico para desarrollar habilidades de liderazgo y trabajo en equipo.',
      type: 'TALLER',
      startDate: new Date(new Date().getTime() + 7 * 86400000),
      location: 'Sede comunitaria, Salón principal',
      modality: 'PRESENCIAL',
      status: 'PROGRAMADA',
      maxParticipants: 30,
      createdBy: admin.id,
    },
    {
      title: 'Foro: Participación Ciudadana',
      description: 'Conversatorio sobre cómo participar activamente en las decisiones de la ciudad.',
      type: 'FORO',
      startDate: new Date(new Date().getTime() + 3 * 86400000),
      modality: 'VIRTUAL',
      status: 'PROGRAMADA',
      maxParticipants: 100,
      createdBy: admin.id,
    },
    {
      title: 'Jornada de Limpieza Urbana',
      description: 'Voluntariado comunitario para recuperar espacios públicos del barrio La Esperanza.',
      type: 'ACTIVIDAD_CAMPO',
      startDate: new Date(new Date().getTime() + 14 * 86400000),
      location: 'Barrio La Esperanza',
      modality: 'PRESENCIAL',
      status: 'PROGRAMADA',
      maxParticipants: 50,
      createdBy: colaborador.id,
    },
  ];

  for (const a of actividades) {
    await prisma.activity.create({ data: a });
  }

  console.log('Actividades de ejemplo listas.');

  // Interacción de ejemplo
  const clientesConId = await prisma.client.findMany({});
  if (clientesConId.length > 0) {
    await prisma.interaction.create({
      data: {
        clientId: clientesConId[0].id,
        userId: colaborador.id,
        type: 'LLAMADA',
        description: 'Se contactó a la usuaria para invitarle al taller de liderazgo.',
      },
    });

    await prisma.followUp.create({
      data: {
        clientId: clientesConId[0].id,
        userId: colaborador.id,
        status: 'EN_PROGRESO',
        description: 'Confirmar asistencia al taller antes del viernes.',
        dueDate: new Date(new Date().getTime() + 2 * 86400000).toISOString(),
      },
    });
  }

  console.log('Interacciones y seguimientos de ejemplo listos.');

  // Inscripción de ejemplo
  const actividadesConId = await prisma.activity.findMany({});
  if (actividadesConId.length > 0 && usuario) {
    await prisma.participant.create({
      data: {
        activityId: actividadesConId[0].id,
        userId: usuario.id,
        status: 'REGISTRADO',
      },
    });
  }

  console.log('Inscripción de ejemplo lista.');

  console.log('\nSeed completado exitosamente.');
  console.log('Usuarios de prueba:');
  console.log('  admin@jovenes-ciudad.org / Admin123! (Administrador)');
  console.log('  colaborador@jovenes-ciudad.org / Admin123! (Colaborador)');
  console.log('  usuario@example.com / Admin123! (Cliente)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });