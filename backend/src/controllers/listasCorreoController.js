const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

async function listar(req, res) {
  const listas = await prisma.listaCorreo.findMany({
    include: { zona_funcional: { select: { id: true, codigo: true, descripcion: true, padre: { select: { codigo: true, descripcion: true } } } } },
    orderBy: { zona_funcional: { codigo: 'asc' } },
  })
  return ok(res, listas)
}

async function crear(req, res) {
  const { zona_funcional_id, emails, descripcion } = req.body
  if (!zona_funcional_id || !emails?.length) {
    return fail(res, 'DATOS_INCOMPLETOS', 'zona_funcional_id y al menos un email son obligatorios')
  }

  const zona = await prisma.ubicacionTecnica.findUnique({ where: { id: zona_funcional_id } })
  if (!zona) return fail(res, 'ZONA_NO_ENCONTRADA', 'Zona funcional no encontrada', 404)
  if (zona.nivel !== 2) return fail(res, 'NIVEL_INVALIDO', 'La ubicación debe ser nivel 2 (Zona Funcional)', 400)

  const existente = await prisma.listaCorreo.findUnique({ where: { zona_funcional_id } })
  if (existente) return fail(res, 'YA_EXISTE', 'Ya existe una lista para esta Zona Funcional', 409)

  const lista = await prisma.listaCorreo.create({
    data: { zona_funcional_id, emails, descripcion: descripcion?.trim() || null },
    include: { zona_funcional: { select: { codigo: true, descripcion: true } } },
  })
  return ok(res, lista, 'Lista creada', 201)
}

async function actualizar(req, res) {
  const { emails, descripcion, activo } = req.body
  const lista = await prisma.listaCorreo.findUnique({ where: { id: req.params.id } })
  if (!lista) return fail(res, 'NOT_FOUND', 'Lista no encontrada', 404)

  const actualizada = await prisma.listaCorreo.update({
    where: { id: req.params.id },
    data: {
      ...(emails !== undefined && { emails }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() || null }),
      ...(activo !== undefined && { activo }),
    },
    include: { zona_funcional: { select: { codigo: true, descripcion: true } } },
  })
  return ok(res, actualizada)
}

async function eliminar(req, res) {
  const lista = await prisma.listaCorreo.findUnique({ where: { id: req.params.id } })
  if (!lista) return fail(res, 'NOT_FOUND', 'Lista no encontrada', 404)
  await prisma.listaCorreo.delete({ where: { id: req.params.id } })
  return ok(res, null, 'Lista eliminada')
}

module.exports = { listar, crear, actualizar, eliminar }
