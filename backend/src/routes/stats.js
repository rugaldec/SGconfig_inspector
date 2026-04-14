const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { stats } = require('../controllers/statsController')

router.get('/', verifyToken, requireRole('SUPERVISOR', 'ADMINISTRADOR'), stats)

module.exports = router
