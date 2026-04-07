const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/logsCorreoController')

router.get('/', verifyToken, requireRole('ADMINISTRADOR'), c.listar)

module.exports = router
