const prisma = require('../config/database');
const { asyncHandler } = require('../utils/helpers');

exports.getStats = asyncHandler(async (req, res, next) => {
  const now = new Date();

  const [users, clients, clientsInFollowUp, courses, pendingEnrollmentsCount, recentInteractions, openConversations, escalatedConversations, pendingFollowUps, notifications] =
    await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.client.count({ where: { status: 'EN_SEGUIMIENTO' } }),
      prisma.course.count(),
      prisma.enrollment.count({ where: { status: 'PENDIENTE' } }),
      prisma.interaction.findMany({
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.conversation.count({ where: { status: 'ACTIVA' } }),
      prisma.conversation.count({ where: { status: 'ESCALADA' } }),
      prisma.followUp.count({ where: { status: 'PENDIENTE' } }),
      prisma.notification.findMany({
        where: { userId: req.user.id, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

  // Distribución de clientes por estado
  const clientStatuses = await prisma.client.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  // Inscripciones de cursos pendientes de revisar
  const pendingEnrollments = await prisma.enrollment.findMany({
    where: { status: 'PENDIENTE' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      course: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Conversaciones recientes
  const recentConversations = await prisma.conversation.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  // Mensajes del chatbot por día (últimos 7 días)
  const lastWeek = new Date(now.getTime() - 7 * 86400000);
  const chatMessages = await prisma.message.findMany({
    where: { createdAt: { gte: lastWeek }, sender: { in: ['USUARIO', 'BOT'] } },
    select: { createdAt: true, sender: true },
  });

  const chatByDay = {};
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const key = day.toISOString().split('T')[0];
    chatByDay[key] = 0;
  }
  for (const m of chatMessages) {
    const key = m.createdAt.toISOString().split('T')[0];
    if (key in chatByDay) chatByDay[key] += 1;
  }

  const statusMap = {};
  for (const s of ['NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'ATENDIDO', 'FINALIZADO']) {
    statusMap[s] = 0;
  }
  for (const s of clientStatuses) statusMap[s.status] = s._count._all;

  res.json({
    success: true,
    data: {
      counts: {
        users,
        clients,
        clientsInFollowUp,
        courses,
        pendingEnrollmentsCount,
        openConversations,
        escalatedConversations,
        pendingFollowUps,
      },
      recentInteractions,
      pendingEnrollments,
      recentConversations,
      unreadNotifications: notifications,
      charts: {
        clientsByStatus: statusMap,
        chatByDay,
      },
    },
  });
});

module.exports = exports;