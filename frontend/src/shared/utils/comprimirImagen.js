/**
 * Comprime una imagen usando Canvas API antes de subirla al servidor.
 * Compatible con Safari iOS, Chrome Android y todos los navegadores modernos.
 * - Si el archivo ya es menor a 300 KB, lo retorna sin modificar.
 * - Redimensiona si el lado mayor supera 2000 px.
 * - Re-encodea como JPEG con calidad 0.82 (~300–600 KB para fotos de campo).
 */
export async function comprimirImagen(file) {
  const LIMITE_SIN_COMPRIMIR = 300 * 1024 // 300 KB
  const MAX_LADO = 2000
  const CALIDAD = 0.82

  if (file.size <= LIMITE_SIN_COMPRIMIR) return file

  // Usar FileReader en lugar de createImageBitmap (compatible con Safari iOS)
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  const { naturalWidth: width, naturalHeight: height } = img

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
  ctx.drawImage(img, 0, 0, nuevoAncho, nuevoAlto)

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', CALIDAD)
  )

  // Si la compresión falla por algún motivo, retornar el original
  if (!blob) return file

  const nombreBase = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${nombreBase}.jpg`, { type: 'image/jpeg' })
}
