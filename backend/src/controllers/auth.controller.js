const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const publicUser = (user) => {
  const { password, roleId, ...rest } = user;
  return {
    ...rest,
    role: user.role ? user.role.name : undefined,
  };
};

exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Ya existe una cuenta con este correo electrónico.', 409);
  }

  const clienteRole = await prisma.role.findUnique({ where: { name: ROLES.CLIENTE } });
  if (!clienteRole) {
    throw new AppError('No se puede completar el registro en este momento.', 500);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      roleId: clienteRole.id,
    },
    include: { role: true },
  });

  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: 'Cuenta creada exitosamente.',
    token,
    user: publicUser(user),
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const token = generateToken(user.id);

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso.',
    token,
    user: publicUser(user),
  });
});

exports.me = asyncHandler(async (req, res, next) => {
  res.json({ success: true, user: publicUser(req.user) });
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, phone, password: newPassword, currentPassword } = req.body;

  const data = { firstName, lastName, phone };
  if (newPassword) {
    if (String(newPassword).length < 8) {
      throw new AppError('La nueva contraseña debe tener al menos 8 caracteres.', 400);
    }
    // Para cambiar la contraseña hay que confirmar la actual. Se responde 400 (no 401) para que el
    // frontend no cierre la sesión por un error de confirmación.
    const actualOk = Boolean(currentPassword) && (await bcrypt.compare(String(currentPassword), req.user.password));
    if (!actualOk) {
      throw new AppError('Debes escribir tu contraseña actual correctamente para cambiarla.', 400);
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    include: { role: true },
  });

  res.json({ success: true, user: publicUser(user) });
});

module.exports = exports;