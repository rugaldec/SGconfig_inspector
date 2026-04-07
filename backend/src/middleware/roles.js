const { fail } = require('../utils/responseHelper')

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return fail(res, 'FORBIDDEN', 'Rol insuficiente para esta acción', 403)
    }
    next()
  }
}

module.exports = { requireRole }
