const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { isAllowedUpload } = require('../utils/uploads');
const contentCtrl = require('../controllers/content.controller');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/images');
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, isAllowedUpload(file, 'image'));
  },
});

// Public read
router.get('/', contentCtrl.getPublicContent);
router.get('/knowledge/all', contentCtrl.getKnowledge);
router.get('/:slug', contentCtrl.getContentBySlug);

router.use(protect);
router.use(authorize('ADMIN'));

// Image upload (activities realizadas de la fundación)
router.post('/upload', upload.single('image'), contentCtrl.uploadContentImage);

// Content CRUD
router.post('/', contentCtrl.createContent);
router.put('/:slug', contentCtrl.updateContent);
router.delete('/:slug', contentCtrl.deleteContent);

// Knowledge CRUD
router.post('/knowledge', contentCtrl.createKnowledge);
router.put('/knowledge/:id', contentCtrl.updateKnowledge);
router.delete('/knowledge/:id', contentCtrl.deleteKnowledge);

module.exports = router;