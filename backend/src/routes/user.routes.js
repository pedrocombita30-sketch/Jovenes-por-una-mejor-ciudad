const router = require('express').Router();
const userCtrl = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Read: ADMIN y COLABORADOR (para asignar responsables)
router.get('/', authorize('ADMIN', 'COLABORADOR'), userCtrl.getUsers);
router.get('/:id', authorize('ADMIN', 'COLABORADOR'), userCtrl.getUser);

// Escritura: solo ADMIN
router.post('/', authorize('ADMIN'), userCtrl.createUser);
router.put('/:id', authorize('ADMIN'), userCtrl.updateUser);
router.delete('/:id', authorize('ADMIN'), userCtrl.deactivateUser);

module.exports = router;