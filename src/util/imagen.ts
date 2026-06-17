// Utilidad de imagen (capa de presentación, sin backend).
// Lee un archivo de imagen, lo redimensiona (máx. `maxLado` px de lado) y lo
// devuelve como dataURL JPEG comprimido. Así la foto ocupa poco y cabe en
// localStorage. Se usa tanto en el panel del vendedor como en el chat.
export function comprimirImagen(archivo: File, maxLado = 400, calidad = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onerror = () => reject(new Error('No se pudo leer el archivo'))
    lector.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
      img.onload = () => {
        let { width, height } = img
        // Escalamos manteniendo la proporción para que el lado mayor sea maxLado.
        if (width > height && width > maxLado) {
          height = Math.round((height * maxLado) / width)
          width = maxLado
        } else if (height >= width && height > maxLado) {
          width = Math.round((width * maxLado) / height)
          height = maxLado
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))
        // Fondo blanco: si la imagen es PNG con transparencia, al pasar a JPEG
        // las zonas transparentes quedan blancas (no negras).
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.src = lector.result as string
    }
    lector.readAsDataURL(archivo)
  })
}
