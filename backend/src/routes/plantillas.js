const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/plantillasController')

router.get('/',    verifyToken, requireRole('ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR'), c.listar)
router.post('/',   verifyToken, requireRole('ADMINISTRADOR'), c.crear)
router.get('/:id', verifyToken, requireRole('ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR'), c.detalle)
router.patch('/:id', verifyToken, requireRole('ADMINISTRADOR'), c.actualizar)
router.delete('/:id', verifyToken, requireRole('ADMINISTRADOR'), c.eliminar)

module.exports = router
