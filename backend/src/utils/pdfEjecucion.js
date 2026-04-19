const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const ESTADO_LABEL = {
  COMPLETADA: 'Completada',
  VENCIDA:    'Vencida',
  EN_CURSO:   'En Curso',
  PENDIENTE:  'Pendiente',
}

const MARGIN   = 45
const PAGE_W   = 612   // LETTER
const PAGE_H   = 792

function sectionTitle(doc, titulo) {
  doc.moveDown(0.55)
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3a5f')
     .text(titulo.toUpperCase(), MARGIN, doc.y)
  const lineY = doc.y + 3
  doc.moveTo(MARGIN, lineY)
     .lineTo(PAGE_W - MARGIN, lineY)
     .strokeColor('#cbd5e1').lineWidth(0.5).stroke()
  doc.moveDown(0.4)
  doc.font('Helvetica').fillColor('#111827')
}

function metaCell(doc, label, value, x, y, width) {
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#9ca3af')
     .text(label, x, y, { width, lineBreak: false })
  doc.fontSize(9).font('Helvetica').fillColor('#111827')
     .text(value ?? '—', x, y + 11, { width })
  return y + 11 + 13
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

// Dibuja una celda de tabla en coordenadas absolutas (no avanza doc.y)
function tCell(doc, text, x, y, width, opts = {}) {
  const { bold = false, color = '#1f2937', size = 7.5 } = opts
  doc.fontSize(size)
     .font(bold ? 'Helvetica-Bold' : 'Helvetica')
     .fillColor(color)
     .text(String(text ?? '—'), x, y, { width: width - 2, lineBreak: false, ellipsis: true })
}

function drawTableHeader(doc, cols, y) {
  const CONTENT_W = PAGE_W - MARGIN * 2
  doc.rect(MARGIN, y, CONTENT_W, 14).fill('#1e3a5f')
  let cx = MARGIN + 4
  cols.forEach(({ label, w }) => {
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff')
       .text(label, cx, y + 3.5, { width: w - 4, lineBreak: false })
    cx += w
  })
  return y + 14
}

function drawTableRow(doc, cols, values, y, odd) {
  const CONTENT_W = PAGE_W - MARGIN * 2
  doc.rect(MARGIN, y, CONTENT_W, 15).fill(odd ? '#f8fafc' : '#ffffff')

  let cx = MARGIN + 4
  cols.forEach(({ w }, i) => {
    const val = values[i]
    if (val !== null && typeof val === 'object') {
      tCell(doc, val.text, cx, y + 3.5, w, { bold: val.__bold, color: val.color ?? '#111827' })
    } else {
      tCell(doc, val, cx, y + 3.5, w, { color: '#374151' })
    }
    cx += w
  })
  return y + 15
}

async function generarPdfEjecucion(ejecucion, res) {
  const doc = new PDFDocument({ margin: MARGIN, size: 'LETTER', autoFirstPage: true })
  doc.pipe(res)

  const CONTENT_W = PAGE_W - MARGIN * 2

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  const HDR_H = 58
  doc.rect(MARGIN, MARGIN, CONTENT_W, HDR_H).fill('#1e3a5f')

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
     .text('SGConfi Inspector', MARGIN + 14, MARGIN + 11, { width: CONTENT_W - 28 })
  doc.fontSize(8).font('Helvetica').fillColor('#93c5fd')
     .text('Reporte de Ejecución de Pauta', MARGIN + 14, MARGIN + 30)
  doc.fontSize(7).font('Helvetica').fillColor('#e2e8f0')
     .text(
       `Generado: ${new Date().toLocaleString('es-CL')}`,
       MARGIN + 14, MARGIN + 21,
       { width: CONTENT_W - 28, align: 'right' }
     )

  doc.y = MARGIN + HDR_H + 16

  // ── NOMBRE DE PAUTA ─────────────────────────────────────────────────────────
  doc.fontSize(17).font('Helvetica-Bold').fillColor('#0f172a')
     .text(ejecucion.pauta?.nombre ?? '—', MARGIN, doc.y, { width: CONTENT_W })
  doc.moveDown(0.25)

  // ── METADATA (4 celdas) ─────────────────────────────────────────────────────
  sectionTitle(doc, 'Información General')

  const items      = ejecucion.items ?? []
  const totalItems = items.length
  const inspeccionados = items.filter(i => i.inspeccionado).length
  const hallazgosCount = items.filter(i => i.hallazgo_id || i.hallazgo).length
  const pct        = totalItems > 0 ? Math.round((inspeccionados / totalItems) * 100) : 0
  const estado     = ejecucion.estado ?? 'PENDIENTE'

  const fechaInicio = new Date(ejecucion.fecha_inicio).toLocaleDateString('es-CL')
  const fechaFin    = new Date(ejecucion.fecha_fin).toLocaleDateString('es-CL')

  const COL4 = Math.floor(CONTENT_W / 4) - 5
  const GAP  = 7
  const gridY = doc.y

  const b1 = metaCell(doc, 'DISCIPLINA',  ejecucion.pauta?.disciplina?.nombre ?? '—', MARGIN,                   gridY, COL4)
  const b2 = metaCell(doc, 'ESTADO',      ESTADO_LABEL[estado] ?? estado,            MARGIN + COL4 + GAP,       gridY, COL4)
  const b3 = metaCell(doc, 'PERÍODO',     `${fechaInicio} — ${fechaFin}`,            MARGIN + (COL4 + GAP) * 2, gridY, COL4)
  const b4 = metaCell(doc, 'COBERTURA',   `${inspeccionados}/${totalItems} (${pct}%)`, MARGIN + (COL4 + GAP) * 3, gridY, COL4)

  doc.y = Math.max(b1, b2, b3, b4) + 6

  // ── INSPECTORES ─────────────────────────────────────────────────────────────
  const inspMap = new Map()
  items.filter(i => i.ejecutado_por).forEach(i => {
    const clave = i.ejecutado_por_id
    if (!inspMap.has(clave)) inspMap.set(clave, { nombre: i.ejecutado_por.nombre, count: 0 })
    inspMap.get(clave).count++
  })

  if (inspMap.size > 0) {
    sectionTitle(doc, 'Inspectores Participantes')
    const txt = Array.from(inspMap.values())
      .map(i => `${i.nombre} (${i.count} ítem${i.count !== 1 ? 's' : ''})`)
      .join('   ·   ')
    doc.fontSize(9).font('Helvetica').fillColor('#374151')
       .text(txt, MARGIN, doc.y, { width: CONTENT_W })
    doc.moveDown(0.3)
  }

  // ── TABLA DE ÍTEMS ──────────────────────────────────────────────────────────
  sectionTitle(doc, `Ítems de Inspección (${inspeccionados}/${totalItems} completados)`)

  // Definición de columnas
  const cols = [
    { label: '#',           w: 22  },
    { label: 'Código',      w: 108 },
    { label: 'Descripción', w: 130 },
    { label: 'Inspector',   w: 95  },
    { label: 'Fecha',       w: 72  },
    { label: 'Observación', w: CONTENT_W - 22 - 108 - 130 - 95 - 72 },
  ]

  let rowY = drawTableHeader(doc, cols, doc.y)

  items.forEach((item, idx) => {
    // Salto de página si queda poco espacio
    if (rowY > PAGE_H - 80) {
      doc.addPage()
      rowY = MARGIN + 20
      rowY = drawTableHeader(doc, cols, rowY)
    }

    const fechaStr = item.fecha_inspeccion
      ? new Date(item.fecha_inspeccion).toLocaleDateString('es-CL')
      : '—'

    const estadoItem = item.inspeccionado
      ? { text: String(idx + 1), __bold: false }
      : { text: String(idx + 1), __bold: false, color: '#94a3b8' }

    const values = [
      estadoItem,
      item.ubicacion_tecnica?.codigo ?? '—',
      item.ubicacion_tecnica?.descripcion ?? '—',
      item.ejecutado_por?.nombre ?? '—',
      fechaStr,
      item.observacion ?? '',
    ]

    rowY = drawTableRow(doc, cols, values, rowY, idx % 2 === 1)

    // Si hay hallazgo vinculado, agregar sub-fila
    if (item.hallazgo) {
      if (rowY > PAGE_H - 60) { doc.addPage(); rowY = MARGIN + 20 }
      doc.rect(MARGIN, rowY, CONTENT_W, 12).fill('#fff5f5')
      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#dc2626')
         .text(
           `  ⚠  Hallazgo vinculado: ${item.hallazgo.numero_aviso}`,
           MARGIN + 4, rowY + 2.5,
           { width: CONTENT_W - 8, lineBreak: false }
         )
      rowY += 12
    }
  })

  // Borde inferior tabla
  doc.moveTo(MARGIN, rowY).lineTo(PAGE_W - MARGIN, rowY)
     .strokeColor('#cbd5e1').lineWidth(0.5).stroke()
  rowY += 10

  // ── DETALLE POR ÍTEM (checklist + fotos) ────────────────────────────────────
  const itemsDetalle = items.filter(i =>
    i.inspeccionado && (i.respuestas?.length > 0 || i.fotos?.length > 0 || i.foto_url)
  )
  if (itemsDetalle.length > 0) {
    doc.y = rowY
    sectionTitle(doc, `Detalle por Ítem Inspeccionado (${itemsDetalle.length})`)

    for (const item of itemsDetalle) {
      const idxGlobal = items.indexOf(item) + 1

      if (doc.y > PAGE_H - 100) { doc.addPage(); doc.y = MARGIN + 20 }

      // Cabecera del ítem
      doc.rect(MARGIN, doc.y, CONTENT_W, 16).fill('#f1f5f9')
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#374151')
         .text(
           `#${idxGlobal}  ${item.ubicacion_tecnica?.codigo ?? ''}  —  ${item.ubicacion_tecnica?.descripcion ?? ''}`,
           MARGIN + 6, doc.y + 4,
           { width: CONTENT_W - 12, lineBreak: false }
         )
      doc.y += 18

      // Inspector + fecha
      const fechaInsp = item.fecha_inspeccion
        ? new Date(item.fecha_inspeccion).toLocaleString('es-CL')
        : '—'
      doc.fontSize(7.5).font('Helvetica').fillColor('#6b7280')
         .text(`Inspector: ${item.ejecutado_por?.nombre ?? '—'}   ·   Fecha: ${fechaInsp}`, MARGIN + 4, doc.y, { width: CONTENT_W - 8 })
      doc.moveDown(0.3)

      // Checklist
      if (item.respuestas?.length > 0) {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#6366f1')
           .text('Checklist:', MARGIN + 4, doc.y)
        doc.moveDown(0.2)

        for (const resp of item.respuestas) {
          if (doc.y > PAGE_H - 40) { doc.addPage(); doc.y = MARGIN + 20 }
          const label   = resp.campo?.etiqueta ?? '?'
          const valor   = resp.valor ?? '—'
          const unidad  = resp.campo?.unidad_medida ? ` ${resp.campo.unidad_medida}` : ''
          doc.fontSize(7.5).font('Helvetica').fillColor('#374151')
             .text(`  •  ${label}: ${valor}${unidad}`, MARGIN + 12, doc.y, { width: CONTENT_W - 20 })
          doc.moveDown(0.15)
        }
        doc.moveDown(0.25)
      }

      // Fotos (usa tabla ItemEjecucionFoto ordenada; cae en foto_url si no hay)
      const fotoUrls = item.fotos?.length > 0
        ? item.fotos.map(f => f.foto_url)
        : item.foto_url ? [item.foto_url] : []

      for (const url of fotoUrls) {
        if (doc.y > PAGE_H - 140) { doc.addPage(); doc.y = MARGIN + 20 }
        const buffer = await fetchFotoBuffer(url)
        if (buffer) {
          try {
            doc.image(buffer, { fit: [CONTENT_W, 180], align: 'center' })
            doc.moveDown(0.4)
          } catch {
            doc.fontSize(8).fillColor('#9ca3af').text('No se pudo incrustar la imagen.', MARGIN, doc.y)
            doc.moveDown(0.3)
          }
        }
      }

      // Observación
      if (item.observacion) {
        doc.fontSize(8).font('Helvetica').fillColor('#4b5563')
           .text(`Obs: "${item.observacion}"`, MARGIN + 4, doc.y, { width: CONTENT_W - 8, lineGap: 2 })
        doc.moveDown(0.3)
      }

      doc.moveDown(0.4)
    }

    rowY = doc.y
  }

  // ── RESUMEN FINAL ────────────────────────────────────────────────────────────
  if (rowY > PAGE_H - 60) { doc.addPage(); rowY = MARGIN + 20 }

  doc.y = rowY

  // Caja de resumen
  const resumenH = 36
  doc.rect(MARGIN, doc.y, CONTENT_W, resumenH).fill('#f0f9ff').stroke('#bae6fd')
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0369a1')
     .text('Resumen de ejecución', MARGIN + 12, doc.y + 8)

  const resumenTxt = [
    `${inspeccionados} de ${totalItems} componentes inspeccionados (${pct}%)`,
    hallazgosCount > 0 ? `${hallazgosCount} hallazgo${hallazgosCount !== 1 ? 's' : ''} generado${hallazgosCount !== 1 ? 's' : ''}` : 'Sin hallazgos registrados',
  ].join('   ·   ')

  doc.fontSize(8).font('Helvetica').fillColor('#0c4a6e')
     .text(resumenTxt, MARGIN + 12, doc.y + 10, { width: CONTENT_W - 24 })

  // ── PIE DE PÁGINA ────────────────────────────────────────────────────────────
  doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
     .text(
       `SGConfi Inspector — Documento generado automáticamente — ${new Date().toLocaleDateString('es-CL')}`,
       MARGIN, PAGE_H - 32,
       { align: 'center', width: CONTENT_W }
     )

  doc.end()
}

module.exports = { generarPdfEjecucion }
