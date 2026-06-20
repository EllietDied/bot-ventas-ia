import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductos } from '../contexto/ProductosContext'
import { useCarrito } from '../contexto/CarritoContext'
import { useConsultas } from '../contexto/ConsultasContext'
import { useSesion } from '../contexto/SesionContext'
import { esComprador } from '../core/modelos/Comprador'
import { LogoUSS } from '../componentes/LogoUSS'
import { ImagenProducto } from '../componentes/ImagenProducto'
import { Icono } from '../componentes/Icono'
import { Producto } from '../core/modelos/Producto'
import { esVendedor } from '../core/modelos/Vendedor'
import { comprimirImagen } from '../util/imagen'
import { cargar, guardar } from '../core/datos/almacenamiento'
import { useToast } from '../contexto/ToastContext'
import {
  obtenerRespuestaAsistente,
  usarIAReal,
  resolverProductos,
  type MensajeHistorial,
} from '../core/servicios/AsistenteIAService'
import { buscarPorFoto } from '../core/servicios/BusquedaVisualService'

// Genera un id único para cada mensaje (evita claves repetidas en React).
let contadorMensaje = 0
function idUnico(): string {
  contadorMensaje += 1
  return 'M-' + Date.now() + '-' + contadorMensaje
}

// Un mensaje del asistente puede ser solo texto, traer productos
// recomendados (tarjetas) o una tabla de comparación.
interface MensajeAsistente {
  id: string
  emisor: 'usuario' | 'bot'
  texto: string
  productos?: Producto[]
  comparacion?: Producto[]
  acciones?: { label: string; valor: string; icono?: string }[] // botones de elección (flujo del vendedor)
  categorias?: string[] // chips de categoría (búsqueda por foto cuando no se identifica)
  pedirFoto?: boolean // muestra un selector de foto dentro del chat
  pensando?: boolean // mientras el asistente "procesa" la consulta
}

// Botones rápidos: lo que se muestra (label) y lo que se le envía al bot (query).
const BOTONES_RAPIDOS: { icono: string; label: string; query: string }[] = [
  { icono: 'gamer', label: 'Quiero algo gamer', query: 'Quiero algo gamer' },
  { icono: 'dinero', label: 'Busco algo económico', query: 'Busco algo económico' },
  { icono: 'pc', label: 'Armar una PC básica', query: 'Armar una PC básica' },
  { icono: 'ofertas', label: 'Ver ofertas', query: 'Ver ofertas económicas' },
]

// Menú (botones) del asistente de gestión del vendedor.
const MENU_VENDEDOR: { icono: string; label: string; valor: string }[] = [
  { icono: 'agregar', label: 'Agregar producto', valor: 'agregar' },
  { icono: 'editar', label: 'Modificar producto', valor: 'modificar' },
  { icono: 'eliminar', label: 'Eliminar producto', valor: 'eliminar' },
  { icono: 'caja', label: 'Ver mis productos', valor: 'mis productos' },
]

// Estado del flujo guiado del vendedor (máquina de pasos para agregar/modificar).
interface FlujoVendedor {
  modo: 'inactivo' | 'agregar' | 'modificar' | 'eliminar'
  paso: string
  borrador: Partial<Producto> // datos que se van juntando al agregar
  prodId?: number // producto que se está modificando
  campo?: string // campo que se está modificando
}
const FLUJO_INICIAL: FlujoVendedor = { modo: 'inactivo', paso: '', borrador: {} }

// PANTALLA PRINCIPAL: el Asistente IA es el centro de la aplicación.
export function Asistente() {
  const { productos, publicarProducto, editarProducto, eliminarProducto } = useProductos()
  const { agregarAlCarrito, cantidadTotal, items, total } = useCarrito()
  const { registrarConsulta, consultasRecientes, categoriasConsultadas } = useConsultas()
  const { usuarioActual } = useSesion()
  const toast = useToast()
  const navegar = useNavigate()

  const puedeComprar = usuarioActual ? esComprador(usuarioActual) : false
  const esVendedorActual = usuarioActual ? esVendedor(usuarioActual) : false
  // Productos publicados por este vendedor (para gestionarlos desde el chat).
  const misProductos = usuarioActual
    ? productos.filter((p) => p.idVendedor === usuarioActual.idUsuario)
    : []

  // Saludo personalizado con el nombre del usuario.
  const primerNombre = usuarioActual ? usuarioActual.nombre.split(' ')[0] : ''
  // El vendedor ve un asistente de GESTIÓN (agregar/modificar productos);
  // el comprador, el asistente de VENTAS (recomendaciones).
  const bienvenida: MensajeAsistente = esVendedorActual
    ? {
        id: 'A-0',
        emisor: 'bot',
        texto: `¡Hola${primerNombre ? ', ' + primerNombre : ''}! Soy tu asistente de gestión. Puedo ayudarte a agregar un producto nuevo o a modificar uno existente. Usa los botones de abajo o escríbeme.`,
        acciones: MENU_VENDEDOR,
      }
    : {
        id: 'A-0',
        emisor: 'bot',
        texto: `¡Hola${primerNombre ? ', ' + primerNombre : ''}! Bienvenido a IA InkaShop. Soy tu asistente de ventas: cuéntame qué buscas (por categoría, uso o presupuesto) y te recomendaré las mejores opciones. También puedes usar los botones rápidos de abajo.`,
      }

  // Chat separado por rol (no mezclar el de ventas con el de gestión).
  const claveChat = 'asistente_chat_' + (esVendedorActual ? 'vendedor' : 'comprador')
  const [mensajes, setMensajes] = useState<MensajeAsistente[]>(() =>
    cargar<MensajeAsistente[]>(claveChat, [bienvenida]),
  )
  const [texto, setTexto] = useState('')
  const [comparar, setComparar] = useState<Producto[]>([])
  const [flujo, setFlujo] = useState<FlujoVendedor>(FLUJO_INICIAL)
  const [cargando, setCargando] = useState(false) // mientras esperamos la respuesta del asistente
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // No guardamos los mensajes "pensando" (son temporales).
    guardar(claveChat, mensajes.filter((m) => !m.pensando))
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, claveChat])

  function agregarMensaje(m: MensajeAsistente) {
    setMensajes((prev) => [...prev, m])
  }

  // Reemplaza el contenido de un mensaje ya existente (por su id).
  function actualizarMensaje(id: string, cambios: Partial<MensajeAsistente>) {
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, ...cambios } : m)))
  }

  // Intenta deducir la categoría a partir del texto (para el historial / recomendaciones).
  function detectarCategoria(consulta: string): string {
    const t = consulta.toLowerCase()
    const p = productos.find((pr) => t.includes(pr.nombre.toLowerCase()))
    if (p) return p.categoria
    const categorias = [...new Set(productos.map((pr) => pr.categoria))]
    return categorias.find((c) => t.includes(c.toLowerCase())) ?? ''
  }

  // Envía un texto al asistente (desde el input o desde un botón rápido).
  async function enviarTexto(consulta: string) {
    const limpio = consulta.trim()
    if (limpio === '' || cargando) return // no enviamos vacíos ni por doble clic

    // 1) Mensaje del usuario.
    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: limpio })

    // 2) Registramos la consulta en la PILA LIFO (para historial y recomendaciones).
    //    Esto ocurre SIEMPRE, se use el modo simulado o la IA real.
    registrarConsulta(limpio, detectarCategoria(limpio))
    setTexto('')
    setCargando(true)

    // 3) Efecto "IA trabajando": mensaje temporal mientras se prepara la respuesta.
    const idBot = idUnico()
    agregarMensaje({
      id: idBot,
      emisor: 'bot',
      texto: usarIAReal() ? 'IA InkaShop está analizando tu consulta' : 'Analizando tu consulta',
      pensando: true,
    })
    const tarea = setTimeout(
      () => actualizarMensaje(idBot, { texto: 'Buscando productos relacionados' }),
      700,
    )
    const inicio = Date.now()

    // 4) Contexto para el asistente (historial reciente + carrito).
    const historial: MensajeHistorial[] = mensajes
      .filter((m) => !m.pensando)
      .slice(-10)
      .map((m) => ({ rol: m.emisor, texto: m.texto }))
    const contexto = {
      productos,
      categoriasConsultadas,
      carrito: items.map((i) => ({
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio: i.producto.precio,
      })),
      totalCarrito: total,
      historial,
    }

    // 5) Pedimos la respuesta (IA real o, si falla / está apagada, modo simulado).
    const resultado = await obtenerRespuestaAsistente(limpio, contexto)

    // Aseguramos una sensación mínima de "trabajo" antes de mostrar la respuesta.
    const transcurrido = Date.now() - inicio
    if (transcurrido < 1100) await new Promise((res) => setTimeout(res, 1100 - transcurrido))
    clearTimeout(tarea)

    const recomendados = resolverProductos(resultado.productosRecomendados, productos)
    actualizarMensaje(idBot, { texto: resultado.mensaje, productos: recomendados, pensando: false })
    setCargando(false)

    // Si se intentó la IA real y falló, avisamos de forma discreta.
    if (resultado.falloIA) {
      toast.info('No fue posible comunicarse con el servicio de IA. Se utilizó el modo local.')
    }
  }

  // ===== Asistente de GESTIÓN del vendedor (flujo guiado paso a paso) =====

  // Agrega un mensaje del bot, opcionalmente con botones de elección o selector de foto.
  function responderVendedor(
    texto: string,
    acciones?: { label: string; valor: string; icono?: string }[],
    pedirFoto?: boolean,
  ) {
    agregarMensaje({ id: idUnico(), emisor: 'bot', texto, acciones, pedirFoto })
  }

  // Encuentra el producto elegido: por "id:N" (botón) o por nombre escrito.
  function elegirProducto(v: string): Producto | undefined {
    if (v.startsWith('id:')) return misProductos.find((p) => p.id === Number(v.slice(3)))
    const t = v.toLowerCase()
    return (
      misProductos.find((p) => p.nombre.toLowerCase() === t) ||
      misProductos.find((p) => p.nombre.toLowerCase().includes(t))
    )
  }

  // Publica el producto del borrador y muestra una tarjeta de confirmación.
  function finalizarAgregar(b: Partial<Producto>) {
    publicarProducto({
      nombre: b.nombre || 'Producto',
      marca: b.marca,
      descripcion: b.descripcion || '',
      categoria: b.categoria || 'General',
      precio: b.precio || 0,
      stock: b.stock ?? 0,
      idVendedor: usuarioActual!.idUsuario,
      imagen: b.imagen,
    })
    const muestra: Producto = {
      id: -1,
      nombre: b.nombre || 'Producto',
      marca: b.marca,
      descripcion: b.descripcion || '',
      categoria: b.categoria || 'General',
      precio: b.precio || 0,
      stock: b.stock ?? 0,
      estado: (b.stock ?? 0) > 0 ? 'disponible' : 'agotado',
      imagen: b.imagen || '📦',
      idVendedor: usuarioActual!.idUsuario,
    }
    setFlujo(FLUJO_INICIAL)
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `¡Listo! Publiqué "${muestra.nombre}" en ${muestra.categoria}, a S/ ${muestra.precio.toFixed(
        2,
      )} con ${muestra.stock} en stock. ¿Algo más?`,
      productos: [muestra],
      acciones: MENU_VENDEDOR,
    })
  }

  // Máquina de pasos: según el estado actual (flujo), procesa la entrada y avanza.
  function procesarVendedor(valor: string) {
    const v = valor.trim()
    const t = v.toLowerCase()
    const f = flujo

    if (t === 'cancelar' || t === 'salir') {
      setFlujo(FLUJO_INICIAL)
      return responderVendedor('Operación cancelada. ¿Qué deseas hacer?', MENU_VENDEDOR)
    }

    // --- Sin flujo activo: detectamos la intención ---
    if (f.modo === 'inactivo') {
      if (/agregar|publicar|nuevo|crear/.test(t)) {
        setFlujo({ modo: 'agregar', paso: 'nombre', borrador: {} })
        return responderVendedor('Publiquemos un producto. ¿Cuál es el nombre?')
      }
      if (/modificar|editar|cambiar|actualizar/.test(t)) {
        if (misProductos.length === 0)
          return responderVendedor('Aún no tienes productos. Escribe "agregar" para publicar el primero.')
        setFlujo({ modo: 'modificar', paso: 'elegir', borrador: {} })
        return responderVendedor(
          '¿Cuál producto quieres modificar?',
          misProductos.map((p) => ({ label: p.nombre, valor: 'id:' + p.id })),
        )
      }
      if (/eliminar|borrar|quitar/.test(t)) {
        if (misProductos.length === 0)
          return responderVendedor('No tienes productos para eliminar.')
        setFlujo({ modo: 'eliminar', paso: 'elegir', borrador: {} })
        return responderVendedor(
          '¿Cuál producto quieres eliminar?',
          misProductos.map((p) => ({ label: p.nombre, valor: 'id:' + p.id })),
        )
      }
      if (/mis productos|ver|lista/.test(t)) {
        if (misProductos.length === 0)
          return responderVendedor('Todavía no has publicado productos. Escribe "agregar" para empezar.')
        return agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: `Tienes ${misProductos.length} producto(s):`,
          productos: misProductos.slice(0, 6),
          acciones: MENU_VENDEDOR,
        })
      }
      return responderVendedor('Soy tu asistente de gestión. ¿Qué deseas hacer?', MENU_VENDEDOR)
    }

    // --- Flujo AGREGAR ---
    if (f.modo === 'agregar') {
      const b: Partial<Producto> = { ...f.borrador }
      if (f.paso === 'nombre') {
        b.nombre = v
        setFlujo({ ...f, paso: 'marca', borrador: b })
        return responderVendedor(`Anotado: "${v}". ¿Cuál es la marca?`, [
          { label: 'Omitir', valor: 'omitir' },
        ])
      }
      if (f.paso === 'marca') {
        if (t !== 'omitir') b.marca = v
        setFlujo({ ...f, paso: 'descripcion', borrador: b })
        return responderVendedor('¿Una breve descripción?', [{ label: 'Omitir', valor: 'omitir' }])
      }
      if (f.paso === 'descripcion') {
        if (t !== 'omitir') b.descripcion = v
        setFlujo({ ...f, paso: 'categoria', borrador: b })
        return responderVendedor(
          '¿En qué categoría va?',
          [...new Set(productos.map((p) => p.categoria))].map((c) => ({ label: c, valor: c })),
        )
      }
      if (f.paso === 'categoria') {
        b.categoria = v
        setFlujo({ ...f, paso: 'precio', borrador: b })
        return responderVendedor('¿Cuál es el precio en soles? (ej. 199.90)')
      }
      if (f.paso === 'precio') {
        const n = Number(v.replace(',', '.'))
        if (isNaN(n) || n <= 0)
          return responderVendedor('El precio debe ser un número mayor a 0. Inténtalo de nuevo (ej. 150).')
        b.precio = n
        setFlujo({ ...f, paso: 'stock', borrador: b })
        return responderVendedor('¿Cuánto stock disponible? (cantidad entera)')
      }
      if (f.paso === 'stock') {
        const n = Number(v)
        if (isNaN(n) || n < 0 || !Number.isInteger(n))
          return responderVendedor('El stock debe ser un entero ≥ 0. Inténtalo de nuevo (ej. 10).')
        b.stock = n
        setFlujo({ ...f, paso: 'foto', borrador: b })
        return responderVendedor(
          '¡Casi listo! ¿Quieres agregar una foto? Súbela o pulsa "Omitir".',
          [{ label: 'Omitir foto', valor: 'omitir' }],
          true,
        )
      }
      if (f.paso === 'foto') {
        return finalizarAgregar(b) // se llega aquí al "Omitir"; la foto subida va por subirFotoVendedor
      }
    }

    // --- Flujo MODIFICAR ---
    if (f.modo === 'modificar') {
      if (f.paso === 'elegir') {
        const prod = elegirProducto(v)
        if (!prod)
          return responderVendedor(
            'No reconozco ese producto. Elige uno de la lista:',
            misProductos.map((p) => ({ label: p.nombre, valor: 'id:' + p.id })),
          )
        setFlujo({ ...f, paso: 'campo', prodId: prod.id })
        return responderVendedor(`Vas a modificar "${prod.nombre}". ¿Qué quieres cambiar?`, [
          { label: 'Precio', valor: 'precio' },
          { label: 'Stock', valor: 'stock' },
          { label: 'Nombre', valor: 'nombre' },
          { label: 'Marca', valor: 'marca' },
          { label: 'Descripción', valor: 'descripcion' },
          { label: 'Categoría', valor: 'categoria' },
          { label: 'Foto', valor: 'foto' },
        ])
      }
      const prod = productos.find((p) => p.id === f.prodId)
      if (!prod) {
        setFlujo(FLUJO_INICIAL)
        return responderVendedor('No encontré el producto. Empecemos de nuevo.', MENU_VENDEDOR)
      }
      if (f.paso === 'campo') {
        if (t === 'foto') {
          setFlujo({ ...f, paso: 'valor', campo: 'imagen' })
          return responderVendedor(`Sube la nueva foto de "${prod.nombre}".`, undefined, true)
        }
        if (!['precio', 'stock', 'nombre', 'marca', 'descripcion', 'categoria'].includes(t))
          return responderVendedor('Elige un campo de la lista, por favor.')
        const actual =
          t === 'precio'
            ? `S/ ${prod.precio.toFixed(2)}`
            : t === 'stock'
            ? prod.stock
            : t === 'nombre'
            ? prod.nombre
            : t === 'marca'
            ? prod.marca || '(sin marca)'
            : t === 'descripcion'
            ? prod.descripcion || '(sin descripción)'
            : prod.categoria
        setFlujo({ ...f, paso: 'valor', campo: t })
        return responderVendedor(`Valor actual de ${t}: ${actual}. Escribe el nuevo valor.`)
      }
      if (f.paso === 'valor') {
        const campo = f.campo || ''
        const cambios: Partial<Producto> = {}
        if (campo === 'precio') {
          const n = Number(v.replace(',', '.'))
          if (isNaN(n) || n <= 0) return responderVendedor('El precio debe ser un número mayor a 0.')
          cambios.precio = n
        } else if (campo === 'stock') {
          const n = Number(v)
          if (isNaN(n) || n < 0 || !Number.isInteger(n))
            return responderVendedor('El stock debe ser un entero ≥ 0.')
          cambios.stock = n
        } else if (campo === 'nombre') cambios.nombre = v
        else if (campo === 'marca') cambios.marca = v
        else if (campo === 'descripcion') cambios.descripcion = v
        else if (campo === 'categoria') cambios.categoria = v
        else return responderVendedor('No sé qué campo cambiar. Empecemos de nuevo.', MENU_VENDEDOR)

        editarProducto(prod.id, cambios)
        setFlujo(FLUJO_INICIAL)
        const actualizado: Producto = { ...prod, ...cambios }
        if (cambios.stock !== undefined)
          actualizado.estado = cambios.stock > 0 ? 'disponible' : 'agotado'
        return agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: `Actualicé "${prod.nombre}".`,
          productos: [actualizado],
          acciones: MENU_VENDEDOR,
        })
      }
    }

    // --- Flujo ELIMINAR ---
    if (f.modo === 'eliminar') {
      if (f.paso === 'elegir') {
        const prod = elegirProducto(v)
        if (!prod)
          return responderVendedor(
            'No reconozco ese producto. Elige uno de la lista:',
            misProductos.map((p) => ({ label: p.nombre, valor: 'id:' + p.id })),
          )
        setFlujo({ ...f, paso: 'confirmar', prodId: prod.id })
        return responderVendedor(
          `¿Seguro que quieres eliminar "${prod.nombre}"? Esta acción no se puede deshacer.`,
          [
            { label: 'Sí, eliminar', valor: 'confirmar', icono: 'eliminar' },
            { label: 'Cancelar', valor: 'cancelar' },
          ],
        )
      }
      if (f.paso === 'confirmar') {
        const prod = productos.find((p) => p.id === f.prodId)
        setFlujo(FLUJO_INICIAL)
        if (!prod) return responderVendedor('No encontré el producto.', MENU_VENDEDOR)
        // Solo elimina si confirma; cualquier otra cosa lo deja como estaba.
        if (t === 'confirmar' || t === 'si' || t === 'sí' || t.includes('eliminar')) {
          eliminarProducto(prod.id)
          return responderVendedor(
            `Eliminé "${prod.nombre}" de tu catálogo. ¿Algo más?`,
            MENU_VENDEDOR,
          )
        }
        return responderVendedor('Listo, no eliminé nada. ¿Qué deseas hacer?', MENU_VENDEDOR)
      }
    }
  }

  // Envía un texto o una elección (botón) del vendedor al flujo guiado.
  function enviarVendedor(textoMostrado: string, valor?: string) {
    const mostrado = textoMostrado.trim()
    if (mostrado === '') return
    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: mostrado })
    setTexto('')
    procesarVendedor(valor ?? textoMostrado)
  }

  // El vendedor sube una foto dentro del flujo (al agregar o al modificar).
  async function subirFotoVendedor(file: File) {
    let dataURL = ''
    try {
      dataURL = await comprimirImagen(file)
    } catch {
      return responderVendedor('No pude procesar la imagen, intenta con otra.')
    }
    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: 'Foto subida' })
    const f = flujo
    if (f.modo === 'agregar' && f.paso === 'foto') {
      finalizarAgregar({ ...f.borrador, imagen: dataURL })
    } else if (f.modo === 'modificar' && f.paso === 'valor' && f.campo === 'imagen') {
      const prod = productos.find((p) => p.id === f.prodId)
      if (prod) {
        editarProducto(prod.id, { imagen: dataURL })
        setFlujo(FLUJO_INICIAL)
        agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: `Actualicé la foto de "${prod.nombre}".`,
          productos: [{ ...prod, imagen: dataURL }],
          acciones: MENU_VENDEDOR,
        })
      }
    }
  }

  // Mensaje simple del asistente (avisos de la búsqueda por foto).
  function responderFoto(texto: string) {
    agregarMensaje({ id: idUnico(), emisor: 'bot', texto })
  }

  // BÚSQUEDA POR FOTO: la IA identifica el producto y muestra las opciones (marcas/modelos).
  async function buscarConFoto(file: File) {
    if (cargando) return
    let dataURL = ''
    try {
      dataURL = await comprimirImagen(file)
    } catch {
      return responderFoto('No pude procesar la imagen, intenta con otra.')
    }

    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: 'Foto de un producto' })
    setCargando(true)
    const idBot = idUnico()
    agregarMensaje({
      id: idBot,
      emisor: 'bot',
      texto: 'IA InkaShop está identificando el producto',
      pensando: true,
    })
    const inicio = Date.now()

    let r
    try {
      r = await buscarPorFoto(dataURL, productos)
    } catch {
      r = { termino: '', etiqueta: '', productos: [], fuente: 'manual' as const, necesitaCategoria: true }
    }
    const transcurrido = Date.now() - inicio
    if (transcurrido < 900) await new Promise((res) => setTimeout(res, 900 - transcurrido))

    if (r.termino) registrarConsulta(r.termino, '')

    if (r.necesitaCategoria || r.productos.length === 0) {
      const categorias = [...new Set(productos.filter((p) => p.stock > 0).map((p) => p.categoria))]
      actualizarMensaje(idBot, {
        texto: 'No logré identificar el producto con seguridad. ¿De qué tipo es? Elige una categoría:',
        categorias,
        pensando: false,
      })
    } else {
      actualizarMensaje(idBot, {
        texto: `Identifiqué ${r.etiqueta || r.termino}. Estas son las opciones por marca y modelo:`,
        productos: r.productos,
        pensando: false,
      })
    }
    setCargando(false)
  }

  // El cliente elige la categoría cuando la foto no se pudo identificar.
  function filtrarCategoriaFoto(categoria: string) {
    agregarMensaje({ id: idUnico(), emisor: 'usuario', texto: categoria })
    const encontrados = productos.filter((p) => p.categoria === categoria && p.stock > 0)
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `Opciones de ${categoria} por marca y modelo:`,
      productos: encontrados,
    })
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (esVendedorActual) enviarVendedor(texto)
    else enviarTexto(texto)
  }

  // ---- Acciones de las tarjetas de producto dentro del chat ----
  function verDetalle(p: Producto) {
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `${p.nombre}${p.marca ? ' · ' + p.marca : ''} — ${p.categoria}\n${
        p.descripcion
      }\nPrecio: S/ ${p.precio.toFixed(2)} · Stock: ${p.stock}`,
    })
  }

  function agregar(p: Producto) {
    agregarAlCarrito(p)
    registrarConsulta(p.nombre, p.categoria)
    agregarMensaje({
      id: idUnico(),
      emisor: 'bot',
      texto: `Agregué ${p.nombre} a tu carrito. ¿Deseas algo más o pasamos a pagar?`,
    })
  }

  function compararProducto(p: Producto) {
    setComparar((prev) => {
      if (prev.find((x) => x.id === p.id)) return prev
      const nuevo = [...prev, p].slice(-3) // comparamos hasta 3
      if (nuevo.length >= 2) {
        agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: 'Aquí tienes la comparación:',
          comparacion: nuevo,
        })
      } else {
        agregarMensaje({
          id: idUnico(),
          emisor: 'bot',
          texto: `Agregué ${p.nombre} para comparar. Elige otro producto para verlos lado a lado.`,
        })
      }
      return nuevo
    })
  }

  function consultarVendedor(p: Producto) {
    // Vamos a Mensajes con el producto preseleccionado.
    navegar('/mensajes', { state: { idProducto: p.id } })
  }

  // Solo el último mensaje muestra sus botones/selector activos (evita botones viejos).
  const ultimoId = mensajes[mensajes.length - 1]?.id

  return (
    <div className="pagina">
      <header className="asistente-cabecera">
        <img
          src="/assistant-inkashop.svg"
          alt="Asistente IA de InkaShop"
          className="mascota-inkashop mascota-cabecera"
        />
        <div>
          <h1>IA InkaShop</h1>
          <p>Compra con respaldo, vende con innovación.</p>
        </div>
      </header>

      {/* Bloque institucional discreto */}
      <div className="bloque-institucional">
        <LogoUSS size="small" />
        <span>Respaldado por la Universidad Señor de Sipán</span>
      </div>

      <div className="asistente-layout">
        {/* ===== Chat principal (protagonista) ===== */}
        <div className="asistente-chat">
          <div className="asistente-mensajes">
            {mensajes.map((m) => (
              <div key={m.id} className="asistente-fila">
                <div
                  className={
                    m.emisor === 'bot'
                      ? 'burbuja bot' + (m.pensando ? ' pensando' : '')
                      : 'burbuja usuario'
                  }
                >
                  {m.texto}
                  {m.pensando && (
                    <span className="puntos-pensando">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  )}
                </div>

                {/* Productos recomendados dentro del chat */}
                {m.productos && m.productos.length > 0 && (
                  <div className="chat-recomendaciones">
                    {m.productos.map((p) => (
                      <TarjetaChat
                        key={p.id}
                        producto={p}
                        puedeComprar={puedeComprar}
                        onDetalle={() => verDetalle(p)}
                        onAgregar={() => agregar(p)}
                        onComparar={() => compararProducto(p)}
                        onConsultar={() => consultarVendedor(p)}
                      />
                    ))}
                  </div>
                )}

                {/* Tabla de comparación */}
                {m.comparacion && <TablaComparacion productos={m.comparacion} />}

                {/* Botones de elección del flujo del vendedor (solo el último mensaje) */}
                {m.acciones && m.acciones.length > 0 && m.id === ultimoId && (
                  <div className="chat-acciones">
                    {m.acciones.map((a) => (
                      <button
                        key={a.valor}
                        className="chip"
                        onClick={() => enviarVendedor(a.label, a.valor)}
                      >
                        {a.icono && <Icono nombre={a.icono} size={15} />} {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Categorías para la búsqueda por foto (solo el último mensaje) */}
                {m.categorias && m.categorias.length > 0 && m.id === ultimoId && (
                  <div className="chat-acciones">
                    {m.categorias.map((c) => (
                      <button key={c} className="chip" onClick={() => filtrarCategoriaFoto(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selector de foto dentro del chat (solo el último mensaje) */}
                {m.pedirFoto && m.id === ultimoId && (
                  <div className="chat-acciones">
                    <label className="chip chip-foto">
                      <Icono nombre="camara" size={15} /> Subir foto
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) subirFotoVendedor(file)
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {/* Botones rápidos */}
          <div className="asistente-rapidos">
            {esVendedorActual
              ? MENU_VENDEDOR.map((b) => (
                  <button
                    key={b.valor}
                    className="chip"
                    onClick={() => enviarVendedor(b.label, b.valor)}
                  >
                    <Icono nombre={b.icono} size={15} /> {b.label}
                  </button>
                ))
              : BOTONES_RAPIDOS.map((b) => (
                  <button key={b.label} className="chip" onClick={() => enviarTexto(b.query)}>
                    <Icono nombre={b.icono} size={15} /> {b.label}
                  </button>
                ))}
            {puedeComprar && (
              <label className="chip chip-foto">
                <Icono nombre="camara" size={15} /> Buscar por foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  disabled={cargando}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) buscarConFoto(file)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            )}
            {puedeComprar && (
              <button className="chip" onClick={() => navegar('/carrito')}>
                <Icono nombre="carrito" size={15} /> Ver mi carrito
                {cantidadTotal > 0 ? ` (${cantidadTotal})` : ''}
              </button>
            )}
          </div>

          {/* Entrada de texto */}
          <form className="asistente-entrada" onSubmit={enviar}>
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                esVendedorActual
                  ? 'Escribe “agregar” o “modificar”… o usa los botones'
                  : 'Escribe lo que buscas... (ej. “laptop hasta 2000”)'
              }
            />
            <button type="submit" className="btn btn-primario" disabled={cargando}>
              {cargando ? 'Enviando…' : 'Enviar'}
            </button>
          </form>
        </div>

        {/* ===== Panel lateral: consultas recientes (Pila LIFO) ===== */}
        <aside className="asistente-panel">
          <h2>
            <Icono nombre="lista" size={18} /> Consultas recientes
          </h2>
          <p className="texto-tenue">Tus últimas búsquedas aparecen primero.</p>
          {consultasRecientes.length === 0 ? (
            <p className="texto-tenue">Aún no hay consultas.</p>
          ) : (
            <ul className="lista-consultas">
              {consultasRecientes.slice(0, 8).map((c, i) => (
                <li key={i}>
                  <span>{c.termino}</span>
                  {c.categoria && <span className="chip-mini">{c.categoria}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="asistente-tip">
            <Icono nombre="tip" size={16} /> <strong>Tip:</strong> dime tu presupuesto (ej. “laptop
            hasta 2000”) y filtro por precio.
          </div>
        </aside>
      </div>
    </div>
  )
}

// Tarjeta de producto mostrada dentro del chat, con acciones del asistente.
function TarjetaChat({
  producto,
  puedeComprar,
  onDetalle,
  onAgregar,
  onComparar,
  onConsultar,
}: {
  producto: Producto
  puedeComprar: boolean
  onDetalle: () => void
  onAgregar: () => void
  onComparar: () => void
  onConsultar: () => void
}) {
  const agotado = producto.stock <= 0
  const bajoStock = producto.stock > 0 && producto.stock <= 5
  return (
    <div className="tarjeta-chat">
      <div className="tarjeta-chat-top">
        <span className="tarjeta-chat-img">
          <ImagenProducto imagen={producto.imagen} nombre={producto.nombre} />
        </span>
        <div>
          <div className="tarjeta-chat-nombre">{producto.nombre}</div>
          <div className="tarjeta-chat-cat">
            {producto.categoria}
            {producto.marca ? ' · ' + producto.marca : ''}
          </div>
        </div>
      </div>
      <div className="tarjeta-chat-precio">
        S/ {producto.precio.toFixed(2)}{' '}
        <span
          className={
            agotado ? 'tarjeta-stock agotado' : bajoStock ? 'tarjeta-stock bajo' : 'tarjeta-stock'
          }
        >
          {agotado ? 'Agotado' : `Stock: ${producto.stock}`}
        </span>
      </div>
      <div className="tarjeta-chat-acciones">
        <button className="btn-mini" onClick={onDetalle}>
          Ver detalle
        </button>
        {puedeComprar && (
          <button className="btn-mini primario" onClick={onAgregar} disabled={agotado}>
            Agregar
          </button>
        )}
        <button className="btn-mini" onClick={onComparar}>
          Comparar
        </button>
        {puedeComprar && (
          <button className="btn-mini" onClick={onConsultar}>
            Consultar vendedor
          </button>
        )}
      </div>
    </div>
  )
}

// Tabla comparativa de productos.
function TablaComparacion({ productos }: { productos: Producto[] }) {
  return (
    <div className="chat-comparacion tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>S/ {p.precio.toFixed(2)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
