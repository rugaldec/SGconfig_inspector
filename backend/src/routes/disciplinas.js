const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/disciplinasController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.get('/', verifyToken, c.listar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.patch('/:id', verifyToken, soloAdmin, c.actualizar)
router.delete('/:id', verifyToken, soloAdmin, c.eliminar)

module.exports = router
