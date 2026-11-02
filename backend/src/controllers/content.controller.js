const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');

exports.uploadContentImage = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new AppError('Selecciona una imagen.', 400);
  res.status(201).json({
    success: true,
    data: { url: `/uploads/images/${req.file.filename}` },
  });
});

exports.uploadContentImage = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new AppError('Selecciona una imagen.', 400);
  res.status(201).json({
    success: true,
    data: { url: `/uploads/images/${req.file.filename}` },
  });
});

exports.getPublicContent = asyncHandler(async (req, res, next) => {
  const pages = await prisma.contentPage.findMany({});
  res.json({ success: true, data: pages });
});

exports.getContentBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const page = await prisma.contentPage.findUnique({ where: { slug } });
  if (!page) throw new AppError('Contenido no encontrado.', 404);

  res.json({ success: true, data: page });
});

exports.updateContent = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { title, content, imageUrl } = req.body;

  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (!existing) throw new AppError('Contenido no encontrado.', 404);

  const data = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (imageUrl !== undefined) data.imageUrl = imageUrl;

  const page = await prisma.contentPage.update({
    where: { slug },
    data,
  });

  res.json({ success: true, data: page });
});

exports.createContent = asyncHandler(async (req, res, next) => {
  const { slug, title, content, imageUrl } = req.body;

  if (!slug || !title) throw new AppError('Slug y título son obligatorios.', 400);

  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (existing) throw new AppError('Ya existe una página con ese slug.', 409);

  const page = await prisma.contentPage.create({
    data: { slug, title, content, imageUrl },
  });

  res.status(201).json({ success: true, data: page });
});

exports.deleteContent = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  await prisma.contentPage.delete({ where: { slug } });
  res.json({ success: true, message: 'Contenido eliminado.' });
});

// ---------- Conocimiento del chatbot ----------

exports.getKnowledge = asyncHandler(async (req, res, next) => {
  const knowledge = await prisma.chatbotKnowledge.findMany({
    orderBy: { id: 'asc' },
  });
  res.json({ success: true, data: knowledge });
});

exports.createKnowledge = asyncHandler(async (req, res, next) => {
  const { keywords, question, answer, active } = req.body;

  if (!keywords || !answer) throw new AppError('Palabras clave y respuesta son obligatorias.', 400);

  const entry = await prisma.chatbotKnowledge.create({
    data: { keywords, question, answer, active: active !== false },
  });

  res.status(201).json({ success: true, data: entry });
});

exports.updateKnowledge = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { keywords, question, answer, active } = req.body;

  const data = {};
  if (keywords !== undefined) data.keywords = keywords;
  if (question !== undefined) data.question = question;
  if (answer !== undefined) data.answer = answer;
  if (active !== undefined) data.active = active;

  const entry = await prisma.chatbotKnowledge.update({ where: { id }, data });
  res.json({ success: true, data: entry });
});

exports.deleteKnowledge = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  await prisma.chatbotKnowledge.delete({ where: { id } });
  res.json({ success: true, message: 'Entrada eliminada.' });
});

module.exports = exports;