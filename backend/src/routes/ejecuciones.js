const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { uploadFoto, uploadFotos } = require('../middleware/upload')
const c = require('../controllers/ejecucionesController')

router.get('/activas',   verifyToken, requireRole('INSPECTOR', 'ADMINISTRADOR'), c.ejecucionesActivas)
router.get('/historial', verifyToken, requireRole('INSPECTOR', 'ADMINISTRADOR', 'SUPERVISOR'), c.historialEjecuciones)
router.get('/:id',       verifyToken, c.detalleEjecucion)
router.get('/:id/pdf',   verifyToken, c.pdfEjecucion)
router.patch('/:id/items/:itemId', verifyToken, requireRole('INSPECTOR', 'ADMINISTRADOR'), uploadFotos('fotos', 5), c.marcarItem)
router.patch('/:id/cerrar',        verifyToken, requireRole('INSPECTOR', 'SUPERVISOR', 'ADMINISTRADOR'), c.cerrarEjecucion)

module.exports = router
