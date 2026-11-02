require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de Jóvenes por una Mejor Ciudad escuchando en http://localhost:${PORT}`);
});