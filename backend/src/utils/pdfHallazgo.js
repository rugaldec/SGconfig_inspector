const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const ESTADO_LABEL = {
  ABIERTO:          'Abierto',
  EN_GESTION:       'En Gestión',
  PENDIENTE_CIERRE: 'Pendiente Cierre',
  CERRADO:          'Cerrado',
  RECHAZADO:        'Rechazado',
}

const CRITICIDAD_LABEL = {
  BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', CRITICA: 'Crítica',
}

const CATEGORIA_LABEL = {
  SEGURIDAD: 'Seguridad', MANTENIMIENTO: 'Mantenimiento', OPERACIONES: 'Operaciones',
}

function sectionTitle(doc, titulo) {
  doc.moveDown(0.6)
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e3a5f').text(titulo.toUpperCase())
  doc.moveTo(doc.page.margins.left, doc.y + 2)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
     .strokeColor('#cbd5e1').lineWidth(0.5).stroke()
  doc.moveDown(0.4)
  doc.font('Helvetica').fillColor('#111827')
}

function metaRow(doc, label, value) {
  const y = doc.y
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280').text(label, { continued: false })
  doc.fontSize(10).font('Helvetica').fillColor('#111827').text(value ?? '—')
  doc.moveDown(0.3)
}

async function fetchFotoBuffer(fotoUrl) {
  if (!fotoUrl) return null
  try {
    if (process.env.UPLOAD_STORAGE === 's3') {
      const res = await fetch(fotoUrl)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    }
    // Local storage
    const filename = path.basename(fotoUrl)
    const fullPath = path.resolve(process.env.UPLOAD_LOCAL_PATH || './uploads', filename)
    if (!fs.existsSync(fullPath)) return null
    return fs.readFileSync(fullPath)
  } catch {
    return null
  }
}

async function generarPdfHallazgo(hallazgo, res) {
  const doc = new PDFDocument({ margin: 45, size: 'LETTER' })
  doc.pipe(res)

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  doc.rect(45, 45, doc.page.width - 90, 52).fill('#1e3a5f')

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
     .text('SGConfi Inspector', 60, 56, { align: 'left' })

  doc.fontSize(8.5).font('Helvetica').fillColor('#93c5fd')
     .text('Reporte de Hallazgo Técnico', 60, 76)

  doc.fontSize(9).font('Helvetica').fillColor('#e2e8f0')
     .text(
       `Generado: ${new Date().toLocaleString('es-CL')}`,
       0, 62,
       { align: 'right', width: doc.page.width - 90 }
     )

  doc.moveDown(3.2)

  // ── NÚMERO DE AVISO ──────────────────────────────────────────────────────────
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(hallazgo.numero_aviso, { align: 'center' })

  if (hallazgo.numero_aviso_sap) {
    doc.fontSize(10).font('Helvetica').fillColor('#3b82f6')
       .text(`SAP: ${hallazgo.numero_aviso_sap}`, { align: 'center' })
  }
  doc.moveDown(0.4)

  // ── GRID DE METADATOS (2 columnas) ───────────────────────────────────────────
  sectionTitle(doc, 'Información General')

  const colW = (doc.page.width - 90) / 2 - 8
  const colX1 = 45
  const colX2 = 45 + colW + 16
  let rowY = doc.y

  function metaCell(label, value, x, y) {
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#6b7280').text(label, x, y, { width: colW })
    doc.fontSize(10).font('Helvetica').fillColor('#111827').text(value ?? '—', x, doc.y, { width: colW })
    return doc.y
  }

  const y1a = metaCell('ESTADO', ESTADO_LABEL[hallazgo.estado] ?? hallazgo.estado, colX1, rowY)
  const y1b = metaCell('CRITICIDAD', CRITICIDAD_LABEL[hallazgo.criticidad] ?? hallazgo.criticidad, colX2, rowY)
  rowY = Math.max(y1a, y1b) + 8

  const y2a = metaCell('CATEGORÍA', CATEGORIA_LABEL[hallazgo.categoria] ?? hallazgo.categoria, colX1, rowY)
  const y2b = metaCell('INSPECTOR', hallazgo.inspector?.nombre ?? '—', colX2, rowY)
  rowY = Math.max(y2a, y2b) + 8

  metaCell('FECHA REGISTRO', new Date(hallazgo.fecha_creacion).toLocaleString('es-CL'), colX1, rowY)
  doc.y = rowY + 24

  // ── UBICACIÓN ────────────────────────────────────────────────────────────────
  sectionTitle(doc, 'Ubicación Técnica')
  doc.fontSize(10).font('Helvetica').fillColor('#111827')
     .text(`${hallazgo.ubicacion_tecnica.codigo} — ${hallazgo.ubicacion_tecnica.descripcion}`)
  doc.moveDown(0.2)

  // ── DESCRIPCIÓN ──────────────────────────────────────────────────────────────
  sectionTitle(doc, 'Descripción del Hallazgo')
  doc.fontSize(10).font('Helvetica').fillColor('#111827')
     .text(hallazgo.descripcion, { lineGap: 3 })

  // ── FOTO DE APERTURA ─────────────────────────────────────────────────────────
  const isWebp = (hallazgo.foto_url ?? '').toLowerCase().endsWith('.webp')
  if (!isWebp) {
    const fotoBuffer = await fetchFotoBuffer(hallazgo.foto_url)
    if (fotoBuffer) {
      sectionTitle(doc, 'Fotografía de Apertura')
      const maxW = doc.page.width - 90
      const maxH = 220
      try {
        doc.image(fotoBuffer, { fit: [maxW, maxH], align: 'center' })
        doc.moveDown(0.4)
      } catch {
        doc.fontSize(9).fillColor('#6b7280').text('No se pudo incrustar la fotografía.')
      }
    }
  } else {
    sectionTitle(doc, 'Fotografía de Apertura')
    doc.fontSize(9).fillColor('#6b7280')
       .text('Foto en formato WebP no soportado en PDF. Ver en la aplicación.')
  }

  // ── FOTO DE CIERRE ────────────────────────────────────────────────────────────
  if (hallazgo.foto_despues_url) {
    const isWebpCierre = hallazgo.foto_despues_url.toLowerCase().endsWith('.webp')
    if (!isWebpCierre) {
      const fotoCierreBuffer = await fetchFotoBuffer(hallazgo.foto_despues_url)
      if (fotoCierreBuffer) {
        sectionTitle(doc, 'Fotografía de Cierre')
        const maxW = doc.page.width - 90
        const maxH = 220
        try {
          doc.image(fotoCierreBuffer, { fit: [maxW, maxH], align: 'center' })
          doc.moveDown(0.4)
        } catch {
          doc.fontSize(9).fillColor('#6b7280').text('No se pudo incrustar la fotografía de cierre.')
        }
      }
    } else {
      sectionTitle(doc, 'Fotografía de Cierre')
      doc.fontSize(9).fillColor('#6b7280')
         .text('Foto en formato WebP no soportado en PDF. Ver en la aplicación.')
    }
  }

  // ── HISTORIAL DE ESTADOS ─────────────────────────────────────────────────────
  if (hallazgo.cambios_estado?.length) {
    sectionTitle(doc, 'Historial de Estados')
    hallazgo.cambios_estado.forEach((c) => {
      const desde = c.estado_anterior ? `${ESTADO_LABEL[c.estado_anterior]} → ` : ''
      const hasta = ESTADO_LABEL[c.estado_nuevo] ?? c.estado_nuevo
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
         .text(`${desde}${hasta}`, { continued: true })
         .font('Helvetica').fillColor('#6b7280')
         .text(`   ${c.usuario?.nombre ?? '—'} · ${new Date(c.fecha).toLocaleString('es-CL')}`)
      if (c.motivo) {
        doc.fontSize(9).fillColor('#374151').text(`  "${c.motivo}"`, { indent: 12 })
      }
      doc.moveDown(0.3)
    })
  }

  // ── COMENTARIOS ──────────────────────────────────────────────────────────────
  if (hallazgo.comentarios?.length) {
    sectionTitle(doc, 'Comentarios')
    hallazgo.comentarios.forEach((c) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
         .text(`${c.autor?.nombre ?? '—'} · ${new Date(c.fecha_creacion).toLocaleString('es-CL')}`)
      doc.fontSize(10).font('Helvetica').fillColor('#111827')
         .text(c.texto, { lineGap: 2 })
      doc.moveDown(0.5)
    })
  }

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────────
  doc.fontSize(7).fillColor('#9ca3af')
     .text(
       `SGConfi Inspector — Documento generado automáticamente — ${new Date().toLocaleDateString('es-CL')}`,
       45,
       doc.page.height - 35,
       { align: 'center', width: doc.page.width - 90 }
     )

  doc.end()
}

module.exports = { generarPdfHallazgo }
