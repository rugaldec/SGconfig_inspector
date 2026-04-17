const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/disciplinasController')

const soloAdmin = requireRole('ADMINISTRADOR')

router.get('/', verifyToken, c.listar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.patch('/:id', verifyToken, soloAdmin, c.actualizar)
router.delete('/:id', verifyToken, soloAdmin, c.eliminar)

// Usuarios de una disciplina
router.get('/:id/usuarios', verifyToken, soloAdmin, c.listarUsuarios)
router.post('/:id/usuarios', verifyToken, soloAdmin, c.asignarUsuario)
router.delete('/:id/usuarios/:usuarioId', verifyToken, soloAdmin, c.quitarUsuario)

module.exports = router
