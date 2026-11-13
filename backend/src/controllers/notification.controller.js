const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');

exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ success: true, data: notifications });
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  // Solo se pueden marcar notificaciones propias. Una ajena se trata como inexistente (404).
  const result = await prisma.notification.updateMany({
    where: { id, userId: req.user.id },
    data: { isRead: true },
  });
  if (result.count === 0) throw new AppError('Notificación no encontrada.', 404);

  res.json({ success: true, message: 'Notificación marcada como leída.' });
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, message: 'Notificaciones marcadas como leídas.' });
});

module.exports = exports;