const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');

exports.getDocuments = asyncHandler(async (req, res, next) => {
  const documents = await prisma.corporateDocument.findMany({
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: documents });
});

exports.createDocument = asyncHandler(async (req, res, next) => {
  const { title, description } = req.body;

  if (!title || !title.trim()) throw new AppError('El título es obligatorio.', 400);
  if (!req.file) throw new AppError('Debes seleccionar un archivo.', 400);

  const document = await prisma.corporateDocument.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    },
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.status(201).json({ success: true, data: document });
});

exports.updateDocument = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const current = await prisma.corporateDocument.findUnique({ where: { id } });
  if (!current) throw new AppError('Documento no encontrado.', 404);

  const data = {};
  if (req.body.title !== undefined) {
    if (!req.body.title.trim()) throw new AppError('El título es obligatorio.', 400);
    data.title = req.body.title.trim();
  }
  if (req.body.description !== undefined) {
    data.description = req.body.description.trim() || null;
  }
  if (req.file) {
    data.fileUrl = `/uploads/documents/${req.file.filename}`;
    data.originalName = req.file.originalname;
    data.fileType = req.file.mimetype;
    data.fileSize = req.file.size;
  }

  const document = await prisma.corporateDocument.update({
    where: { id },
    data,
    include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
  });

  res.json({ success: true, data: document });
});

exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const document = await prisma.corporateDocument.findUnique({ where: { id } });
  if (!document) throw new AppError('Documento no encontrado.', 404);

  await prisma.corporateDocument.delete({ where: { id } });

  res.json({ success: true, message: 'Documento eliminado.' });
});