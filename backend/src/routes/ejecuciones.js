const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/ejecucionesController')

router.get('/activas', verifyToken, requireRole('INSPECTOR'), c.ejecucionesActivas)
router.get('/:id', verifyToken, c.detalleEjecucion)
router.patch('/:id/items/:itemId', verifyToken, requireRole('INSPECTOR'), c.marcarItem)

module.exports = router
