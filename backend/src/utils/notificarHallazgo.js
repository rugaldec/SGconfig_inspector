const prisma = require('../db/client')
const { enviarCorreo } = require('./mailService')

const CRITICIDAD_LABEL = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica' }
const CATEGORIA_LABEL  = { SEGURIDAD: 'Seguridad', MANTENIMIENTO: 'Mantenimiento', OPERACIONES: 'Operaciones' }

const CRITICIDAD_ICON  = { BAJA: '🟢', MEDIA: '🟡', ALTA: '🟠', CRITICA: '🔴' }

// Sube la jerarquía desde una ubicacion hasta encontrar el nivel 2 (Zona Funcional)
async function obtenerZonaFuncional(ubicacionId) {
  const node = await prisma.ubicacionTecnica.findUnique({
    where: { id: ubicacionId },
    include: { padre: { include: { padre: { include: { padre: true } } } } },
  })
  if (!node) return null

  // Recorre hasta nivel 2
  let cursor = node
  while (cursor) {
    if (cursor.nivel === 2) return cursor
    cursor = cursor.padre ?? null
  }
  return null
}

async function notificarNuevoHallazgo(hallazgo) {
  try {
    const zona = await obtenerZonaFuncional(hallazgo.ubicacion_tecnica_id)
    if (!zona) return

    const lista = await prisma.listaCorreo.findUnique({
      where: { zona_funcional_id: zona.id },
    })
    if (!lista || !lista.activo || !lista.emails?.length) return

    const icono = CRITICIDAD_ICON[hallazgo.criticidad] ?? '📋'
    const esCritico = ['CRITICA', 'ALTA'].includes(hallazgo.criticidad)
    const asunto = `${esCritico ? '⚠️ ' : ''}[SGConfi] Nuevo hallazgo ${hallazgo.numero_aviso} — ${zona.descripcion}`

    const appUrl = process.env.APP_URL || 'http://localhost:5173'

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background:#f3f4f6; margin:0; padding:20px;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:#1e3a5f; padding:20px 24px;">
      <p style="margin:0; color:#93c5fd; font-size:12px; text-transform:uppercase; letter-spacing:1px;">SGConfi Inspector</p>
      <h1 style="margin:4px 0 0; color:#ffffff; font-size:18px;">Nuevo Hallazgo Registrado</h1>
    </div>

    <!-- Número de aviso -->
    <div style="padding:16px 24px; background:#eff6ff; border-bottom:1px solid #dbeafe;">
      <p style="margin:0; font-size:13px; color:#6b7280;">Número de Aviso</p>
      <p style="margin:4px 0 0; font-size:20px; font-weight:bold; font-family:monospace; color:#1e3a5f;">${hallazgo.numero_aviso}</p>
    </div>

    <!-- Datos -->
    <div style="padding:20px 24px;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:6px 0; color:#6b7280; width:120px;">Criticidad</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${icono} ${CRITICIDAD_LABEL[hallazgo.criticidad] ?? hallazgo.criticidad}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Categoría</td>
          <td style="padding:6px 0; color:#111827;">${CATEGORIA_LABEL[hallazgo.categoria] ?? hallazgo.categoria}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Zona Funcional</td>
          <td style="padding:6px 0; color:#111827;">${zona.codigo} — ${zona.descripcion}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Ubicación</td>
          <td style="padding:6px 0; color:#111827; font-family:monospace; font-size:13px;">${hallazgo.ubicacion_tecnica?.codigo ?? ''}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Inspector</td>
          <td style="padding:6px 0; color:#111827;">${hallazgo.inspector?.nombre ?? '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Fecha</td>
          <td style="padding:6px 0; color:#111827;">${new Date(hallazgo.fecha_creacion).toLocaleString('es-CL')}</td>
        </tr>
      </table>

      <!-- Descripción -->
      <div style="margin-top:16px; padding:12px; background:#f9fafb; border-radius:8px; border-left:3px solid #3b82f6;">
        <p style="margin:0 0 4px; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px;">Descripción</p>
        <p style="margin:0; font-size:14px; color:#111827; line-height:1.5;">${hallazgo.descripcion}</p>
      </div>

      <!-- CTA -->
      <div style="margin-top:20px; text-align:center;">
        <a href="${appUrl}/supervisor/hallazgos/${hallazgo.id}"
           style="display:inline-block; background:#1e3a5f; color:#ffffff; text-decoration:none; padding:10px 24px; border-radius:8px; font-size:14px; font-weight:600;">
          Ver Hallazgo →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:12px 24px; background:#f9fafb; border-top:1px solid #e5e7eb;">
      <p style="margin:0; font-size:11px; color:#9ca3af; text-align:center;">
        Notificación automática de SGConfi Inspector · ${new Date().toLocaleDateString('es-CL')}
      </p>
    </div>
  </div>
</body>
</html>`

    const resultado = await enviarCorreo({
      to: lista.emails,
      subject: asunto,
      html,
    })

    await prisma.logCorreo.create({
      data: {
        hallazgo_id:       hallazgo.id,
        zona_funcional_id: zona.id,
        destinatarios:     lista.emails,
        asunto,
        estado:            resultado?.ok ? 'ENVIADO' : 'ERROR',
        error_mensaje:     resultado?.ok ? null : (resultado?.error ?? null),
      },
    })
  } catch (err) {
    console.error('[notificar] Error al notificar hallazgo:', err.message)
  }
}

module.exports = { notificarNuevoHallazgo }
