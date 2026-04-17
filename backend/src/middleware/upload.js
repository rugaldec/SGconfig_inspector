const multer = require('multer')
const { fail } = require('../utils/responseHelper')

const MIMES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(req, file, cb) {
    if (!MIMES_PERMITIDOS.includes(file.mimetype)) {
      return cb(Object.assign(new Error('MIME_INVALIDO'), { status: 400 }))
    }
    cb(null, true)
  },
})

// Middleware para una sola foto
function uploadFoto(campo) {
  return (req, res, next) => {
    upload.single(campo)(req, res, (err) => {
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
    upload.array(campo, maxCount)(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') return fail(res, 'ARCHIVO_MUY_GRANDE', 'Una foto no puede superar 10 MB', 400)
      if (err.code === 'LIMIT_UNEXPECTED_FILE') return fail(res, 'DEMASIADAS_FOTOS', `Se permiten máximo ${maxCount} fotos`, 400)
      if (err.message === 'MIME_INVALIDO') return fail(res, 'MIME_INVALIDO', 'Solo se aceptan imágenes JPEG, PNG o WebP', 400)
      next(err)
    })
  }
}

module.exports = { uploadFoto, uploadFotos }
