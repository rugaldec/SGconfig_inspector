const jwt = require('jsonwebtoken')
const { fail } = require('../utils/responseHelper')

function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'NO_TOKEN', 'Token requerido', 401)
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return fail(res, 'TOKEN_INVALIDO', 'Token inválido o expirado', 401)
  }
}

module.exports = { verifyToken }
