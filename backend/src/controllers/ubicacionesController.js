const prisma = require('../db/client')
const { ok, fail } = require('../utils/responseHelper')
const xlsx = require('xlsx')

// Construye el árbol anidado desde un array plano
function construirArbol(nodes) {
  const mapa = {}
  nodes.forEach(n => { mapa[n.id] = { ...n, hijos: [] } })
  const raices = []
  nodes.forEach(n => {
    if (n.padre_id && mapa[n.padre_id]) {
      mapa[n.padre_id].hijos.push(mapa[n.id])
    } else {
      raices.push(mapa[n.id])
    }
  })
  return raices
}

async function arbol(req, res) {
  const [nodes, conteos] = await Promise.all([
    prisma.ubicacionTecnica.findMany({
      where: { activo: true },
      orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }],
    }),
    // Conteo de hallazgos por ubicación (solo nivel 4, activos y totales)
    prisma.hallazgo.groupBy({
      by: ['ubicacion_tecnica_id'],
      _count: { id: true },
    }),
  ])

  // Mapa de conteos totales y activos por ubicacion_id
  const conteosMap = {}
  const conteosActivos = await prisma.hallazgo.groupBy({
    by: ['ubicacion_tecnica_id'],
    where: { estado: { notIn: ['CERRADO', 'RECHAZADO'] } },
    _count: { id: true },
  })
  for (const c of conteos) conteosMap[c.ubicacion_tecnica_id] = { total: c._count.id, activos: 0 }
  for (const c of conteosActivos) {
    if (conteosMap[c.ubicacion_tecnica_id]) conteosMap[c.ubicacion_tecnica_id].activos = c._count.id
    else conteosMap[c.ubicacion_tecnica_id] = { total: 0, activos: c._count.id }
  }

  // Agregar conteos a cada nodo
  const nodesConConteo = nodes.map(n => ({
    ...n,
    _hallazgos: conteosMap[n.id] ?? null,
  }))

  // Propagar conteos hacia arriba en el árbol construido
  const arbolData = construirArbol(nodesConConteo)

  function propagarConteos(nodo) {
    if (!nodo.hijos?.length) return nodo._hallazgos ?? { total: 0, activos: 0 }
    let total = nodo._hallazgos?.total ?? 0
    let activos = nodo._hallazgos?.activos ?? 0
    for (const hijo of nodo.hijos) {
      const sub = propagarConteos(hijo)
      total += sub.total
      activos += sub.activos
    }
    nodo._hallazgos = { total, activos }
    return { total, activos }
  }
  for (const raiz of arbolData) propagarConteos(raiz)

  return ok(res, arbolData)
}

async function buscar(req, res) {
  const { q = '' } = req.query
  const nodes = await prisma.ubicacionTecnica.findMany({
    where: {
      activo: true,
      OR: [
        { codigo: { contains: q, mode: 'insensitive' } },
        { descripcion: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }],
    take: 50,
  })
  return ok(res, nodes)
}

async function uno(req, res) {
  const node = await prisma.ubicacionTecnica.findUnique({
    where: { id: req.params.id },
    include: { padre: true },
  })
  if (!node) return fail(res, 'NOT_FOUND', 'Ubicación no encontrada', 404)
  return ok(res, node)
}

async function crear(req, res) {
  const { codigo, descripcion, nivel, padre_id } = req.body
  if (!codigo || !descripcion || !nivel) return fail(res, 'DATOS_INCOMPLETOS', 'codigo, descripcion y nivel son obligatorios')

  const codigoNorm = codigo.trim().toUpperCase()
  const existente = await prisma.ubicacionTecnica.findUnique({ where: { codigo: codigoNorm } })
  if (existente) return fail(res, 'CODIGO_DUPLICADO', `El código "${codigoNorm}" ya existe`, 409)

  if (padre_id) {
    const padre = await prisma.ubicacionTecnica.findUnique({ where: { id: padre_id } })
    if (!padre) return fail(res, 'PADRE_INVALIDO', 'Ubicación padre no encontrada', 404)
    if (Number(nivel) !== padre.nivel + 1) return fail(res, 'NIVEL_INVALIDO', 'El nivel debe ser padre.nivel + 1')
    const prefijo = padre.codigo.toUpperCase() + '-'
    if (!codigoNorm.startsWith(prefijo)) {
      return fail(res, 'CODIGO_SIN_PREFIJO', `El código debe comenzar con "${prefijo}"`, 400)
    }
    if (codigoNorm === prefijo) {
      return fail(res, 'CODIGO_INCOMPLETO', `Agrega un sufijo después de "${prefijo}"`, 400)
    }
  }

  const node = await prisma.ubicacionTecnica.create({
    data: { codigo: codigoNorm, descripcion: descripcion.trim(), nivel: Number(nivel), padre_id: padre_id || null },
  })
  return ok(res, node, null, 201)
}

async function actualizar(req, res) {
  const { descripcion, activo } = req.body
  const node = await prisma.ubicacionTecnica.findUnique({ where: { id: req.params.id } })
  if (!node) return fail(res, 'NOT_FOUND', 'Ubicación no encontrada', 404)

  const actualizado = await prisma.ubicacionTecnica.update({
    where: { id: req.params.id },
    data: {
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(activo !== undefined && { activo }),
    },
  })
  return ok(res, actualizado)
}

async function eliminar(req, res) {
  const node = await prisma.ubicacionTecnica.findUnique({ where: { id: req.params.id } })
  if (!node) return fail(res, 'NOT_FOUND', 'Ubicación no encontrada', 404)

  const hijos = await prisma.ubicacionTecnica.count({ where: { padre_id: req.params.id, activo: true } })
  if (hijos > 0) return fail(res, 'CON_HIJOS', 'Elimina o desactiva los componentes hijos antes de eliminar este nodo', 409)

  const hallazgos = await prisma.hallazgo.count({ where: { ubicacion_tecnica_id: req.params.id } })
  if (hallazgos > 0) return fail(res, 'TIENE_HALLAZGOS', `No se puede eliminar: tiene ${hallazgos} hallazgo${hallazgos > 1 ? 's' : ''} asociado${hallazgos > 1 ? 's' : ''}`, 409)

  await prisma.ubicacionTecnica.update({ where: { id: req.params.id }, data: { activo: false } })
  return ok(res, null, 'Ubicación desactivada')
}

async function importar(req, res) {
  if (!req.file) return fail(res, 'ARCHIVO_REQUERIDO', 'Se requiere un archivo Excel o CSV')

  let filas
  try {
    const wb = xlsx.read(req.file.buffer, { type: 'buffer' })
    const hoja = wb.Sheets[wb.SheetNames[0]]
    filas = xlsx.utils.sheet_to_json(hoja, { defval: '' })
  } catch {
    return fail(res, 'ARCHIVO_INVALIDO', 'No se pudo leer el archivo')
  }

  // Ordenar por nivel ascendente para que los padres existan primero
  filas.sort((a, b) => Number(a.nivel || 0) - Number(b.nivel || 0))

  let creados = 0, omitidos = 0
  const errores = []

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i]
    const { codigo, descripcion, nivel, codigo_padre } = fila
    const numFila = i + 2

    if (!codigo || !descripcion || !nivel) {
      errores.push({ fila: numFila, motivo: 'Faltan campos obligatorios (codigo, descripcion, nivel)' })
      continue
    }

    const codigoNorm = String(codigo).trim().toUpperCase()

    const existente = await prisma.ubicacionTecnica.findUnique({ where: { codigo: codigoNorm } })
    if (existente) {
      errores.push({ fila: numFila, motivo: `El código "${codigoNorm}" ya existe — omitido` })
      omitidos++
      continue
    }

    let padre_id = null
    if (codigo_padre) {
      const padre = await prisma.ubicacionTecnica.findUnique({ where: { codigo: String(codigo_padre).trim().toUpperCase() } })
      if (!padre) {
        errores.push({ fila: numFila, motivo: `Padre '${codigo_padre}' no encontrado` })
        continue
      }
      const prefijo = padre.codigo.toUpperCase() + '-'
      if (!codigoNorm.startsWith(prefijo)) {
        errores.push({ fila: numFila, motivo: `El código "${codigoNorm}" debe comenzar con "${prefijo}"` })
        continue
      }
      if (codigoNorm === prefijo) {
        errores.push({ fila: numFila, motivo: `El código "${codigoNorm}" no tiene sufijo después del guion` })
        continue
      }
      padre_id = padre.id
    }

    try {
      await prisma.ubicacionTecnica.create({
        data: {
          codigo: codigoNorm,
          descripcion: String(descripcion).trim(),
          nivel: Number(nivel),
          padre_id,
        },
      })
      creados++
    } catch (e) {
      errores.push({ fila: numFila, motivo: e.message })
    }
  }

  return ok(res, { creados, omitidos, errores })
}

async function exportarCsv(req, res) {
  const nodes = await prisma.ubicacionTecnica.findMany({
    where: { activo: true },
    orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }],
  })

  // Mapa id → codigo para resolver codigo_padre
  const codigoPorId = {}
  nodes.forEach(n => { codigoPorId[n.id] = n.codigo })

  const NIVEL_LABEL = { 1: 'Planta', 2: 'Área', 3: 'Activo', 4: 'Componente' }

  const filas = nodes.map(n => [
    n.codigo,
    n.descripcion,
    n.nivel,
    NIVEL_LABEL[n.nivel] ?? `Nivel ${n.nivel}`,
    n.padre_id ? (codigoPorId[n.padre_id] ?? '') : '',
  ])

  const header = 'codigo,descripcion,nivel,nivel_label,codigo_padre'
  const csv = [header, ...filas.map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\r\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="ubicaciones.csv"')
  res.send('\uFEFF' + csv) // BOM para que Excel abra correctamente
}

module.exports = { arbol, buscar, uno, crear, actualizar, eliminar, importar, exportarCsv }
