const jwt = require('jsonwebtoken')
const { fail } = require('../utils/responseHelper')

const ROLES_SIMULABLES = ['SUPERVISOR', 'INSPECTOR']

function verifyToken(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return fail(res, 'NO_TOKEN', 'Token requerido', 401)
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)

    // Solo ADMINISTRADOR puede simular otro rol (para testing)
    const simulate = req.headers['x-simulate-role']
    if (req.user.rol === 'ADMINISTRADOR' && ROLES_SIMULABLES.includes(simulate)) {
      req.user.rolReal = 'ADMINISTRADOR'
      req.user.rol = simulate
    }

    next()
  } catch {
    return fail(res, 'TOKEN_INVALIDO', 'Token inválido o expirado', 401)
  }
}

module.exports = { verifyToken }
