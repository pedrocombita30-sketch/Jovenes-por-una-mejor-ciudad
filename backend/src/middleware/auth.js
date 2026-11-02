const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new AppError('No autorizado. Debes iniciar sesión.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Token inválido o expirado.', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Usuario no encontrado o desactivado.', 401);
  }

  req.user = user;
  next();
});

// Autenticacion opcional: si hay token valido, carga req.user; si no, continua.
// Se usa en rutas publicas que 개인izan la respuesta segun quien pregunta.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // Token invalido en ruta publica: se ignora.
  }
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('No autorizado.', 401);
    }
    if (!roles.includes(req.user.role.name)) {
      throw new AppError('No tienes permisos para realizar esta acción.', 403);
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };