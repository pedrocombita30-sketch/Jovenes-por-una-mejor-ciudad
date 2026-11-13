const path = require('path');

// Lista de tipos PERMITIDOS (no de prohibidos): cualquier extensión que no esté aquí se rechaza.
const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
const DOCUMENT_EXT = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'zip', 'rar', '7z'];

const ALLOWED = {
  image: IMAGE_EXT,
  document: [...IMAGE_EXT, ...DOCUMENT_EXT],
};

// Filtro común de Multer. 'image' para imágenes; 'document' para documentos (incluye imágenes).
function isAllowedUpload(file, kind = 'document') {
  const ext = path.extname(file.originalname || '').slice(1).toLowerCase();
  if (!ext || !ALLOWED[kind].includes(ext)) return false;
  // Defensa adicional: nunca aceptar contenido declarado como HTML, aunque la extensión sea válida.
  if ((file.mimetype || '').toLowerCase() === 'text/html') return false;
  return true;
}

module.exports = { isAllowedUpload, IMAGE_EXT, DOCUMENT_EXT };
