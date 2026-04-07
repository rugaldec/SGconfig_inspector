const prisma = require('../db/client')
const { ok } = require('../utils/responseHelper')

async function listar(req, res) {
  const { estado, page = 1, limit = 50 } = req.query
  const where = {}
  if (estado) where.estado = estado

  const skip = (Number(page) - 1) * Number(limit)
  const [total, items] = await Promise.all([
    prisma.logCorreo.count({ where }),
    prisma.logCorreo.findMany({
      where,
      include: {
        hallazgo:      { select: { id: true, numero_aviso: true, criticidad: true } },
        zona_funcional: { select: { id: true, codigo: true, descripcion: true } },
      },
      orderBy: { fecha_creacion: 'desc' },
      skip,
      take: Number(limit),
    }),
  ])

  return ok(res, { items, total, page: Number(page), limit: Number(limit) })
}

module.exports = { listar }
