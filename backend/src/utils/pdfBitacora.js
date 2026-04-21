const PDFDocument = require('pdfkit')
const https = require('https')
const http = require('http')

const COLORS = {
  primary: '#1e3a5f',
  accent:  '#2563eb',
  gray:    '#6b7280',
  light:   '#f3f4f6',
  red:     '#dc2626',
  orange:  '#ea580c',
  green:   '#16a34a',
  purple:  '#7c3aed',
}

const TIPO_LABEL = {
  NOVEDAD:           'NOVEDAD',
  INCIDENTE:         'INCIDENTE',
  TRABAJO_REALIZADO: 'TRABAJO REALIZADO',
  CONDICION_AREA:    'CONDICIÓN ÁREA',
  REUNION:           'REUNIÓN',
  OTRO:              'OTRO',
  SIN_NOVEDADES:     'SIN NOVEDADES',
}

const CRITICIDAD_COLOR = { BAJA: '#22c55e', MEDIA: '#f59e0b', ALTA: '#f97316', CRITICA: '#dc2626' }

function formatFecha(date) {
  return new Date(date).toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' })
}

function formatFechaSolo(date) {
  return new Date(date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function fetchBuffer(url) {
  return new Promise((resolve) => {
    try {
      const base = process.env.APP_URL || 'http://localhost:3001'
      const fullUrl = url.startsWith('http') ? url : `${base}${url}`
      const client = fullUrl.startsWith('https') ? https : http
      const req = client.get(fullUrl, { timeout: 5000 }, (res) => {
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', () => resolve(null))
      })
      req.on('error', () => resolve(null))
      req.on('timeout', () => { req.destroy(); resolve(null) })
    } catch {
      resolve(null)
    }
  })
}

async function generarPdfBitacora(res, { semana, disciplinaNombre, items, incluirFotos, generadoPor }) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="bitacora-${semana}.pdf"`)
  doc.pipe(res)

  const W = doc.page.width - 100

  // ── Encabezado ────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary)
  doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
    .text('SGConfi Inspector', 50, 20)
  doc.fontSize(11).font('Helvetica')
    .text('REPORTE SEMANAL DE BITÁCORA', 50, 44)
  doc.fillColor(COLORS.light).fontSize(9)
    .text(`Semana ${semana}  ·  ${disciplinaNombre || 'Todas las disciplinas'}  ·  Generado por: ${generadoPor}`, 50, 62)

  doc.moveDown(4)

  // ── Resumen ───────────────────────────────────────────────────────────────
  const entradas  = items.filter(i => i.origen === 'ENTRADA')
  const hallazgos = items.filter(i => i.origen === 'HALLAZGO')
  const inspecs   = items.filter(i => i.origen === 'INSPECCION')

  doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold').text('RESUMEN EJECUTIVO', { underline: true })
  doc.moveDown(0.3)
  doc.fillColor('#111').fontSize(9).font('Helvetica')
  doc.text(`Entradas manuales: ${entradas.length}`)
  doc.text(`Hallazgos registrados: ${hallazgos.length}`)
  doc.text(`Inspecciones: ${inspecs.length}`)
  doc.moveDown(1)

  // ── Items agrupados por día ───────────────────────────────────────────────
  const porDia = {}
  for (const item of items) {
    const dia = new Date(item.fecha).toISOString().slice(0, 10)
    if (!porDia[dia]) porDia[dia] = []
    porDia[dia].push(item)
  }

  const diasOrdenados = Object.keys(porDia).sort()

  for (const dia of diasOrdenados) {
    // Encabezado de día
    doc.rect(50, doc.y, W, 18).fill(COLORS.light)
    doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold')
      .text(formatFechaSolo(dia + 'T12:00:00Z').toUpperCase(), 56, doc.y - 14)
    doc.moveDown(0.8)

    for (const item of porDia[dia]) {
      if (doc.y > doc.page.height - 150) doc.addPage()

      if (item.origen === 'ENTRADA') {
        await renderEntrada(doc, item, W, incluirFotos)
      } else if (item.origen === 'HALLAZGO') {
        renderHallazgo(doc, item, W)
      } else if (item.origen === 'INSPECCION') {
        renderInspeccion(doc, item, W)
      }
      doc.moveDown(0.5)
    }
  }

  doc.end()
}

async function renderEntrada(doc, item, W, incluirFotos) {
  const yStart = doc.y
  const tipoLabel = TIPO_LABEL[item.meta.tipo] || item.meta.tipo
  const color = item.tipo === 'SIN_NOVEDADES' ? COLORS.gray : COLORS.accent

  doc.rect(50, yStart, 4, 0).fill(color)  // borde izq placeholder — se dibujará después

  doc.fillColor(color).fontSize(8).font('Helvetica-Bold')
    .text(`${tipoLabel}  ·  ${item.hora}`, 58, yStart)
  doc.fillColor('#111').fontSize(10).font('Helvetica-Bold')
    .text(item.titulo, 58)
  doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
    .text(`${item.autor.nombre}  ·  ${item.ubicacion || ''}`)
  doc.fillColor('#333').fontSize(9).font('Helvetica')
    .text(item.resumen, 58, doc.y, { width: W - 10 })

  if (incluirFotos && item.meta.fotos_count > 0 && item._fotos?.length) {
    doc.moveDown(0.4)
    for (const f of item._fotos.slice(0, 3)) {
      const buf = await fetchBuffer(f.foto_url)
      if (buf) {
        doc.image(buf, { fit: [160, 120], align: 'left' })
        doc.moveDown(0.3)
      }
    }
  }

  if (item._archivos?.length) {
    doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
      .text(`Archivos adjuntos: ${item._archivos.map(a => a.nombre).join(', ')}`)
  }

  // Borde izquierdo real
  const yEnd = doc.y
  doc.rect(50, yStart, 3, yEnd - yStart).fill(color)
  doc.moveDown(0.3)
}

function renderHallazgo(doc, item, W) {
  const yStart = doc.y
  const critColor = CRITICIDAD_COLOR[item.meta.criticidad] || COLORS.red

  doc.fillColor(COLORS.red).fontSize(8).font('Helvetica-Bold')
    .text(`HALLAZGO  ·  ${item.hora}`, 58, yStart)
  doc.fillColor('#111').fontSize(10).font('Helvetica-Bold')
    .text(`${item.meta.numero_aviso}  —  ${item.titulo}`, 58)
  doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
    .text(`${item.autor.nombre}  ·  ${item.ubicacion || ''}  ·  Estado: ${item.meta.estado}`)
  doc.rect(58, doc.y, 50, 12).fill(critColor)
  doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
    .text(item.meta.criticidad, 60, doc.y - 10, { width: 46, align: 'center' })
  doc.moveDown(0.5)

  const yEnd = doc.y
  doc.rect(50, yStart, 3, yEnd - yStart).fill(COLORS.red)
}

function renderInspeccion(doc, item, W) {
  const yStart = doc.y
  doc.fillColor(COLORS.purple).fontSize(8).font('Helvetica-Bold')
    .text(`INSPECCIÓN  ·  ${item.hora}`, 58, yStart)
  doc.fillColor('#111').fontSize(10).font('Helvetica-Bold')
    .text(item.titulo, 58)
  doc.fillColor(COLORS.gray).fontSize(8).font('Helvetica')
    .text(`${item.autor.nombre}  ·  ${item.meta.items_ejecutados}/${item.meta.items_total} ítems  ·  ${item.meta.estado || ''}`)

  const yEnd = doc.y
  doc.rect(50, yStart, 3, yEnd - yStart).fill(COLORS.purple)
  doc.moveDown(0.3)
}

module.exports = { generarPdfBitacora }
