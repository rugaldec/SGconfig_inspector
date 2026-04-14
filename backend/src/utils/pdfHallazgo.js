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

const MARGIN = 45
const PAGE_W = 612  // LETTER width en puntos

function sectionTitle(doc, titulo) {
  doc.moveDown(0.7)
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(titulo.toUpperCase(), MARGIN, doc.y)
  const lineY = doc.y + 3
  doc.moveTo(MARGIN, lineY)
     .lineTo(PAGE_W - MARGIN, lineY)
     .strokeColor('#cbd5e1').lineWidth(0.5).stroke()
  doc.moveDown(0.5)
  doc.font('Helvetica').fillColor('#111827')
}

// Dibuja una celda etiqueta + valor en posición fija (no depende del cursor Y del doc)
function metaCell(doc, label, value, x, y, width) {
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#9ca3af')
     .text(label, x, y, { width, lineBreak: false })
  doc.fontSize(10).font('Helvetica').fillColor('#111827')
     .text(value ?? '—', x, y + 11, { width })
  // Retorna la Y estimada del fondo de la celda
  return y + 11 + 14
}

async function fetchFotoBuffer(fotoUrl) {
  if (!fotoUrl) return null
  try {
    if (process.env.UPLOAD_STORAGE === 's3') {
      const res = await fetch(fotoUrl)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    }
    const filename = path.basename(fotoUrl)
    const fullPath = path.resolve(process.env.UPLOAD_LOCAL_PATH || './uploads', filename)
    if (!fs.existsSync(fullPath)) return null
    return fs.readFileSync(fullPath)
  } catch {
    return null
  }
}

async function insertarFoto(doc, fotoUrl, titulo) {
  if (!fotoUrl) return
  sectionTitle(doc, titulo)
  if (fotoUrl.toLowerCase().endsWith('.webp')) {
    doc.fontSize(9).fillColor('#6b7280')
       .text('Foto en formato WebP no soportado en PDF. Ver en la aplicación.')
    return
  }
  const buffer = await fetchFotoBuffer(fotoUrl)
  if (!buffer) return
  try {
    const maxW = PAGE_W - MARGIN * 2
    const maxH = 220
    // Sin x,y explícitos: PDFKit usa el cursor actual y lo avanza correctamente
    doc.image(buffer, { fit: [maxW, maxH], align: 'center' })
    doc.moveDown(0.6)
  } catch {
    doc.fontSize(9).fillColor('#6b7280').text('No se pudo incrustar la fotografía.')
  }
}

async function generarPdfHallazgo(hallazgo, res) {
  const doc = new PDFDocument({ margin: MARGIN, size: 'LETTER' })
  doc.pipe(res)

  const CONTENT_W = PAGE_W - MARGIN * 2   // 522 pt

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  const HDR_H = 56
  doc.rect(MARGIN, MARGIN, CONTENT_W, HDR_H).fill('#1e3a5f')

  doc.fontSize(15).font('Helvetica-Bold').fillColor('#ffffff')
     .text('SGConfi Inspector', MARGIN + 14, MARGIN + 12, { width: CONTENT_W - 28 })
  doc.fontSize(8).font('Helvetica').fillColor('#93c5fd')
     .text('Reporte de Hallazgo Técnico', MARGIN + 14, MARGIN + 31)

  // Fecha generación — derecha del encabezado
  doc.fontSize(8).font('Helvetica').fillColor('#e2e8f0')
     .text(
       `Generado: ${new Date().toLocaleString('es-CL')}`,
       MARGIN + 14, MARGIN + 20,
       { width: CONTENT_W - 28, align: 'right' }
     )

  doc.y = MARGIN + HDR_H + 14

  // ── BLOQUE NÚMERO DE AVISO (izquierda) ──────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(hallazgo.numero_aviso, MARGIN, doc.y)

  if (hallazgo.numero_aviso_sap) {
    doc.moveDown(0.1)
    doc.fontSize(10).font('Helvetica').fillColor('#3b82f6')
       .text(`SAP: ${hallazgo.numero_aviso_sap}`, MARGIN, doc.y)
  }
  doc.moveDown(0.5)

  // ── INFORMACIÓN GENERAL — tabla 3 columnas ───────────────────────────────────
  sectionTitle(doc, 'Información General')

  const COL = Math.floor(CONTENT_W / 3) - 6    // ancho de cada columna
  const GAP = 9
  const col1X = MARGIN
  const col2X = MARGIN + COL + GAP
  const col3X = MARGIN + (COL + GAP) * 2
  const gridY = doc.y

  const bE = metaCell(doc, 'ESTADO',        ESTADO_LABEL[hallazgo.estado] ?? hallazgo.estado,             col1X, gridY, COL)
  const bC = metaCell(doc, 'CRITICIDAD',    CRITICIDAD_LABEL[hallazgo.criticidad] ?? hallazgo.criticidad, col2X, gridY, COL)
  const bK = metaCell(doc, 'CATEGORÍA',     CATEGORIA_LABEL[hallazgo.categoria] ?? hallazgo.categoria,    col3X, gridY, COL)

  const row2Y = Math.max(bE, bC, bK) + 6

  const bI  = metaCell(doc, 'INSPECTOR',    hallazgo.inspector?.nombre ?? '—',                            col1X, row2Y, COL)
  const bF  = metaCell(doc, 'FECHA REGISTRO', new Date(hallazgo.fecha_creacion).toLocaleString('es-CL'),  col2X, row2Y, COL * 2 + GAP)

  doc.y = Math.max(bI, bF) + 4

  // ── UBICACIÓN ────────────────────────────────────────────────────────────────
  sectionTitle(doc, 'Ubicación Técnica')
  doc.fontSize(10).font('Helvetica').fillColor('#111827')
     .text(
       `${hallazgo.ubicacion_tecnica.codigo} — ${hallazgo.ubicacion_tecnica.descripcion}`,
       MARGIN, doc.y, { width: CONTENT_W }
     )
  doc.moveDown(0.2)

  // ── DESCRIPCIÓN ──────────────────────────────────────────────────────────────
  sectionTitle(doc, 'Descripción del Hallazgo')
  doc.fontSize(10).font('Helvetica').fillColor('#111827')
     .text(hallazgo.descripcion, MARGIN, doc.y, { width: CONTENT_W, lineGap: 3 })

  // ── FOTOGRAFÍAS ───────────────────────────────────────────────────────────────
  await insertarFoto(doc, hallazgo.foto_url, 'Fotografía de Apertura')
  await insertarFoto(doc, hallazgo.foto_despues_url, 'Fotografía de Cierre')

  // ── HISTORIAL DE ESTADOS ─────────────────────────────────────────────────────
  if (hallazgo.cambios_estado?.length) {
    sectionTitle(doc, 'Historial de Estados')
    hallazgo.cambios_estado.forEach((c) => {
      const desde = c.estado_anterior ? `${ESTADO_LABEL[c.estado_anterior]} → ` : ''
      const hasta = ESTADO_LABEL[c.estado_nuevo] ?? c.estado_nuevo
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827')
         .text(`${desde}${hasta}`, MARGIN, doc.y, { continued: true, width: CONTENT_W })
         .font('Helvetica').fillColor('#6b7280')
         .text(`   ${c.usuario?.nombre ?? '—'} · ${new Date(c.fecha).toLocaleString('es-CL')}`)
      if (c.motivo) {
        doc.fontSize(9).font('Helvetica').fillColor('#374151')
           .text(`"${c.motivo}"`, MARGIN + 12, doc.y, { width: CONTENT_W - 12 })
      }
      doc.moveDown(0.3)
    })
  }

  // ── COMENTARIOS ──────────────────────────────────────────────────────────────
  if (hallazgo.comentarios?.length) {
    sectionTitle(doc, 'Comentarios')
    hallazgo.comentarios.forEach((c) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280')
         .text(
           `${c.autor?.nombre ?? '—'} · ${new Date(c.fecha_creacion).toLocaleString('es-CL')}`,
           MARGIN, doc.y, { width: CONTENT_W }
         )
      doc.fontSize(10).font('Helvetica').fillColor('#111827')
         .text(c.texto, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 })
      doc.moveDown(0.5)
    })
  }

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────────
  doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
     .text(
       `SGConfi Inspector — Documento generado automáticamente — ${new Date().toLocaleDateString('es-CL')}`,
       MARGIN,
       doc.page.height - 32,
       { align: 'center', width: CONTENT_W }
     )

  doc.end()
}

module.exports = { generarPdfHallazgo }
