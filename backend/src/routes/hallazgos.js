const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { uploadFoto } = require('../middleware/upload')
const c = require('../controllers/hallazgosController')

const soloSupAdmin = requireRole('SUPERVISOR', 'ADMINISTRADOR')

router.post('/', verifyToken, requireRole('INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'), uploadFoto('foto'), c.crear)
router.get('/export', verifyToken, soloSupAdmin, c.exportarCsv)
router.get('/mios', verifyToken, requireRole('INSPECTOR'), c.mios)
router.get('/', verifyToken, soloSupAdmin, c.listar)
router.get('/:id/pdf', verifyToken, c.exportarPdf)
router.get('/:id', verifyToken, c.detalle)
router.patch('/:id/estado', verifyToken, soloSupAdmin, uploadFoto('foto_despues'), c.cambiarEstado)
router.patch('/:id/sap', verifyToken, soloSupAdmin, c.asignarSap)
router.post('/:id/comentarios', verifyToken, c.agregarComentario)

module.exports = router
