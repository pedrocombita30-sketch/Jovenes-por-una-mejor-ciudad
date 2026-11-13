const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const activityRoutes = require('./routes/activity.routes');
const resourceRoutes = require('./routes/resource.routes');
const chatRoutes = require('./routes/chat.routes');
const contentRoutes = require('./routes/content.routes');
const corporateRoutes = require('./routes/corporate.routes');
const courseRoutes = require('./routes/course.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const { notFoundHandler, errorHandler } = require('./utils/helpers');

const app = express();

// Detrás de un proxy (p. ej. Render) hay que indicar cuántos saltos confiar para usar la IP real.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY === 'true');
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Archivos públicos (imágenes y documentos corporativos). Los materiales de cursos NO están aquí:
// se entregan con control de inscripción desde /api/resources/:id/download.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const ext = path.extname(filePath).toLowerCase();
      // Un SVG abierto directamente no puede ejecutar scripts ni cargar recursos externos.
      if (ext === '.svg') {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      }
      // Imágenes y PDF se muestran en la página; cualquier otro archivo se descarga y no se renderiza.
      const inline = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.pdf'];
      if (!inline.includes(ext)) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  })
);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando correctamente.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);

const frontendDist = path.join(__dirname, '../../frontend/dist');
const frontendIndex = path.join(frontendDist, 'index.html');

if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(frontendIndex);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;