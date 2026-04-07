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

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  const message = err.message || 'Error interno del servidor'
  res.status(status).json({ data: null, error: err.code || 'ERROR', message })
})

module.exports = app
