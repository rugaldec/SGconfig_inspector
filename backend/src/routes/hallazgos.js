const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { uploadFotos } = require('../middleware/upload')
const c = require('../controllers/hallazgosController')

const soloSupAdmin = requireRole('SUPERVISOR', 'ADMINISTRADOR')

router.post('/', verifyToken, requireRole('INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'), uploadFotos('fotos', 5), c.crear)
router.get('/export', verifyToken, soloSupAdmin, c.exportarCsv)
router.get('/mios', verifyToken, requireRole('INSPECTOR'), c.mios)
router.get('/', verifyToken, soloSupAdmin, c.listar)
router.get('/:id/pdf', verifyToken, c.exportarPdf)
router.get('/:id', verifyToken, c.detalle)
router.patch('/:id/estado', verifyToken, soloSupAdmin, uploadFotos('fotos_cierre', 5), c.cambiarEstado)
router.patch('/:id/sap', verifyToken, soloSupAdmin, c.asignarSap)
router.post('/:id/comentarios', verifyToken, c.agregarComentario)

module.exports = router
