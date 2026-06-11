const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { uploadFotos } = require('../middleware/upload')
const c = require('../controllers/hallazgosController')
const s = require('../controllers/seguimientoController')

const soloSupAdmin = requireRole('SUPERVISOR', 'ADMINISTRADOR')

router.post('/', verifyToken, requireRole('INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'), uploadFotos('fotos', 5), c.crear)
router.get('/export', verifyToken, soloSupAdmin, c.exportarCsv)
router.get('/mios', verifyToken, requireRole('INSPECTOR'), c.mios)
router.get('/', verifyToken, soloSupAdmin, c.listar)
router.get('/:id/pdf', verifyToken, c.exportarPdf)
router.get('/:id', verifyToken, c.detalle)
router.patch('/:id/estado', verifyToken, soloSupAdmin, uploadFotos('fotos_cierre', 5), c.cambiarEstado)
router.patch('/:id/sap', verifyToken, soloSupAdmin, c.asignarSap)
router.delete('/:id', verifyToken, requireRole('ADMINISTRADOR'), c.eliminar)
router.post('/:id/comentarios', verifyToken, c.agregarComentario)
router.get('/:id/seguimientos', verifyToken, s.listar)
router.post('/:id/seguimientos', verifyToken, uploadFotos('fotos', 5), s.crear)
router.delete('/:id/seguimientos/:sid', verifyToken, requireRole('ADMINISTRADOR'), s.eliminar)

module.exports = router
