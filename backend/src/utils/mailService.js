const nodemailer = require('nodemailer')

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[mail] SMTP no configurado — notificaciones deshabilitadas')
    return null
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

async function enviarCorreo({ to, subject, html }) {
  const t = getTransporter()
  if (!t) return { ok: false, error: 'SMTP no configurado' }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER

  try {
    await t.sendMail({ from, to, subject, html })
    return { ok: true }
  } catch (err) {
    console.error('[mail] Error al enviar correo:', err.message)
    return { ok: false, error: err.message }
  }
}

module.exports = { enviarCorreo }
