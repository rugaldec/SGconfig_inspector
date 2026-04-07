const { v4: uuidv4 } = require('uuid')
const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const { generarNumeroAviso } = require('../utils/numeroAviso')
const { puedeTransicionar } = require('../utils/estadoMachine')
const { guardar } = require('../utils/storageService')
const { generarPdfHallazgo } = require('../utils/pdfHallazgo')
const { notificarNuevoHallazgo } = require('../utils/notificarHallazgo')

const INCLUDE_DETALLE = {
  inspector: { select: { id: true, nombre: true, email: true } },
  ubicacion_tecnica: { select: { id: true, codigo: true, descripcion: true, nivel: true } },
  comentarios: {
    include: { autor: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { fecha_creacion: 'asc' },
  },
  cambios_estado: {
    include: { usuario: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { fecha: 'asc' },
  },
}

async function crear(req, res) {
  if (!req.file) return fail(res, 'FOTO_REQUERIDA', 'La foto es obligatoria', 400)

  const { ubicacion_tecnica_id, descripcion, criticidad, categoria } = req.body
  if (!ubicacion_tecnica_id || !descripcion || !criticidad || !categoria) {
    return fail(res, 'DATOS_INCOMPLETOS', 'Ubicación, descripción, criticidad y categoría son obligatorios')
  }
  const CATEGORIAS_VALIDAS = ['SEGURIDAD', 'MANTENIMIENTO', 'OPERACIONES']
  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    return fail(res, 'CATEGORIA_INVALIDA', 'Categoría no válida', 400)
  }

  const ubicacion = await prisma.ubicacionTecnica.findUnique({ where: { id: ubicacion_tecnica_id } })
  if (!ubicacion || !ubicacion.activo) return fail(res, 'UBICACION_INVALIDA', 'Ubicación técnica no encontrada', 404)
  if (ubicacion.nivel !== 4) return fail(res, 'NIVEL_INVALIDO', 'Solo se pueden registrar hallazgos en Sub Equipos (nivel 4)', 400)

  const fotoUrl = await guardar(req.file.buffer, req.file.mimetype, uuidv4())

  const hallazgo = await prisma.$transaction(async (tx) => {
    const numeroAviso = await generarNumeroAviso(tx)
    const h = await tx.hallazgo.create({
      data: {
        numero_aviso: numeroAviso,
        ubicacion_tecnica_id,
        descripcion: descripcion.trim(),
        criticidad,
        categoria,
        foto_url: fotoUrl,
        inspector_id: req.user.id,
      },
    })
    await tx.cambioEstado.create({
      data: {
        hallazgo_id: h.id,
        estado_anterior: null,
        estado_nuevo: 'ABIERTO',
        usuario_id: req.user.id,
      },
    })
    return h
  })

  // Notificación por correo — fire & forget (no bloquea la respuesta)
  const hallazgoConDetalle = await prisma.hallazgo.findUnique({
    where: { id: hallazgo.id },
    include: {
      inspector: { select: { nombre: true } },
      ubicacion_tecnica: { select: { codigo: true, descripcion: true } },
    },
  })
  notificarNuevoHallazgo(hallazgoConDetalle).catch(() => {})

  return ok(res, hallazgo, 'Hallazgo creado', 201)
}

async function listar(req, res) {
  const { estado, criticidad, categoria, ubicacion_id, inspector_id, desde, hasta, page = 1, limit = 20, sort = 'fecha_creacion', order = 'desc' } = req.query

  const where = {}
  if (estado) where.estado = estado
  if (criticidad) where.criticidad = criticidad
  if (categoria) where.categoria = categoria
  if (ubicacion_id) where.ubicacion_tecnica_id = ubicacion_id
  if (inspector_id) where.inspector_id = inspector_id
  if (desde || hasta) {
    where.fecha_creacion = {}
    if (desde) where.fecha_creacion.gte = new Date(desde)
    if (hasta) where.fecha_creacion.lte = new Date(hasta)
  }

  const skip = (Number(page) - 1) * Number(limit)
  const [total, items] = await Promise.all([
    prisma.hallazgo.count({ where }),
    prisma.hallazgo.findMany({
      where,
      include: { inspector: { select: { id: true, nombre: true } }, ubicacion_tecnica: { select: { codigo: true, descripcion: true } } },
      orderBy: { [sort]: order },
      skip,
      take: Number(limit),
    }),
  ])

  return ok(res, items, null, 200)
}

async function mios(req, res) {
  const hallazgos = await prisma.hallazgo.findMany({
    where: { inspector_id: req.user.id },
    include: { ubicacion_tecnica: { select: { codigo: true, descripcion: true } } },
    orderBy: { fecha_creacion: 'desc' },
  })
  return ok(res, hallazgos)
}

async function detalle(req, res) {
  const h = await prisma.hallazgo.findUnique({ where: { id: req.params.id }, include: INCLUDE_DETALLE })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  if (req.user.rol === 'INSPECTOR' && h.inspector_id !== req.user.id) {
    return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  }
  return ok(res, h)
}

async function cambiarEstado(req, res) {
  const { estado, motivo, numero_aviso_sap } = req.body
  if (!estado) return fail(res, 'ESTADO_REQUERIDO', 'El estado es obligatorio')

  if (estado === 'EN_GESTION' && !numero_aviso_sap?.trim()) {
    return fail(res, 'SAP_REQUERIDO', 'El número de aviso SAP es obligatorio al iniciar la gestión', 400)
  }

  if (estado === 'RECHAZADO' && !motivo?.trim()) {
    return fail(res, 'MOTIVO_REQUERIDO', 'El motivo es obligatorio al rechazar un hallazgo', 400)
  }

  if (estado === 'CERRADO' && !req.file) {
    return fail(res, 'FOTO_REQUERIDA', 'La foto de cierre es obligatoria para cerrar el hallazgo', 400)
  }

  const h = await prisma.hallazgo.findUnique({ where: { id: req.params.id } })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)

  if (!puedeTransicionar(h.estado, estado)) {
    return fail(res, 'TRANSICION_INVALIDA', `No se puede pasar de ${h.estado} a ${estado}`, 422)
  }

  let fotoDespuesUrl = undefined
  if (estado === 'CERRADO') {
    fotoDespuesUrl = await guardar(req.file.buffer, req.file.mimetype, uuidv4())
  }

  const actualizado = await prisma.$transaction(async (tx) => {
    const updateData = { estado }
    if (estado === 'EN_GESTION') updateData.numero_aviso_sap = numero_aviso_sap.trim().slice(0, 50)
    if (fotoDespuesUrl) updateData.foto_despues_url = fotoDespuesUrl
    const updated = await tx.hallazgo.update({ where: { id: h.id }, data: updateData })
    await tx.cambioEstado.create({
      data: { hallazgo_id: h.id, estado_anterior: h.estado, estado_nuevo: estado, usuario_id: req.user.id, motivo: motivo?.trim() || null },
    })
    return updated
  })

  return ok(res, actualizado)
}

async function asignarSap(req, res) {
  const { numero_aviso_sap } = req.body
  if (!numero_aviso_sap) return fail(res, 'SAP_REQUERIDO', 'El número de aviso SAP es obligatorio')

  const h = await prisma.hallazgo.findUnique({ where: { id: req.params.id } })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)

  const actualizado = await prisma.hallazgo.update({
    where: { id: req.params.id },
    data: { numero_aviso_sap: numero_aviso_sap.trim().slice(0, 50) },
  })
  return ok(res, actualizado)
}

async function agregarComentario(req, res) {
  const { texto } = req.body
  if (!texto?.trim()) return fail(res, 'TEXTO_REQUERIDO', 'El comentario no puede estar vacío')

  const h = await prisma.hallazgo.findUnique({ where: { id: req.params.id } })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  if (req.user.rol === 'INSPECTOR' && h.inspector_id !== req.user.id) {
    return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  }

  const comentario = await prisma.comentario.create({
    data: { hallazgo_id: req.params.id, autor_id: req.user.id, texto: texto.trim() },
    include: { autor: { select: { id: true, nombre: true, rol: true } } },
  })
  return ok(res, comentario, null, 201)
}

async function exportarCsv(req, res) {
  const { estado, criticidad, ubicacion_id, inspector_id, desde, hasta } = req.query
  const where = {}
  if (estado) where.estado = estado
  if (criticidad) where.criticidad = criticidad
  if (ubicacion_id) where.ubicacion_tecnica_id = ubicacion_id
  if (inspector_id) where.inspector_id = inspector_id
  if (desde || hasta) {
    where.fecha_creacion = {}
    if (desde) where.fecha_creacion.gte = new Date(desde)
    if (hasta) where.fecha_creacion.lte = new Date(hasta)
  }

  const hallazgos = await prisma.hallazgo.findMany({
    where,
    include: { inspector: { select: { nombre: true } }, ubicacion_tecnica: { select: { codigo: true, descripcion: true } } },
    orderBy: { fecha_creacion: 'desc' },
  })

  const cabecera = ['numero_aviso', 'numero_aviso_sap', 'estado', 'criticidad', 'ubicacion', 'descripcion', 'inspector', 'fecha_creacion']
  const filas = hallazgos.map(h => [
    h.numero_aviso,
    h.numero_aviso_sap || '',
    h.estado,
    h.criticidad,
    `${h.ubicacion_tecnica.codigo} - ${h.ubicacion_tecnica.descripcion}`,
    `"${h.descripcion.replace(/"/g, '""')}"`,
    h.inspector.nombre,
    h.fecha_creacion.toISOString(),
  ])

  const csv = [cabecera, ...filas].map(r => r.join(',')).join('\n')
  const fecha = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="hallazgos-${fecha}.csv"`)
  res.send('\uFEFF' + csv) // BOM para Excel
}

async function exportarPdf(req, res) {
  const h = await prisma.hallazgo.findUnique({
    where: { id: req.params.id },
    include: INCLUDE_DETALLE,
  })
  if (!h) return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  if (req.user.rol === 'INSPECTOR' && h.inspector_id !== req.user.id) {
    return fail(res, 'NOT_FOUND', 'Hallazgo no encontrado', 404)
  }

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="hallazgo-${h.numero_aviso}.pdf"`)
  await generarPdfHallazgo(h, res)
}

module.exports = { crear, listar, mios, detalle, cambiarEstado, asignarSap, agregarComentario, exportarCsv, exportarPdf }
