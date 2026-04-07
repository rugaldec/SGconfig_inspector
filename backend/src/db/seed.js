require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Admin
  const adminHash = await bcrypt.hash('Admin1234!', 12)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@sgconfi.local' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@sgconfi.local',
      password_hash: adminHash,
      rol: 'ADMINISTRADOR',
    },
  })

  // Supervisor de prueba
  const supHash = await bcrypt.hash('Super1234!', 12)
  const supervisor = await prisma.usuario.upsert({
    where: { email: 'supervisor@sgconfi.local' },
    update: {},
    create: {
      nombre: 'Supervisor Demo',
      email: 'supervisor@sgconfi.local',
      password_hash: supHash,
      rol: 'SUPERVISOR',
    },
  })

  // Inspector de prueba
  const insHash = await bcrypt.hash('Inspector1234!', 12)
  const inspector = await prisma.usuario.upsert({
    where: { email: 'inspector@sgconfi.local' },
    update: {},
    create: {
      nombre: 'Inspector Demo',
      email: 'inspector@sgconfi.local',
      password_hash: insHash,
      rol: 'INSPECTOR',
    },
  })

  // Jerarquía SAP de ejemplo
  const planta = await prisma.ubicacionTecnica.upsert({
    where: { codigo: 'PLANTA-01' },
    update: {},
    create: {
      codigo: 'PLANTA-01',
      descripcion: 'Planta Principal',
      nivel: 1,
    },
  })

  const zonaFunc = await prisma.ubicacionTecnica.upsert({
    where: { codigo: 'ZF-ELECTRICO' },
    update: {},
    create: {
      codigo: 'ZF-ELECTRICO',
      descripcion: 'Zona Funcional Eléctrica',
      nivel: 2,
      padre_id: planta.id,
    },
  })

  const equipo = await prisma.ubicacionTecnica.upsert({
    where: { codigo: 'EQ-TABLEROS' },
    update: {},
    create: {
      codigo: 'EQ-TABLEROS',
      descripcion: 'Tableros de Distribución',
      nivel: 3,
      padre_id: zonaFunc.id,
    },
  })

  await prisma.ubicacionTecnica.upsert({
    where: { codigo: 'SE-TD-01' },
    update: {},
    create: {
      codigo: 'SE-TD-01',
      descripcion: 'Sub Equipo Tablero Principal TD-01',
      nivel: 4,
      padre_id: equipo.id,
    },
  })

  console.log('Seed completado:')
  console.log('  admin@sgconfi.local / Admin1234!')
  console.log('  supervisor@sgconfi.local / Super1234!')
  console.log('  inspector@sgconfi.local / Inspector1234!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
