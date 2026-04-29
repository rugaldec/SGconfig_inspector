const router = require('express').Router()
const { verifyToken } = require('../middleware/auth')
const { uploadBitacora } = require('../middleware/upload')
const c = require('../controllers/bitacoraController')

router.use(verifyToken)

router.get('/disciplinas',          c.misDisciplinas)
router.get('/reporte/semanal',      c.reporteSemanal)
router.get('/',                     c.listar)
router.post('/entrada',             uploadBitacora(), c.crear)
router.get('/entrada/:id',          c.detalle)
router.patch('/entrada/:id',        uploadBitacora(), c.actualizar)
router.delete('/entrada/:id',       c.eliminar)
router.post('/sin-novedades',       c.confirmarSinNovedades)
router.delete('/fotos/:fotoId',     c.eliminarFoto)
router.delete('/archivos/:archivoId', c.eliminarArchivo)

module.exports = router
