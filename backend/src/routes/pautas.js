const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/pautasController')

const soloSupAdmin = requireRole('SUPERVISOR', 'ADMINISTRADOR')

router.get('/', verifyToken, soloSupAdmin, c.listar)
router.post('/', verifyToken, soloSupAdmin, c.crear)
router.get('/:id', verifyToken, soloSupAdmin, c.detalle)
router.patch('/:id', verifyToken, soloSupAdmin, c.actualizar)
router.post('/:id/ejecuciones', verifyToken, soloSupAdmin, c.programarEjecucion)
router.get('/:id/ejecuciones', verifyToken, soloSupAdmin, c.historialEjecuciones)

module.exports = router
