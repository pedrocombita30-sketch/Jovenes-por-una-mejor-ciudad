/**
 * Crea una cuenta de ADMINISTRADOR.
 * Uso: node crear-usuario.js <correo> <nombre> <apellido> [contraseña]
 * Ejemplo: node crear-usuario.js admin2@jovenes-ciudad.org Ana Torres Admin123!
 *
 * Si no se pasa contraseña, usa "Admin123!" por defecto.
 * Desde el panel administrativo NO se pueden crear administradores.
 */
const prisma = require('./src/config/database');
const bcrypt = require('bcryptjs');

const [email, firstName, lastName, password = 'Admin123!'] = process.argv.slice(2);

if (!email || !firstName || !lastName) {
  console.log('Uso: node crear-usuario.js <correo> <nombre> <apellido> [contraseña]');
  console.log('Ejemplo: node crear-usuario.js admin2@jovenes-ciudad.org Ana Torres Admin123!');
  process.exit(1);
}

prisma.role
  .findUnique({ where: { name: 'ADMIN' } })
  .then((role) => {
    if (!role) {
      console.error('Error: el rol ADMIN no existe en la base de datos. Ejecuta primero el seed.');
      process.exit(1);
    }
    const hashed = bcrypt.hashSync(password, 10);
    return prisma.user.upsert({
      where: { email },
      update: { password: hashed, roleId: role.id, isActive: true },
      create: {
        email,
        firstName,
        lastName,
        password: hashed,
        roleId: role.id,
      },
    });
  })
  .then((user) => {
    console.log(`Administrador listo: ${user.email} (${user.firstName} ${user.lastName})`);
    console.log(`Contraseña: ${password}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
