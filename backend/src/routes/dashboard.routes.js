const router = require('express').Router();
const dashboardCtrl = require('../controllers/dashboard.controller');
const notifCtrl = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('ADMIN', 'COLABORADOR'), dashboardCtrl.getStats);

router.get('/notifications', notifCtrl.getMyNotifications);
router.put('/notifications/:id/read', notifCtrl.markAsRead);
router.put('/notifications/read-all', notifCtrl.markAllAsRead);

module.exports = router;