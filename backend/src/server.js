require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');

// Garantiza que las carpetas de uploads existan (evita ENOENT en clones nuevos y despliegues).
for (const dir of [
  path.join(__dirname, 'uploads', 'images'),
  path.join(__dirname, 'uploads', 'documents'),
  path.join(__dirname, 'private-uploads'),
]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Aviso si el secreto de los tokens es débil o es el valor de ejemplo.
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32 || /cambia/i.test(jwtSecret)) {
  console.warn('[SEGURIDAD] JWT_SECRET es débil o es el valor de ejemplo. Define un secreto largo y aleatorio.');
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de Jovenes por una Mejor Ciudad escuchando en http://localhost:${PORT}`);
});