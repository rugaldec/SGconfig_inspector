const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/pautasController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.get('/', verifyToken, soloAdmin, c.listar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.get('/:id', verifyToken, soloAdmin, c.detalle)
router.patch('/:id',            verifyToken, soloAdmin, c.actualizar)
router.patch('/:id/desactivar', verifyToken, soloAdmin, c.desactivar)
router.delete('/:id',           verifyToken, soloAdmin, c.eliminar)
router.post('/:id/ejecuciones', verifyToken, soloAdmin, c.programarEjecucion)
router.get('/:id/ejecuciones', verifyToken, soloAdmin, c.historialEjecuciones)

module.exports = router
