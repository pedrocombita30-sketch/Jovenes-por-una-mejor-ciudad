const prisma = require('../config/database');
const { AppError, asyncHandler } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

const publicUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

exports.getUsers = asyncHandler(async (req, res, next) => {
  const { search, role, isActive } = req.query;

  const where = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (role) where.role = { name: role };
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await prisma.user.findMany({
    where,
    include: { role: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: users.map(publicUser) });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      clientsAssigned: { select: { id: true, firstName: true, lastName: true, status: true } },
      _count: { select: { interactions: true, followUps: true, activities: true } },
    },
  });

  if (!user) throw new AppError('Usuario no encontrado.', 404);
  res.json({ success: true, data: publicUser(user) });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  const { email, password, firstName, lastName, phone, role } = req.body;

  const targetRole = role || ROLES.CLIENTE;

  if (targetRole === ROLES.ADMIN) {
    throw new AppError('Desde el panel solo se crean colaboradores y clientes. Para crear un administrador usa el script crear-usuario.js.', 403);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Ya existe un usuario con este correo.', 409);

  const roleRecord = await prisma.role.findUnique({ where: { name: targetRole } });
  if (!roleRecord) throw new AppError('Rol inválido.', 400);

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      roleId: roleRecord.id,
    },
    include: { role: true },
  });

  res.status(201).json({ success: true, data: publicUser(user) });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { email, firstName, lastName, phone, role, isActive, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!existing) throw new AppError('Usuario no encontrado.', 404);

  const isAdmin = req.user.role.name === ROLES.ADMIN;

  const data = {};
  if (email) data.email = email;
  if (firstName) data.firstName = firstName;
  if (lastName) data.lastName = lastName;
  if (phone !== undefined) data.phone = phone;
  if (isActive !== undefined) data.isActive = isActive;
  if (role) {
    if (!isAdmin) throw new AppError('Solo un administrador puede cambiar roles.', 403);
    if (role === ROLES.ADMIN && existing.role?.name !== ROLES.ADMIN) {
      throw new AppError('No se puede promover a administrador desde el panel. Usa el script crear-usuario.js.', 403);
    }
    const roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) throw new AppError('Rol inválido.', 400);
    data.roleId = roleRecord.id;
  }
  if (password) {
    const bcrypt = require('bcryptjs');
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: true },
  });

  res.json({ success: true, data: publicUser(user) });
});

exports.deactivateUser = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    throw new AppError('No puedes desactivar tu propia cuenta.', 400);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    include: { role: true },
  });

  res.json({ success: true, data: publicUser(user) });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    throw new AppError('No puedes eliminar tu propia cuenta.', 400);
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true, message: 'Usuario eliminado.' });
});

module.exports = exports;