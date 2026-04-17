const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

const MIGRACION_OK = !!prisma.plantillaVerificacion

// GET /api/plantillas?disciplina_id=xxx
async function listar(req, res) {
  if (!MIGRACION_OK) return ok(res, [])
  const { disciplina_id } = req.query
  const where = { activo: true }
  if (disciplina_id) where.disciplina_id = disciplina_id

  const plantillas = await prisma.plantillaVerificacion.findMany({
    where,
    include: {
      disciplina: { select: { id: true, nombre: true } },
      _count: { select: { campos: true } },
    },
    orderBy: { nombre: 'asc' },
  })
  return ok(res, plantillas)
}

// GET /api/plantillas/:id
async function detalle(req, res) {
  if (!MIGRACION_OK) return fail(res, 'MIGRACION_PENDIENTE', 'No disponible', 503)
  const plantilla = await prisma.plantillaVerificacion.findUnique({
    where: { id: req.params.id },
    include: {
      disciplina: { select: { id: true, nombre: true } },
      campos: { orderBy: { orden: 'asc' } },
    },
  })
  if (!plantilla) return fail(res, 'NO_ENCONTRADO', 'Plantilla no encontrada', 404)
  return ok(res, plantilla)
}

// POST /api/plantillas
async function crear(req, res) {
  if (!MIGRACION_OK) return fail(res, 'MIGRACION_PENDIENTE', 'No disponible', 503)
  const { nombre, descripcion, disciplina_id, campos = [] } = req.body

  if (!nombre?.trim()) return fail(res, 'VALIDACION', 'El nombre es obligatorio', 400)
  if (!disciplina_id) return fail(res, 'VALIDACION', 'La disciplina es obligatoria', 400)

  const disciplina = await prisma.disciplina.findUnique({ where: { id: disciplina_id } })
  if (!disciplina) return fail(res, 'NO_ENCONTRADO', 'Disciplina no encontrada', 404)

  const plantilla = await prisma.plantillaVerificacion.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      disciplina_id,
      campos: {
        create: campos.map((c, i) => ({
          etiqueta:       c.etiqueta.trim(),
          tipo:           c.tipo,
          orden:          c.orden ?? i + 1,
          es_obligatorio: c.es_obligatorio ?? true,
          unidad_medida:  c.unidad_medida?.trim() || null,
        })),
      },
    },
    include: {
      disciplina: { select: { id: true, nombre: true } },
      campos: { orderBy: { orden: 'asc' } },
    },
  })
  return ok(res, plantilla)
}

// PATCH /api/plantillas/:id
async function actualizar(req, res) {
  if (!MIGRACION_OK) return fail(res, 'MIGRACION_PENDIENTE', 'No disponible', 503)
  const { id } = req.params
  const { nombre, descripcion, activo, campos } = req.body

  const plantilla = await prisma.plantillaVerificacion.findUnique({ where: { id } })
  if (!plantilla) return fail(res, 'NO_ENCONTRADO', 'Plantilla no encontrada', 404)

  if (campos !== undefined) {
    // Reemplazar campos en transacción
    const actualizada = await prisma.$transaction([
      prisma.campoPlantilla.deleteMany({ where: { plantilla_id: id } }),
      prisma.plantillaVerificacion.update({
        where: { id },
        data: {
          ...(nombre    !== undefined && { nombre: nombre.trim() }),
          ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
          ...(activo    !== undefined && { activo }),
          campos: {
            create: campos.map((c, i) => ({
              etiqueta:       c.etiqueta.trim(),
              tipo:           c.tipo,
              orden:          c.orden ?? i + 1,
              es_obligatorio: c.es_obligatorio ?? true,
              unidad_medida:  c.unidad_medida?.trim() || null,
            })),
          },
        },
        include: { campos: { orderBy: { orden: 'asc' } } },
      }),
    ])
    return ok(res, actualizada[1])
  }

  const actualizada = await prisma.plantillaVerificacion.update({
    where: { id },
    data: {
      ...(nombre    !== undefined && { nombre: nombre.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion?.trim() || null }),
      ...(activo    !== undefined && { activo }),
    },
    include: { campos: { orderBy: { orden: 'asc' } } },
  })
  return ok(res, actualizada)
}

// DELETE /api/plantillas/:id
async function eliminar(req, res) {
  if (!MIGRACION_OK) return fail(res, 'MIGRACION_PENDIENTE', 'No disponible', 503)
  const plantilla = await prisma.plantillaVerificacion.findUnique({ where: { id: req.params.id } })
  if (!plantilla) return fail(res, 'NO_ENCONTRADO', 'Plantilla no encontrada', 404)
  await prisma.plantillaVerificacion.update({ where: { id: req.params.id }, data: { activo: false } })
  return ok(res, { ok: true })
}

module.exports = { listar, detalle, crear, actualizar, eliminar }
