const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

async function listar(req, res) {
  try {
    const soloActivo = req.query.soloActivo !== 'false'
    const disciplinas = await prisma.disciplina.findMany({
      where: soloActivo ? { activo: true } : {},
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { usuarios: true, pautas: true } },
      },
    })
    return ok(res, disciplinas)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

async function crear(req, res) {
  try {
    const { nombre, descripcion } = req.body
    if (!nombre?.trim()) return fail(res, 'DATOS_INCOMPLETOS', 'El nombre es obligatorio', 400)

    const existe = await prisma.disciplina.findUnique({ where: { nombre: nombre.trim() } })
    if (existe) return fail(res, 'DUPLICADO', 'Ya existe una disciplina con ese nombre', 409)

    const disciplina = await prisma.disciplina.create({
      data: { nombre: nombre.trim(), descripcion: descripcion?.trim() || null },
    })
    return ok(res, disciplina, 'Disciplina creada', 201)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

async function actualizar(req, res) {
  try {
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
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

async function eliminar(req, res) {
  try {
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
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

// ── Gestión de usuarios de una disciplina ────────────────────────────────────

async function listarUsuarios(req, res) {
  try {
    const { id } = req.params
    const disciplina = await prisma.disciplina.findUnique({ where: { id }, select: { id: true, nombre: true } })
    if (!disciplina) return fail(res, 'NO_ENCONTRADO', 'Disciplina no encontrada', 404)

    const registros = await prisma.usuarioDisciplina.findMany({
      where: { disciplina_id: id },
      include: {
        usuario: { select: { id: true, nombre: true, email: true, rol: true, activo: true } },
      },
      orderBy: { usuario: { nombre: 'asc' } },
    })
    return ok(res, registros.map(r => r.usuario))
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

async function asignarUsuario(req, res) {
  try {
    const { id } = req.params
    const { usuario_id } = req.body
    if (!usuario_id) return fail(res, 'DATOS_INCOMPLETOS', 'usuario_id es requerido', 400)

    const [disciplina, usuario] = await Promise.all([
      prisma.disciplina.findUnique({ where: { id } }),
      prisma.usuario.findUnique({ where: { id: usuario_id } }),
    ])
    if (!disciplina) return fail(res, 'NO_ENCONTRADO', 'Disciplina no encontrada', 404)
    if (!usuario) return fail(res, 'NO_ENCONTRADO', 'Usuario no encontrado', 404)

    await prisma.usuarioDisciplina.upsert({
      where: { usuario_id_disciplina_id: { usuario_id, disciplina_id: id } },
      create: { usuario_id, disciplina_id: id },
      update: {},
    })
    return ok(res, null, `${usuario.nombre} asignado a ${disciplina.nombre}`)
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

async function quitarUsuario(req, res) {
  try {
    const { id, usuarioId } = req.params
    await prisma.usuarioDisciplina.deleteMany({
      where: { disciplina_id: id, usuario_id: usuarioId },
    })
    return ok(res, null, 'Usuario removido de la disciplina')
  } catch (e) {
    return fail(res, 'ERROR', e.message, 500)
  }
}

module.exports = { listar, crear, actualizar, eliminar, listarUsuarios, asignarUsuario, quitarUsuario }
