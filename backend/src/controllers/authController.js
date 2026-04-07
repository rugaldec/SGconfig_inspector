const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')

function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

function signRefresh(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) return fail(res, 'DATOS_INCOMPLETOS', 'Email y contraseña requeridos')

  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user || !user.activo) return fail(res, 'CREDENCIALES_INVALIDAS', 'Credenciales incorrectas', 401)

  const ok_ = await bcrypt.compare(password, user.password_hash)
  if (!ok_) return fail(res, 'CREDENCIALES_INVALIDAS', 'Credenciales incorrectas', 401)

  const accessToken = signAccess(user)
  const refreshToken = signRefresh(user)
  setRefreshCookie(res, refreshToken)

  return ok(res, {
    token: accessToken,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
  })
}

async function refresh(req, res) {
  const token = req.cookies?.refreshToken
  if (!token) return fail(res, 'NO_REFRESH_TOKEN', 'Sesión expirada', 401)

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } })
    if (!user || !user.activo) return fail(res, 'USUARIO_INACTIVO', 'Cuenta inactiva', 401)

    const accessToken = signAccess(user)
    const newRefresh = signRefresh(user)
    setRefreshCookie(res, newRefresh)
    return ok(res, { token: accessToken })
  } catch {
    return fail(res, 'REFRESH_INVALIDO', 'Sesión inválida, inicie sesión nuevamente', 401)
  }
}

function logout(req, res) {
  res.clearCookie('refreshToken')
  return ok(res, null, 'Sesión cerrada')
}

async function me(req, res) {
  const user = await prisma.usuario.findUnique({
    where: { id: req.user.id },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  })
  if (!user) return fail(res, 'NOT_FOUND', 'Usuario no encontrado', 404)
  return ok(res, user)
}

module.exports = { login, refresh, logout, me }
