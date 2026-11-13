/**
 * Crea (o actualiza la contraseña de) una cuenta de ADMINISTRADOR.
 * Uso: node crear-usuario.js <correo> <nombre> <apellido> [contraseña]
 *
 * Si no se pasa contraseña, se genera una aleatoria y se muestra una sola vez.
 * Desde el panel administrativo NO se pueden crear administradores.
 */
const crypto = require('crypto');
const prisma = require('./src/config/database');
const bcrypt = require('bcryptjs');

const [email, firstName, lastName, suppliedPassword] = process.argv.slice(2);

if (!email || !firstName || !lastName) {
  console.log('Uso: node crear-usuario.js <correo> <nombre> <apellido> [contraseña]');
  console.log('Ejemplo: node crear-usuario.js admin2@jovenes-ciudad.org Ana Torres');
  process.exit(1);
}

if (suppliedPassword !== undefined && suppliedPassword.length < 8) {
  console.error('Error: la contraseña debe tener al menos 8 caracteres.');
  process.exit(1);
}

const generated = suppliedPassword === undefined;
const password = generated ? crypto.randomBytes(9).toString('base64url') : suppliedPassword;

prisma.role
  .findUnique({ where: { name: 'ADMIN' } })
  .then((role) => {
    if (!role) {
      console.error('Error: el rol ADMIN no existe en la base de datos. Ejecuta primero el seed.');
      process.exit(1);
    }
    const hashed = bcrypt.hashSync(password, 10);
    return prisma.user.findUnique({ where: { email }, include: { role: true } }).then((existing) => {
      // Este script solo maneja administradores: nunca convierte en administrador a otra cuenta.
      if (existing && existing.role.name !== 'ADMIN') {
        throw new Error(`El correo ${email} pertenece a una cuenta de ${existing.role.name}. Este script solo administra administradores.`);
      }
      return prisma.user.upsert({
        where: { email },
        update: { password: hashed, isActive: true },
        create: {
          email,
          firstName,
          lastName,
          password: hashed,
          roleId: role.id,
        },
      });
    });
  })
  .then((user) => {
    console.log(`Administrador listo: ${user.email} (${user.firstName} ${user.lastName})`);
    if (generated) {
      console.log(`Contraseña generada (guárdala ahora, no se volverá a mostrar): ${password}`);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
