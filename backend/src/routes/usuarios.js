const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { uploadFoto } = require('../middleware/upload')
const c = require('../controllers/usuariosController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.patch('/mi-perfil', verifyToken, c.actualizarMiPerfil)
router.patch('/mi-perfil/foto', verifyToken, uploadFoto('foto'), c.actualizarMiFoto)
router.get('/', verifyToken, soloAdmin, c.listar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.get('/:id', verifyToken, soloAdmin, c.uno)
router.put('/:id', verifyToken, soloAdmin, c.actualizar)
router.patch('/:id/password', verifyToken, soloAdmin, c.resetPassword)
router.patch('/:id/foto', verifyToken, soloAdmin, uploadFoto('foto'), c.actualizarFotoUsuario)

module.exports = router
