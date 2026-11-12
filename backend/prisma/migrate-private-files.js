// Mueve los materiales de cursos de la carpeta pública (uploads/documents) a la privada
// (private-uploads) y actualiza su ruta en la base de datos.
// Los documentos corporativos NO se mueven: siguen siendo públicos.
// Idempotente: los materiales ya movidos no se vuelven a tocar.
// Uso: npm run db:migrate:private-files
const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

const PUBLIC_DIR = path.join(__dirname, '..', 'src', 'uploads', 'documents');
const PRIVATE_DIR = path.join(__dirname, '..', 'src', 'private-uploads');
const LEGACY_PREFIX = '/uploads/documents/';

async function main() {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });

  const resources = await prisma.resource.findMany({
    where: { fileUrl: { startsWith: LEGACY_PREFIX } },
  });
  const corporate = await prisma.corporateDocument.findMany({ select: { fileUrl: true } });
  const corporateUrls = new Set(corporate.map((d) => d.fileUrl));

  let moved = 0;
  let skipped = 0;

  for (const r of resources) {
    if (corporateUrls.has(r.fileUrl)) {
      skipped += 1;
      console.log(`- Omitido (también es documento corporativo): ${r.fileUrl}`);
      continue;
    }

    const name = r.fileUrl.slice(LEGACY_PREFIX.length);
    const from = path.join(PUBLIC_DIR, name);
    const to = path.join(PRIVATE_DIR, name);

    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    } else if (!fs.existsSync(to)) {
      console.log(`- Archivo no encontrado en disco (se actualiza solo la ruta): ${name}`);
    }

    await prisma.resource.update({
      where: { id: r.id },
      data: { fileUrl: `/private-uploads/${name}` },
    });
    moved += 1;
    console.log(`- Movido: ${name} (recurso ${r.id})`);
  }

  console.log(`Migración completada: ${moved} movido(s), ${skipped} omitido(s).`);
}

main()
  .catch((e) => {
    console.error('Error en la migración:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
