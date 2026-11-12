const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { isSafeUpload } = require('../utils/uploads');
const { protect, authorize } = require('../middleware/auth');
const corporateCtrl = require('../controllers/corporate.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar|7z|png|jpg|jpeg|svg|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = /application|text|image/.test(file.mimetype);
    cb(null, (ext || mime) && isSafeUpload(file));
  },
});

// Public read
router.get('/', corporateCtrl.getDocuments);

// Protected write
router.use(protect);
router.use(authorize('ADMIN', 'COLABORADOR'));

router.post('/', upload.single('file'), corporateCtrl.createDocument);
router.put('/:id', upload.single('file'), corporateCtrl.updateDocument);
router.delete('/:id', corporateCtrl.deleteDocument);

module.exports = router;