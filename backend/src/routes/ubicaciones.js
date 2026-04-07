const router = require('express').Router()
const multer = require('multer')
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const c = require('../controllers/ubicacionesController')

const soloAdmin = requireRole('ADMINISTRADOR')
const uploadExcel = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/', verifyToken, c.arbol)
router.get('/exportar', verifyToken, soloAdmin, c.exportarCsv)
router.get('/buscar', verifyToken, c.buscar)
router.get('/:id', verifyToken, c.uno)
router.post('/importar', verifyToken, soloAdmin, uploadExcel.single('archivo'), c.importar)
router.post('/', verifyToken, soloAdmin, c.crear)
router.put('/:id', verifyToken, soloAdmin, c.actualizar)
router.delete('/:id', verifyToken, soloAdmin, c.eliminar)

module.exports = router
