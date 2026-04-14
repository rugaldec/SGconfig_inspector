const bcrypt = require('bcrypt')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
const PASSWORD_MENSAJE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial'

function validarPassword(password) {
  if (!password) return 'La contraseña es obligatoria'
  if (!PASSWORD_REGEX.test(password)) return PASSWORD_MENSAJE
  return null
}

const SELECT_USUARIO = { id: true, nombre: true, email: true, rol: true, activo: true, fecha_creacion: true }

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
  const { nombre, email, password, rol } = req.body
  if (!nombre || !email || !password || !rol) return fail(res, 'DATOS_INCOMPLETOS', 'Todos los campos son obligatorios')

  const errorPwd = validarPassword(password)
  if (errorPwd) return fail(res, 'PASSWORD_INVALIDO', errorPwd)

  const existe = await prisma.usuario.findUnique({ where: { email } })
  if (existe) return fail(res, 'EMAIL_DUPLICADO', 'El email ya está registrado', 409)

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.usuario.create({
    data: { nombre: nombre.trim(), email: email.trim().toLowerCase(), password_hash: hash, rol },
    select: SELECT_USUARIO,
  })
  return ok(res, user, 'Usuario creado', 201)
}

async function actualizar(req, res) {
  const { nombre, email, rol, activo } = req.body
  const user = await prisma.usuario.findUnique({ where: { id: req.params.id } })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)

  if (email && email !== user.email) {
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return fail(res, 'EMAIL_DUPLICADO', 'El email ya está registrado', 409)
  }

  const actualizado = await prisma.usuario.update({
    where: { id: req.params.id },
    data: {
      ...(nombre && { nombre: nombre.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(rol && { rol }),
      ...(activo !== undefined && { activo }),
    },
    select: SELECT_USUARIO,
  })
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

module.exports = { listar, uno, crear, actualizar, resetPassword }
