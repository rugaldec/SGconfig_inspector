const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { stats, statsDisciplina } = require('../controllers/statsController')

router.get('/', verifyToken, requireRole('SUPERVISOR', 'ADMINISTRADOR'), stats)
router.get('/disciplina', verifyToken, requireRole('INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'), statsDisciplina)

module.exports = router
