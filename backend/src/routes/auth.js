const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const { verifyToken } = require('../middleware/auth')
const { login, refresh, logout, me } = require('../controllers/authController')

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { data: null, error: 'RATE_LIMIT', message: 'Demasiados intentos. Espere 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { data: null, error: 'RATE_LIMIT', message: 'Demasiadas solicitudes. Espere 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/login', loginLimiter, login)
router.post('/refresh', refreshLimiter, refresh)
router.post('/logout', verifyToken, logout)
router.get('/me', verifyToken, me)

module.exports = router
