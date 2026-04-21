const multer = require('multer')
const { fail } = require('../utils/responseHelper')

const MIMES_FOTO = ['image/jpeg', 'image/png', 'image/webp']
const MIMES_DOCUMENTO = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const uploadFoto$ = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!MIMES_FOTO.includes(file.mimetype)) return cb(Object.assign(new Error('MIME_INVALIDO'), { status: 400 }))
    cb(null, true)
  },
})

// Multer mixto: fotos (10 MB) + documentos (20 MB)
const uploadMixto$ = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const esImagen = MIMES_FOTO.includes(file.mimetype)
    const esDoc = MIMES_DOCUMENTO.includes(file.mimetype)
    if (!esImagen && !esDoc) return cb(Object.assign(new Error('MIME_INVALIDO'), { status: 400 }))
    // Fotos: límite 10 MB (chequeado en controller al guardar)
    cb(null, true)
  },
})

// Middleware para una sola foto
function uploadFoto(campo) {
  return (req, res, next) => {
    uploadFoto$.single(campo)(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'ARCHIVO_MUY_GRANDE', 'La foto no puede superar 10 MB', 400)
      if (err.message === 'MIME_INVALIDO') return fail(res, 'MIME_INVALIDO', 'Solo se aceptan imágenes JPEG, PNG o WebP', 400)
      next(err)
    })
  }
}

// Middleware para múltiples fotos (array)
function uploadFotos(campo, maxCount = 5) {
  return (req, res, next) => {
    uploadFoto$.array(campo, maxCount)(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'ARCHIVO_MUY_GRANDE', 'Una foto no puede superar 10 MB', 400)
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return fail(res, 'DEMASIADAS_FOTOS', `Se permiten máximo ${maxCount} fotos`, 400)
      if (err.message === 'MIME_INVALIDO') return fail(res, 'MIME_INVALIDO', 'Solo se aceptan imágenes JPEG, PNG o WebP', 400)
      next(err)
    })
  }
}

// Middleware para fotos + documentos adjuntos (bitácora)
function uploadBitacora() {
  return (req, res, next) => {
    uploadMixto$.fields([
      { name: 'fotos', maxCount: 5 },
      { name: 'archivos', maxCount: 10 },
    ])(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'ARCHIVO_MUY_GRANDE', 'Un archivo supera el tamaño máximo permitido', 400)
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return fail(res, 'DEMASIADOS_ARCHIVOS', 'Se superó el límite de archivos', 400)
      if (err.message === 'MIME_INVALIDO') return fail(res, 'MIME_INVALIDO', 'Tipo de archivo no permitido', 400)
      next(err)
    })
  }
}

module.exports = { uploadFoto, uploadFotos, uploadBitacora, MIMES_FOTO, MIMES_DOCUMENTO }
