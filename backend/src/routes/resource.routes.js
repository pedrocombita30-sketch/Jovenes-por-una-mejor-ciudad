const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { isAllowedUpload } = require('../utils/uploads');
const { protect, authorize } = require('../middleware/auth');
const resourceCtrl = require('../controllers/resource.controller');
const { validate, validators } = require('../middleware/validation');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../private-uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, isAllowedUpload(file, 'document'));
  },
});

router.use(protect);

router.get('/', authorize('ADMIN', 'COLABORADOR'), resourceCtrl.getResources);
router.get('/:id', authorize('ADMIN', 'COLABORADOR'), resourceCtrl.getResource);
router.get('/:id/download', resourceCtrl.downloadResource);

router.post('/', authorize('ADMIN', 'COLABORADOR'), upload.single('file'), validate(validators.createResource), resourceCtrl.createResource);
router.put('/:id', authorize('ADMIN', 'COLABORADOR'), upload.single('file'), resourceCtrl.updateResource);
router.delete('/:id', authorize('ADMIN', 'COLABORADOR'), resourceCtrl.deleteResource);

module.exports = router;