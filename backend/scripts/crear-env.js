// Crea backend/.env a partir de .env.example si no existe, con un JWT_SECRET aleatorio.
// Así el secreto nunca es el valor de ejemplo que está publicado en el repositorio.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const backendDir = path.join(__dirname, '..');
const envPath = path.join(backendDir, '.env');
const examplePath = path.join(backendDir, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('backend/.env ya existe; no se modifica.');
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString('hex');
const example = fs.readFileSync(examplePath, 'utf8');
const content = example.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${secret}"`);

fs.writeFileSync(envPath, content, 'utf8');
console.log('backend/.env creado con un JWT_SECRET aleatorio.');
