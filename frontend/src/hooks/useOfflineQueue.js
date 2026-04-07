import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { guardarPendiente, listarPendientes, eliminarPendiente } from '../utils/offlineStorage'
import api from '../api/client'
import { useQueryClient } from '@tanstack/react-query'

const MAX_PENDIENTES = 5

export function useOfflineQueue() {
  const qc = useQueryClient()
  const [pendientes, setPendientes] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    listarPendientes().then(setPendientes).catch(() => {})
  }, [])

  useEffect(() => {
    function online() { setIsOnline(true); sincronizar() }
    function offline() { setIsOnline(false) }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])

  async function enqueue(datos) {
    const lista = await listarPendientes()
    if (lista.length >= MAX_PENDIENTES) {
      throw new Error(`Cola llena. Máximo ${MAX_PENDIENTES} hallazgos sin conexión permitidos.`)
    }

    // Serializar la foto como base64
    let fotoBase64 = null
    let fotoMime = null
    if (datos.foto) {
      fotoBase64 = await fileToBase64(datos.foto)
      fotoMime = datos.foto.type
    }

    const item = {
      id: uuidv4(),
      ubicacion_tecnica_id: datos.ubicacion_tecnica_id,
      descripcion: datos.descripcion,
      criticidad: datos.criticidad,
      ubicacion: datos.ubicacion,
      fotoBase64,
      fotoMime,
      fecha: new Date().toISOString(),
    }

    await guardarPendiente(item)
    const nuevos = await listarPendientes()
    setPendientes(nuevos)
  }

  const sincronizar = useCallback(async () => {
    const lista = await listarPendientes()
    if (!lista.length) return

    for (const item of lista) {
      try {
        const fd = new FormData()
        fd.append('ubicacion_tecnica_id', item.ubicacion_tecnica_id)
        fd.append('descripcion', item.descripcion)
        fd.append('criticidad', item.criticidad)

        if (item.fotoBase64) {
          const blob = base64ToBlob(item.fotoBase64, item.fotoMime)
          fd.append('foto', blob, 'foto.jpg')
        }

        await api.post('/hallazgos', fd)
        await eliminarPendiente(item.id)
      } catch {
        // Si falla el sync de un item, se deja para el próximo intento
        break
      }
    }

    const restantes = await listarPendientes()
    setPendientes(restantes)
    qc.invalidateQueries({ queryKey: ['hallazgos-mios'] })
  }, [qc])

  return { pendientes, enqueue, sincronizar, isOnline }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function base64ToBlob(base64, mime) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
