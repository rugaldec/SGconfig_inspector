import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { guardarPendiente, listarPendientes, eliminarPendiente } from '../utils/offlineStorage'
import { useOnlineStatus } from './useOnlineStatus'
import apiClient from '../../lib/apiClient'

const MAX_PENDIENTES = 5

export function useOfflineQueue() {
  const qc = useQueryClient()
  const isOnline = useOnlineStatus()
  const [pendientes, setPendientes] = useState([])

  useEffect(() => {
    listarPendientes().then(setPendientes).catch(() => {})
  }, [])

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
        await apiClient.post('/hallazgos', fd)
        await eliminarPendiente(item.id)
      } catch {
        break // Si falla uno, detener — reintentará al siguiente ciclo online
      }
    }

    const restantes = await listarPendientes()
    setPendientes(restantes)
    qc.invalidateQueries({ queryKey: ['hallazgos'] })
  }, [qc])

  useEffect(() => {
    if (isOnline) sincronizar()
  }, [isOnline, sincronizar])

  async function enqueue(datos) {
    const lista = await listarPendientes()
    if (lista.length >= MAX_PENDIENTES) {
      throw new Error(`Cola llena. Máximo ${MAX_PENDIENTES} hallazgos sin conexión.`)
    }

    let fotoBase64 = null
    let fotoMime = null
    if (datos.foto) {
      fotoBase64 = await fileToBase64(datos.foto)
      fotoMime = datos.foto.type
    }

    const item = {
      id: crypto.randomUUID(),
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

  return { pendientes, enqueue, isOnline }
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
