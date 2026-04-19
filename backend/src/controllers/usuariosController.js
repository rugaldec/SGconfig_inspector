const bcrypt = require('bcrypt')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const storage = require('../utils/storageService')

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_MENSAJE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial'

function validarPassword(password) {
  if (!password) return 'La contraseña es obligatoria'
  if (!PASSWORD_REGEX.test(password)) return PASSWORD_MENSAJE
  return null
}

const FOTO_DEFAULT_ROL = {
  ADMINISTRADOR: '/uploads/avatar-b581d0f0-66b0-4e32-a05e-e01cda8275fe.webp',
  SUPERVISOR:    '/uploads/avatar-0b46e007-21dc-4c1b-a29c-36c61017cfda.webp',
  INSPECTOR:     '/uploads/avatar-0a5ecf4b-7e8e-41d0-b497-6f2c584932cf.jpg',
}

const SELECT_USUARIO = {
  id: true, nombre: true, email: true, rol: true, activo: true, fecha_creacion: true,
  titulo: true, cargo: true, telefono: true, area_funcional: true, observaciones: true, foto_url: true,
  disciplinas: { select: { disciplina_id: true, disciplina: { select: { id: true, nombre: true } } } },
}

async function listar(req, res) {
  const usuarios = await prisma.usuario.findMany({ select: SELECT_USUARIO, orderBy: { nombre: 'asc' } })
  return ok(res, usuarios)
}

async function uno(req, res) {
  const user = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: SELECT_USUARIO })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)
  return ok(res, user)
}

async function crear(req, res) {
  const { nombre, email, password, rol, disciplinas, titulo, cargo, telefono, area_funcional, observaciones } = req.body
  if (!nombre || !email || !password || !rol) return fail(res, 'DATOS_INCOMPLETOS', 'Todos los campos son obligatorios')

  const errorPwd = validarPassword(password)
  if (errorPwd) return fail(res, 'PASSWORD_INVALIDO', errorPwd)

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) return fail(res, 'EMAIL_DUPLICADO', 'El email ya está registrado', 409)

  const hash = await bcrypt.hash(password, 12)

  // disciplinas es un array de ids, solo aplica a INSPECTOR
  const discIds = rol === 'INSPECTOR' && Array.isArray(disciplinas) ? disciplinas.filter(Boolean) : []

  const user = await prisma.usuario.create({
    data: {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      rol,
      foto_url: FOTO_DEFAULT_ROL[rol] ?? null,
      ...(titulo        && { titulo: titulo.trim() }),
      ...(cargo         && { cargo: cargo.trim() }),
      ...(telefono      && { telefono: telefono.trim() }),
      ...(area_funcional && { area_funcional: area_funcional.trim() }),
      ...(observaciones  && { observaciones: observaciones.trim() }),
      disciplinas: discIds.length
        ? { create: discIds.map(did => ({ disciplina_id: did })) }
        : undefined,
    },
    select: SELECT_USUARIO,
  })
  return ok(res, user, 'Usuario creado', 201)
}

async function actualizar(req, res) {
  const { nombre, email, rol, activo, disciplinas, titulo, cargo, telefono, area_funcional, observaciones } = req.body
  const user = await prisma.usuario.findUnique({ where: { id: req.params.id } })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)

  if (email && email !== user.email) {
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return fail(res, 'EMAIL_DUPLICADO', 'El email ya está registrado', 409)
  }

  const rolFinal = rol ?? user.rol

  // Reemplazar disciplinas en una transacción si vienen en el body
  const ops = [
    prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        ...(nombre        && { nombre: nombre.trim() }),
        ...(email         && { email: email.trim().toLowerCase() }),
        ...(rol           && { rol }),
        ...(activo !== undefined && { activo }),
        ...(titulo        !== undefined && { titulo:         titulo        ? titulo.trim()         : null }),
        ...(cargo         !== undefined && { cargo:          cargo         ? cargo.trim()          : null }),
        ...(telefono      !== undefined && { telefono:       telefono      ? telefono.trim()       : null }),
        ...(area_funcional !== undefined && { area_funcional: area_funcional ? area_funcional.trim() : null }),
        ...(observaciones  !== undefined && { observaciones:  observaciones  ? observaciones.trim()  : null }),
      },
    }),
  ]

  if (disciplinas !== undefined) {
    const discIds = rolFinal === 'INSPECTOR' && Array.isArray(disciplinas) ? disciplinas.filter(Boolean) : []
    ops.push(prisma.usuarioDisciplina.deleteMany({ where: { usuario_id: req.params.id } }))
    if (discIds.length) {
      ops.push(prisma.usuarioDisciplina.createMany({
        data: discIds.map(did => ({ usuario_id: req.params.id, disciplina_id: did })),
        skipDuplicates: true,
      }))
    }
  }

  await prisma.$transaction(ops)

  const actualizado = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: SELECT_USUARIO })
  return ok(res, actualizado)
}

async function resetPassword(req, res) {
  const { password } = req.body
  const errorPwd = validarPassword(password)
  if (errorPwd) return fail(res, 'PASSWORD_INVALIDO', errorPwd)

  const user = await prisma.usuario.findUnique({ where: { id: req.params.id } })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)

  const hash = await bcrypt.hash(password, 12)
  await prisma.usuario.update({ where: { id: req.params.id }, data: { password_hash: hash } })
  return ok(res, null, 'Contraseña actualizada')
}

async function actualizarMiPerfil(req, res) {
  const { nombre, titulo, cargo, telefono, area_funcional, observaciones } = req.body
  await prisma.usuario.update({
    where: { id: req.user.id },
    data: {
      ...(nombre        && { nombre: nombre.trim() }),
      titulo:         titulo         !== undefined ? (titulo         ? titulo.trim()         : null) : undefined,
      cargo:          cargo          !== undefined ? (cargo          ? cargo.trim()          : null) : undefined,
      telefono:       telefono       !== undefined ? (telefono       ? telefono.trim()       : null) : undefined,
      area_funcional: area_funcional !== undefined ? (area_funcional ? area_funcional.trim() : null) : undefined,
      observaciones:  observaciones  !== undefined ? (observaciones  ? observaciones.trim()  : null) : undefined,
    },
  })
  const actualizado = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: SELECT_USUARIO })
  return ok(res, actualizado, 'Perfil actualizado')
}

async function actualizarMiFoto(req, res) {
  if (!req.file) return fail(res, 'SIN_FOTO', 'No se recibió ninguna foto', 400)
  const fotoUrl = await storage.guardar(req.file.buffer, req.file.mimetype, `avatar-${req.user.id}`)
  await prisma.usuario.update({ where: { id: req.user.id }, data: { foto_url: fotoUrl } })
  const actualizado = await prisma.usuario.findUnique({ where: { id: req.user.id }, select: SELECT_USUARIO })
  return ok(res, actualizado, 'Foto actualizada')
}

async function actualizarFotoUsuario(req, res) {
  if (!req.file) return fail(res, 'SIN_FOTO', 'No se recibió ninguna foto', 400)
  const user = await prisma.usuario.findUnique({ where: { id: req.params.id } })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)
  const fotoUrl = await storage.guardar(req.file.buffer, req.file.mimetype, `avatar-${req.params.id}`)
  await prisma.usuario.update({ where: { id: req.params.id }, data: { foto_url: fotoUrl } })
  const actualizado = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: SELECT_USUARIO })
  return ok(res, actualizado, 'Foto actualizada')
}

module.exports = { listar, uno, crear, actualizar, resetPassword, actualizarMiPerfil, actualizarMiFoto, actualizarFotoUsuario }
