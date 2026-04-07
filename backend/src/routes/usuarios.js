const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/usuariosController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.get('/', verifyToken, soloAdmin, c.listar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.get('/:id', verifyToken, soloAdmin, c.uno)
router.put('/:id', verifyToken, soloAdmin, c.actualizar)
router.patch('/:id/password', verifyToken, soloAdmin, c.resetPassword)

module.exports = router
