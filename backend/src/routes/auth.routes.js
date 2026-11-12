const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate, validators } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

// Protección contra fuerza bruta: 20 intentos fallidos por IP cada 15 minutos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  onlyFailures: true,
  message: 'Demasiados intentos fallidos. Espera 15 minutos e inténtalo de nuevo.',
});
// Registros: 10 por IP por hora.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Se alcanzó el límite de registros desde esta conexión. Intenta más tarde.',
});

router.post('/register', registerLimiter, validate(validators.register), authCtrl.register);
router.post('/login', loginLimiter, validate(validators.login), authCtrl.login);
router.get('/me', protect, authCtrl.me);
router.put('/me', protect, authCtrl.updateProfile);

module.exports = router;