// Capa de datos de MENSAJES en Supabase (modo "real").
// Los usuarios se identifican por idUsuario (uuid). El RLS deja ver/enviar solo
// los mensajes en los que participa el usuario. Los nombres van denormalizados
// para mostrarlos sin leer el perfil del otro.
import { supabase } from '../datos/supabase'
import { Mensaje } from '../modelos/Mensaje'

interface FilaMensaje {
  id: number | string
  producto_id: number | string | null
  nombre_producto: string | null
  de_usuario: string | null
  para_usuario: string | null
  de_nombre: string | null
  para_nombre: string | null
  tipo: string | null
  texto: string | null
  leido: boolean | null
  creado_en: string | null
}

function mapMensaje(f: FilaMensaje): Mensaje {
  return {
    idMensaje: String(f.id),
    remitente: f.de_usuario ?? '',
    destinatario: f.para_usuario ?? '',
    remitenteNombre: f.de_nombre ?? undefined,
    destinatarioNombre: f.para_nombre ?? undefined,
    idProducto: Number(f.producto_id ?? 0),
    nombreProducto: f.nombre_producto ?? '',
    contenido: f.texto ?? '',
    fechaHora: f.creado_en ? new Date(f.creado_en).toLocaleString() : '',
    leido: Boolean(f.leido),
    tipoMensaje: (f.tipo as 'consulta' | 'respuesta') ?? 'consulta',
  }
}

// Lista los mensajes accesibles (el RLS filtra: solo en los que participa el usuario).
export async function listarMensajesSupabase(): Promise<Mensaje[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .order('creado_en', { ascending: true })
  if (error || !data) return []
  return (data as FilaMensaje[]).map(mapMensaje)
}

// Envía un mensaje y devuelve el creado (con su id real).
export async function enviarMensajeSupabase(m: {
  remitente: string
  destinatario: string
  remitenteNombre: string
  destinatarioNombre: string
  idProducto: number
  nombreProducto: string
  contenido: string
  tipoMensaje: 'consulta' | 'respuesta'
}): Promise<Mensaje | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('mensajes')
    .insert({
      producto_id: m.idProducto,
      nombre_producto: m.nombreProducto,
      de_usuario: m.remitente,
      para_usuario: m.destinatario,
      de_nombre: m.remitenteNombre,
      para_nombre: m.destinatarioNombre,
      tipo: m.tipoMensaje,
      texto: m.contenido,
      leido: false,
    })
    .select()
    .single()
  if (error || !data) return null
  return mapMensaje(data as FilaMensaje)
}

// Marca un mensaje como leído.
export async function marcarLeidoSupabase(idMensaje: string): Promise<void> {
  if (!supabase) return
  await supabase.from('mensajes').update({ leido: true }).eq('id', Number(idMensaje))
}
