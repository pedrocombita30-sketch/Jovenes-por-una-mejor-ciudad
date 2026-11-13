const AppError = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = `Ya existe un registro con ese valor único: ${err.meta?.target?.join(', ') || ''}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Registro no encontrado.';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'El registro hace referencia a un elemento que no existe.';
    }
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'El archivo supera el tamaño permitido.';
    else message = `Error al subir el archivo: ${err.message}`;
  }

  // Un error inesperado (base de datos, librerías) nunca expone su mensaje interno al visitante.
  if (statusCode === 500 && !err.isOperational) {
    message = 'Error interno del servidor.';
  }

  if (statusCode === 500) {
    console.error('ERROR -', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // La traza solo se muestra en desarrollo. Si NODE_ENV no está definido, tampoco se muestra.
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { AppError, asyncHandler, notFoundHandler, errorHandler };