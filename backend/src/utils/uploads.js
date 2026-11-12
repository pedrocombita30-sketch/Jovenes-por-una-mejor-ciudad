const path = require('path');

// Archivos que el navegador puede ejecutar como página o script dentro del dominio del sitio.
// Se rechazan aunque el nombre o el tipo MIME parezca válido.
const DANGEROUS_EXT = /\.(html?|xhtml|xml|js|mjs|php|exe|bat|cmd|sh|ps1|jar)$/i;

// Filtro común de Multer: permite solo lo que ya estaba permitido, excluyendo tipos ejecutables.
function isSafeUpload(file) {
  const name = (file.originalname || '').toLowerCase();
  if (DANGEROUS_EXT.test(name)) return false;
  if ((file.mimetype || '').toLowerCase() === 'text/html') return false;
  return Boolean(path.extname(name));
}

module.exports = { isSafeUpload };
