import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion, DatosRegistro } from '../contexto/SesionContext'
import { Rol } from '../core/modelos/Usuario'
import { LogoUSS } from '../componentes/LogoUSS'
import { InkaAnimatedBackground } from '../componentes/InkaAnimatedBackground'
import { Icono } from '../componentes/Icono'
import { SelectorPais } from '../componentes/SelectorPais'
import { CampoDocumento } from '../componentes/CampoDocumento'
import { Pais, getPais } from '../config/paises'
import { getDocumento, getDocumentosPorPais } from '../config/identityDocuments'
import {
  validarRegistroCompleto,
  evaluarContrasena,
  filtrarSoloLetras,
  filtrarSoloNumeros,
} from '../utils/validacionesRegistro'
import { validarUbicacion } from '../utils/validarUbicacion'
import { DynamicAddressFields } from '../componentes/DynamicAddressFields'
import { getConfigDireccion, Ubicacion, UBICACION_VACIA } from '../config/addressCountryConfig'

// Valores iniciales: Perú y su primer documento (DNI).
const PAIS_INICIAL = getPais('PE')!
const DOC_INICIAL = getDocumentosPorPais('PE')[0]

const FORM_INICIAL: DatosRegistro = {
  nombre: '',
  apellido: '',
  countryCode: PAIS_INICIAL.countryCode,
  countryName: PAIS_INICIAL.countryName,
  callingCode: PAIS_INICIAL.callingCode,
  telefono: '',
  tipoDocumento: DOC_INICIAL.documentCode,
  documentoNumero: '',
  documentoComplemento: '',
  prefijoDocumento: DOC_INICIAL.prefixes?.[0] ?? '',
  correo: '',
  contrasena: '',
  confirmar: '',
  ubicacion: UBICACION_VACIA,
  rol: 'comprador',
}

// Etiqueta visible según la fuerza de la contraseña.
const ETIQUETA_FUERZA: Record<string, string> = {
  vacia: '',
  debil: 'Contraseña débil',
  media: 'Contraseña aceptable',
  fuerte: 'Contraseña fuerte',
}

// Selector CSS de cada campo (para llevar el foco al primero con error).
const SELECTOR_CAMPO: Record<string, string> = {
  nombre: '#reg-nombre',
  apellido: '#reg-apellido',
  telefono: '#reg-telefono',
  documentoNumero: '.doc-numero',
  correo: '#reg-correo',
  contrasena: '#reg-contrasena',
  confirmar: '#reg-confirmar',
}

// Pantalla de registro de nuevos usuarios.
export function Registro() {
  const { registrar, usuarios } = useSesion()
  const navegar = useNavigate()

  const [form, setForm] = useState<DatosRegistro>(FORM_INICIAL)
  // Campos que el usuario ya tocó (para no mostrar errores antes de tiempo).
  const [tocado, setTocado] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  // Validación viva (se recalcula en cada render); solo se MUESTRA en campos tocados.
  const correos = usuarios.map((u) => u.correo)
  const { errores } = validarRegistroCompleto(form, correos)
  const { errores: erroresUbic } = validarUbicacion(form.countryCode, form.ubicacion)
  const configDir = getConfigDireccion(form.countryCode)
  const fuerza = evaluarContrasena(form.contrasena)

  // Cambia un campo del formulario por su nombre.
  function cambiar(campo: keyof DatosRegistro, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }
  // Marca un campo como tocado (al perder el foco).
  function marcar(campo: string) {
    setTocado((prev) => ({ ...prev, [campo]: true }))
  }
  // Error a mostrar para un campo (solo si ya fue tocado).
  function errorDe(campo: keyof typeof errores): string | undefined {
    return tocado[campo] ? errores[campo] : undefined
  }

  // ¿La ubicación ya tiene datos? (para confirmar antes de borrarla).
  function ubicacionConDatos(): boolean {
    const u = form.ubicacion
    return Boolean(
      u.nivel1.nombre || u.nivel2.nombre || u.nivel3?.nombre || u.codigoPostal || u.direccion,
    )
  }

  // Al cambiar el país: actualizamos país y documento, limpiamos teléfono y la
  // dirección (con confirmación si ya había datos territoriales).
  function cambiarPais(pais: Pais) {
    if (pais.countryCode === form.countryCode) return
    if (ubicacionConDatos()) {
      const seguir = window.confirm(
        'Al cambiar de país se borrarán los datos de ubicación ingresados. ¿Deseas continuar?',
      )
      if (!seguir) return // si cancela, se mantiene el país anterior
    }
    const primerDoc = getDocumentosPorPais(pais.countryCode)[0]
    setForm((prev) => ({
      ...prev,
      countryCode: pais.countryCode,
      countryName: pais.countryName,
      callingCode: pais.callingCode,
      telefono: '',
      tipoDocumento: primerDoc.documentCode,
      documentoNumero: '',
      documentoComplemento: '',
      prefijoDocumento: primerDoc.prefixes?.[0] ?? '',
      ubicacion: UBICACION_VACIA,
    }))
    setTocado((prev) => ({ ...prev, telefono: false, documentoNumero: false }))
  }

  // Actualiza la ubicación (la maneja el componente DynamicAddressFields).
  function cambiarUbicacion(ubic: Ubicacion) {
    setForm((prev) => ({ ...prev, ubicacion: ubic }))
  }

  // Al cambiar el tipo de documento: limpiamos el número (cambia el formato).
  function cambiarTipoDocumento(documentCode: string) {
    const cfg = getDocumento(form.countryCode, documentCode)
    setForm((prev) => ({
      ...prev,
      tipoDocumento: documentCode,
      documentoNumero: '',
      documentoComplemento: '',
      prefijoDocumento: cfg.prefixes?.[0] ?? '',
    }))
    setTocado((prev) => ({ ...prev, documentoNumero: false }))
  }

  // Lleva el foco al primer campo con error (datos personales o dirección).
  function enfocar(campo: string) {
    const el = document.querySelector(SELECTOR_CAMPO[campo]) as HTMLElement | null
    el?.focus()
  }
  function enfocarDireccion(campo: string) {
    const el = document.querySelector('#addr-' + campo) as HTMLElement | null
    el?.focus()
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    // Marcamos todo como tocado (datos personales + niveles de dirección del país).
    const keysDir = [...configDir.levels.map((l) => l.key), 'codigoPostal', 'direccion']
    setTocado({
      nombre: true,
      apellido: true,
      telefono: true,
      documentoNumero: true,
      correo: true,
      contrasena: true,
      confirmar: true,
      ...Object.fromEntries(keysDir.map((k) => [k, true])),
    })

    const personales = validarRegistroCompleto(form, correos)
    const ubicacion = validarUbicacion(form.countryCode, form.ubicacion)
    if (!personales.ok || !ubicacion.ok) {
      const primerPersonal = personales.orden.find((c) => personales.errores[c])
      if (primerPersonal) {
        setError(personales.errores[primerPersonal]!)
        enfocar(primerPersonal)
        return
      }
      const primerDir = keysDir.find((k) => ubicacion.errores[k])
      if (primerDir) {
        setError(ubicacion.errores[primerDir])
        enfocarDireccion(primerDir)
        return
      }
      setError('Revisa los campos marcados.')
      return
    }

    const resultado = await registrar(form)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navegar('/') // cuenta creada: vamos al catálogo
  }

  const confirmarLlena = form.confirmar.length > 0
  const coinciden = form.confirmar === form.contrasena

  return (
    <div className="auth-contenedor inka-auth-bg">
      <InkaAnimatedBackground />
      <div className="auth-tarjeta ancha">
        <div className="auth-logo">
          <LogoUSS size="medium" />
        </div>
        <h1 className="auth-titulo">Crear cuenta · IA InkaShop</h1>
        <p className="auth-subtitulo">Compra con respaldo, vende con innovación.</p>

        <form onSubmit={enviar} className="formulario" noValidate>
          <div className="form-grid">
            <CampoTexto
              id="reg-nombre"
              etiqueta="Nombre *"
              valor={form.nombre}
              error={errorDe('nombre')}
              onChange={(v) => cambiar('nombre', filtrarSoloLetras(v))}
              onBlur={() => marcar('nombre')}
            />
            <CampoTexto
              id="reg-apellido"
              etiqueta="Apellido *"
              valor={form.apellido}
              error={errorDe('apellido')}
              onChange={(v) => cambiar('apellido', filtrarSoloLetras(v))}
              onBlur={() => marcar('apellido')}
            />

            {/* Teléfono: país (fuente de verdad) + número nacional */}
            <label className="campo span-2">
              <span>Teléfono *</span>
              <div className="tel-grupo">
                <SelectorPais value={form.countryCode} onChange={cambiarPais} describedBy="tel-ayuda" />
                <span className="tel-prefijo">{form.callingCode}</span>
                <input
                  id="reg-telefono"
                  type="text"
                  inputMode="numeric"
                  value={form.telefono}
                  placeholder="987654321"
                  autoComplete="off"
                  aria-invalid={Boolean(errorDe('telefono'))}
                  aria-describedby={errorDe('telefono') ? 'tel-error' : 'tel-ayuda'}
                  onChange={(e) => cambiar('telefono', filtrarSoloNumeros(e.target.value))}
                  onBlur={() => marcar('telefono')}
                />
              </div>
              <span id="tel-ayuda" className="form-ayuda">
                Elige tu país y escribe tu número (lo usaremos para recuperar tu cuenta por SMS).
              </span>
              {errorDe('telefono') && (
                <p id="tel-error" className="form-error" role="alert">
                  {errorDe('telefono')}
                </p>
              )}
            </label>

            {/* Documento de identidad adaptado al país */}
            <div className="span-2">
              <CampoDocumento
                countryCode={form.countryCode}
                documentCode={form.tipoDocumento}
                value={form.documentoNumero}
                complemento={form.documentoComplemento}
                prefijo={form.prefijoDocumento}
                error={errores.documentoNumero}
                tocado={tocado.documentoNumero}
                onChangeTipo={cambiarTipoDocumento}
                onChangeValor={(v) => cambiar('documentoNumero', v)}
                onChangeComplemento={(v) => cambiar('documentoComplemento', v)}
                onChangePrefijo={(v) => cambiar('prefijoDocumento', v)}
                onBlur={() => marcar('documentoNumero')}
              />
            </div>

            <CampoTexto
              id="reg-correo"
              etiqueta="Correo *"
              valor={form.correo}
              tipo="email"
              inputMode="email"
              placeholder="tucorreo@ejemplo.com"
              error={errorDe('correo')}
              onChange={(v) => cambiar('correo', v)}
              onBlur={() => marcar('correo')}
            />

            <label className="campo">
              <span>Rol *</span>
              <select value={form.rol} onChange={(e) => cambiar('rol', e.target.value as Rol)}>
                <option value="comprador">Comprador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </label>

            {/* Contraseña + medidor de fuerza */}
            <label className="campo">
              <span>Contraseña *</span>
              <input
                id="reg-contrasena"
                type="password"
                value={form.contrasena}
                aria-invalid={Boolean(errorDe('contrasena'))}
                aria-describedby="pass-ayuda"
                onChange={(e) => cambiar('contrasena', e.target.value)}
                onBlur={() => marcar('contrasena')}
              />
              {form.contrasena.length > 0 && (
                <>
                  <div className="fuerza" aria-hidden="true">
                    <div className={'fuerza-barra nivel-' + fuerza.nivel} />
                  </div>
                  <span id="pass-ayuda" className="form-ayuda">
                    {ETIQUETA_FUERZA[fuerza.nivel]}
                    {fuerza.nivel !== 'fuerte' && fuerza.sugerencias[0]
                      ? ` · ${fuerza.sugerencias[0]}`
                      : ''}
                  </span>
                </>
              )}
              {errorDe('contrasena') && (
                <p className="form-error" role="alert">
                  {errorDe('contrasena')}
                </p>
              )}
            </label>

            {/* Confirmar contraseña + indicador de coincidencia */}
            <label className="campo">
              <span>Confirmar contraseña *</span>
              <input
                id="reg-confirmar"
                type="password"
                value={form.confirmar}
                aria-invalid={confirmarLlena && !coinciden}
                onChange={(e) => cambiar('confirmar', e.target.value)}
                onBlur={() => marcar('confirmar')}
              />
              {confirmarLlena && (
                <span className={coinciden ? 'coincide' : 'no-coincide'}>
                  <Icono nombre={coinciden ? 'check' : 'alerta'} size={14} />
                  {coinciden ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </span>
              )}
            </label>

            {/* Dirección territorial dinámica según el país elegido en el teléfono */}
            <div className="span-2">
              <DynamicAddressFields
                countryCode={form.countryCode}
                value={form.ubicacion}
                errores={erroresUbic}
                tocado={tocado}
                onChange={cambiarUbicacion}
                onBlur={marcar}
              />
            </div>
          </div>

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" className="btn btn-primario btn-bloque">
            Registrarme
          </button>
        </form>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

// Campo de texto reutilizable, con etiqueta, error por campo y accesibilidad.
function CampoTexto({
  id,
  etiqueta,
  valor,
  onChange,
  onBlur,
  error,
  tipo = 'text',
  inputMode,
  placeholder,
}: {
  id: string
  etiqueta: string
  valor: string
  onChange: (valor: string) => void
  onBlur: () => void
  error?: string
  tipo?: string
  inputMode?: 'text' | 'numeric' | 'email'
  placeholder?: string
}) {
  const mostrarError = Boolean(error)
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <input
        id={id}
        type={tipo}
        inputMode={inputMode}
        value={valor}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={mostrarError}
        aria-describedby={mostrarError ? id + '-error' : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {mostrarError && (
        <p id={id + '-error'} className="form-error" role="alert">
          {error}
        </p>
      )}
    </label>
  )
}
