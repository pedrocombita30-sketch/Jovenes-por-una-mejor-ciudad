const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { isAllowedUpload } = require('../utils/uploads');
const activityCtrl = require('../controllers/activity.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, isAllowedUpload(file, 'image'));
  },
});

// Public read
router.get('/', optionalAuth, activityCtrl.getActivities);
router.get('/:id', optionalAuth, activityCtrl.getActivity);

router.use(protect);

router.post('/', authorize('ADMIN', 'COLABORADOR'), upload.single('image'), activityCtrl.createActivity);
router.put('/:id', authorize('ADMIN', 'COLABORADOR'), upload.single('image'), activityCtrl.updateActivity);
router.delete('/:id', authorize('ADMIN', 'COLABORADOR'), activityCtrl.deleteActivity);

router.post('/:activityId/register', activityCtrl.registerToActivity);
router.delete('/:activityId/register', activityCtrl.unregisterFromActivity);

router.get('/my/registered', activityCtrl.getUserActivities);

router.put('/participants/:id/status', authorize('ADMIN', 'COLABORADOR'), activityCtrl.updateParticipantStatus);

module.exports = router;