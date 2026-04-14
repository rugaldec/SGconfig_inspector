require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()

// Seguridad y parsing
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Archivos estáticos de fotos
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// Rutas API
app.use('/api/auth', require('./routes/auth'))
app.use('/api/hallazgos', require('./routes/hallazgos'))
app.use('/api/ubicaciones', require('./routes/ubicaciones'))
app.use('/api/usuarios', require('./routes/usuarios'))
app.use('/api/listas-correo', require('./routes/listasCorreo'))
app.use('/api/logs-correo',  require('./routes/logsCorreo'))
app.use('/api/stats',        require('./routes/stats'))
app.use('/api/logs-acceso', require('./routes/logsAcceso'))

// Manejo global de errores
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) console.error(err)       // stack completo solo en desarrollo
  else console.error(`[ERROR] ${err.code || 'ERROR'} - ${err.message}`)
  const status = err.status || 500
  // En producción los errores 5xx no exponen detalles internos al cliente
  const message = status < 500
    ? (err.message || 'Error en la solicitud')
    : (isProd ? 'Error interno del servidor' : (err.message || 'Error interno del servidor'))
  res.status(status).json({ data: null, error: err.code || 'ERROR', message })
})

module.exports = app
