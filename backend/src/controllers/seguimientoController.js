const { v4: uuidv4 } = require('uuid')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const { guardar } = require('../utils/storageService')

const INCLUDE_SEGUIMIENTO = {
  autor: { select: { id: true, nombre: true, rol: true, foto_url: true } },
  fotos: { select: { id: true, foto_url: true, orden: true }, orderBy: { orden: 'asc' } },
}

async function listar(req, res) {
  const { id } = req.params
  const h = await prisma.hallazgo.findUnique({ where: { id }, select: { id: true, inspector_id: true } })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  if (req.user.rol === 'INSPECTOR' && h.inspector_id !== req.user.id) {
    return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  }

  const seguimientos = await prisma.seguimientoHallazgo.findMany({
    where: { hallazgo_id: id },
    include: INCLUDE_SEGUIMIENTO,
    orderBy: { created_at: 'asc' },
  })
  return ok(res, seguimientos)
}

async function crear(req, res) {
  const { id } = req.params
  const archivos = req.files ?? []
  if (!archivos.length) return fail(res, 'FOTO_REQUERIDA', 'Al menos una foto es obligatoria', 400)

  const { observacion } = req.body
  if (!observacion?.trim()) return fail(res, 'OBSERVACION_REQUERIDA', 'La observación es obligatoria', 400)

  const h = await prisma.hallazgo.findUnique({ where: { id }, select: { id: true, estado: true, inspector_id: true } })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)

  const estadosActivos = ['ABIERTO', 'EN_GESTION']
  if (!estadosActivos.includes(h.estado)) {
    return fail(res, 'ESTADO_INVALIDO', 'Solo se puede registrar seguimiento en hallazgos activos', 422)
  }

  // Inspector solo puede registrar seguimiento en sus propios hallazgos
  if (req.user.rol === 'INSPECTOR' && h.inspector_id !== req.user.id) {
    return fail(res, 'FORBIDDEN', 'Solo puedes registrar seguimiento en tus propios hallazgos', 403)
  }

  const fotoUrls = await Promise.all(archivos.map((f, i) => guardar(f.buffer, f.mimetype, uuidv4()).then(url => ({ url, orden: i }))))

  const seguimiento = await prisma.seguimientoHallazgo.create({
    data: {
      hallazgo_id: id,
      autor_id: req.user.id,
      observacion: observacion.trim(),
      fotos: {
        create: fotoUrls.map(({ url, orden }) => ({ foto_url: url, orden })),
      },
    },
    include: INCLUDE_SEGUIMIENTO,
  })
  return ok(res, seguimiento, 'Seguimiento registrado', 201)
}

async function eliminar(req, res) {
  const { sid } = req.params
  const seguimiento = await prisma.seguimientoHallazgo.findUnique({ where: { id: sid } })
  if (!seguimiento) return fail(res, 'NOT_FOUND', 'Seguimiento no encontrado', 404)

  await prisma.seguimientoHallazgo.delete({ where: { id: sid } })
  return ok(res, null, 'Seguimiento eliminado')
}

module.exports = { listar, crear, eliminar }
