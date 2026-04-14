const prisma = require('../db/client')
const { ok } = require('../utils/responseHelper')

async function listar(req, res) {
  const { exitoso, page = '1', limit = '50' } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {}
  if (exitoso === 'true')  where.exitoso = true
  if (exitoso === 'false') where.exitoso = false

  const [total, logs] = await Promise.all([
    prisma.logAcceso.count({ where }),
    prisma.logAcceso.findMany({
      where,
      orderBy: { fecha: 'desc' },
      take: Number(limit),
      skip,
      include: { usuario: { select: { nombre: true, rol: true } } },
    }),
  ])

  return ok(res, { total, page: Number(page), logs })
}

module.exports = { listar }
