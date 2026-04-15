const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

async function listar(req, res) {
  const soloActivo = req.query.soloActivo !== 'false'
  const disciplinas = await prisma.disciplina.findMany({
    where: soloActivo ? { activo: true } : {},
    orderBy: { nombre: 'asc' },
    include: {
      _count: { select: { usuarios: true, pautas: true } },
    },
  })
  return ok(res, disciplinas)
}

async function crear(req, res) {
  const { nombre, descripcion } = req.body
  if (!nombre?.trim()) return fail(res, 'DATOS_INCOMPLETOS', 'El nombre es obligatorio', 400)

  const existe = await prisma.disciplina.findUnique({ where: { nombre: nombre.trim() } })
  if (existe) return fail(res, 'DUPLICADO', 'Ya existe una disciplina con ese nombre', 409)

  const disciplina = await prisma.disciplina.create({
    data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null },
  })
  return ok(res, disciplina, 'Disciplina creada', 201)
}

async function actualizar(req, res) {
  const { id } = req.params
  const { nombre, descripcion, activo } = req.body

  const existe = await prisma.disciplina.findUnique({ where: { id } })
  if (!existe) return fail(res, 'NO_ENCONTRADO', 'Disciplina no encontrada', 404)

  if (nombre && nombre.trim() !== existe.nombre) {
    const dup = await prisma.disciplina.findUnique({ where: { nombre: nombre.trim() } })
    if (dup) return fail(res, 'DUPLICADO', 'Ya existe una disciplina con ese nombre', 409)
  }

  const disciplina = await prisma.disciplina.update({
    where: { id },
    data: {
      nombre: nombre !== undefined ? nombre.trim() : existe.nombre,
      descripcion: descripcion !== undefined ? (descripcion?.trim() || null) : existe.descripcion,
      activo: activo !== undefined ? activo : existe.activo,
    },
  })
  return ok(res, disciplina)
}

async function eliminar(req, res) {
  const { id } = req.params
  const disciplina = await prisma.disciplina.findUnique({
    where: { id },
    include: { _count: { select: { usuarios: true, pautas: true } } },
  })
  if (!disciplina) return fail(res, 'NO_ENCONTRADO', 'Disciplina no encontrada', 404)
  if (disciplina._count.usuarios > 0)
    return fail(res, 'CON_USUARIOS', 'La disciplina tiene inspectores asignados', 409)
  if (disciplina._count.pautas > 0)
    return fail(res, 'CON_PAUTAS', 'La disciplina tiene pautas asociadas', 409)

  await prisma.disciplina.delete({ where: { id } })
  return ok(res, null, 'Disciplina eliminada')
}

module.exports = { listar, crear, actualizar, eliminar }
