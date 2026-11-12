const router = require('express').Router();
const chatCtrl = require('../controllers/chat.controller');
const { protect, authorize } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// Mensajes del chat: 30 por IP por minuto.
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Estás enviando mensajes muy rápido. Espera un momento.',
});

// Public: send message (anonymous or authenticated)
router.post('/', messageLimiter, chatCtrl.sendMessage);
router.get('/conversations/:id/poll', chatCtrl.pollConversation);

// Protected
router.use(protect);

router.get('/my', chatCtrl.getMyConversation);
router.get('/conversations', authorize('ADMIN', 'COLABORADOR'), chatCtrl.getConversations);
router.get('/conversations/:id', authorize('ADMIN', 'COLABORADOR'), chatCtrl.getConversation);
router.post('/conversations/:id/escalate', authorize('ADMIN', 'COLABORADOR'), chatCtrl.escalateConversation);
router.post('/conversations/:id/reply', authorize('ADMIN', 'COLABORADOR'), chatCtrl.collaboratorReply);
router.put('/conversations/:id/close', authorize('ADMIN', 'COLABORADOR'), chatCtrl.closeConversation);

module.exports = router;