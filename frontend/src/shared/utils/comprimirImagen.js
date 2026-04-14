/**
 * Comprime una imagen usando Canvas API antes de subirla al servidor.
 * - Si el archivo ya es menor a 300 KB, lo retorna sin modificar.
 * - Redimensiona si el lado mayor supera 2000 px.
 * - Re-encodea como JPEG con calidad 0.82 (~300–600 KB para fotos de campo).
 */
export async function comprimirImagen(file) {
  const LIMITE_SIN_COMPRIMIR = 300 * 1024 // 300 KB
  const MAX_LADO = 2000
  const CALIDAD = 0.82

  if (file.size <= LIMITE_SIN_COMPRIMIR) return file

  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap

  let nuevoAncho = width
  let nuevoAlto = height

  if (Math.max(width, height) > MAX_LADO) {
    if (width >= height) {
      nuevoAncho = MAX_LADO
      nuevoAlto = Math.round((height / width) * MAX_LADO)
    } else {
      nuevoAlto = MAX_LADO
      nuevoAncho = Math.round((width / height) * MAX_LADO)
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = nuevoAncho
  canvas.height = nuevoAlto

  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, nuevoAncho, nuevoAlto)
  bitmap.close()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', CALIDAD)
  )

  const nombreBase = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${nombreBase}.jpg`, { type: 'image/jpeg' })
}
