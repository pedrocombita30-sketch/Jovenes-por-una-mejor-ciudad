require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');

// Garantiza que las carpetas de uploads existan (evita ENOENT en clones nuevos y despliegues).
for (const sub of ['images', 'documents']) {
  const dir = path.join(__dirname, 'uploads', sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de Jovenes por una Mejor Ciudad escuchando en http://localhost:${PORT}`);
});