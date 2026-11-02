const router = require('express').Router();
const clientCtrl = require('../controllers/client.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate, validators } = require('../middleware/validation');

router.use(protect);
router.use(authorize('ADMIN', 'COLABORADOR'));

router.get('/status-counts', clientCtrl.getStatusCounts);
router.get('/', clientCtrl.getClients);
router.get('/:id', clientCtrl.getClient);
router.post('/', validate(validators.createClient), clientCtrl.createClient);
router.put('/:id', clientCtrl.updateClient);
router.delete('/:id', clientCtrl.deleteClient);

router.get('/:clientId/interactions', clientCtrl.getClientInteractions);
router.post('/:clientId/interactions', clientCtrl.createInteraction);
router.delete('/interactions/:id', clientCtrl.deleteInteraction);

router.get('/:clientId/followups', clientCtrl.getClientFollowUps);
router.post('/:clientId/followups', clientCtrl.createFollowUp);
router.put('/followups/:id', clientCtrl.updateFollowUp);
router.delete('/followups/:id', clientCtrl.deleteFollowUp);

module.exports = router;