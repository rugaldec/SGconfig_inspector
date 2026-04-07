const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/listasCorreoController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.get('/',     verifyToken, soloAdmin, c.listar)
router.post('/',    verifyToken, soloAdmin, c.crear)
router.put('/:id',  verifyToken, soloAdmin, c.actualizar)
router.delete('/:id', verifyToken, soloAdmin, c.eliminar)

module.exports = router
