const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate, validators } = require('../middleware/validation');

router.post('/register', validate(validators.register), authCtrl.register);
router.post('/login', validate(validators.login), authCtrl.login);
router.get('/me', protect, authCtrl.me);
router.put('/me', protect, authCtrl.updateProfile);

module.exports = router;