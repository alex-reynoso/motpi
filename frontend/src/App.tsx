
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'

import './App.css'
import Login, { type Usuario } from './auth/Login'

// -------------------- API --------------------

const API_BASE = 'http://localhost:3000/api/v1'
const API_INVENTARIO = `${API_BASE}/inventario/recursos`
const API_SOLICITUDES = `${API_BASE}/prestamos/solicitudes`
const API_MIS_SOLICITUDES = `${API_BASE}/prestamos/mis-solicitudes`

// -------------------- TIPOS --------------------

const temas = {
  motpi: {
    nombre: 'Tema MOTPI',
    primary: '#09264d',
    secondary: '#f58220',
    accent: '#e5a04b',
  },
  verde: {
    nombre: 'Verde institucional',
    primary: '#123b32',
    secondary: '#d4a72c',
    accent: '#e5c76b',
  },
  azul: {
    nombre: 'Azul institucional',
    primary: '#173b70',
    secondary: '#26a6a1',
    accent: '#75d1c8',
  },
} as const

type Tema = keyof typeof temas

interface Recurso {
  id_recurso: string
  nombre: string
  tipo: string
  numero_serie: string | null
  estado: string
  descripcion: string | null
  laboratorio?: {
    id_laboratorio: number
    nombre: string
    ubicacion: string
  } | null
}

interface EquipoSolicitud {
  id_recurso: string
  nombre: string
  estado: string
}

interface DecisionSolicitud {
  resultado: string
  justificacion: string
  fecha_evaluacion: string
}

interface PrestamoSolicitud {
  id_prestamo: string
  estado: string
  fecha_entrega: string
  fecha_devolucion_prevista: string
  fecha_devolucion_real: string | null
}

interface Solicitud {
  id_solicitud: string
  fecha_solicitud: string
  estado: string
  solicitante: {
    nombre: string
    matricula: string | null
    correo: string
  }
  equipos: EquipoSolicitud[]
  decision: DecisionSolicitud | null
  prestamo: PrestamoSolicitud | null
}

interface RespuestaInventario {
  success: boolean
  recursos: Recurso[]
}

interface RespuestaSolicitudes {
  success: boolean
  total: number
  solicitudes: Solicitud[]
}

// -------------------- UTILIDADES --------------------

const formatearFecha = (fecha: string | null | undefined) => {
  if (!fecha) return 'No disponible'

  const fechaValida = new Date(fecha)

  if (Number.isNaN(fechaValida.getTime())) {
    return 'Fecha no válida'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(fechaValida)
}

const normalizarEstado = (estado: string) =>
  estado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, '-')

const obtenerClaseEstado = (estado: string) => {
  const valor = normalizarEstado(estado)

  if (valor.includes('autoriz') || valor.includes('permitido')) {
    return 'autorizada'
  }

  if (valor.includes('deneg') || valor.includes('rechaz')) {
    return 'denegada'
  }

  if (valor.includes('pendiente')) {
    return 'pendiente'
  }

  if (valor.includes('devuelto')) {
    return 'devuelto'
  }

  if (valor.includes('activo')) {
    return 'activo'
  }

  return 'pendiente'
}

async function consultarAPI<T>(
  url: string,
  token: string,
): Promise<T> {
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error('Sesión expirada. Inicia sesión nuevamente.')
    }

    if (respuesta.status === 403) {
      throw new Error('No tienes permisos para consultar esta información.')
    }

    throw new Error(
      `Error del servidor (${respuesta.status}). Verifica que el backend esté activo.`,
    )
  }

  return respuesta.json() as Promise<T>
}

// -------------------- COMPONENTE --------------------

function App() {
  // Autenticación.
  const [tokenSesion, setTokenSesion] = useState<string | null>(null)
  const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null)

  // Personalización institucional.
  const [temaSeleccionado, setTemaSeleccionado] =
    useState<Tema>('motpi')

  const [nombreInstitucion, setNombreInstitucion] =
    useState('Institución educativa')

  const [logoInstitucion, setLogoInstitucion] =
    useState<string | null>(null)

  const [errorLogo, setErrorLogo] = useState('')

  // Inventario.
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [cargandoInventario, setCargandoInventario] = useState(false)
  const [errorInventario, setErrorInventario] = useState('')

  // Solicitudes.
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false)
  const [errorSolicitudes, setErrorSolicitudes] = useState('')

  // -------------------- PERMISOS DE INTERFAZ --------------------

  const rol = usuarioSesion?.rol ?? ''

  const esEstudiante = rol === 'ESTUDIANTE'
  
  const esAdministrador =
    rol === 'ADMINISTRADOR_SISTEMA'

  const esAdministrativo =
    rol === 'ADMINISTRATIVO'

  const esEncargado =
    rol === 'ENCARGADO_LABORATORIO'

  const puedeConsultarSolicitudes =
    esEstudiante ||
    esAdministrador ||
    esAdministrativo ||
    esEncargado

  const puedeAdministrar =
    esAdministrador

  // -------------------- AUTENTICACIÓN --------------------

  const iniciarSesion = (
    token: string,
    usuario: Usuario,
  ) => {
    setTokenSesion(token)
    setUsuarioSesion(usuario)

    setRecursos([])
    setSolicitudes([])
    setErrorInventario('')
    setErrorSolicitudes('')
  }

  const cerrarSesion = () => {
    setTokenSesion(null)
    setUsuarioSesion(null)

    setRecursos([])
    setSolicitudes([])

    setErrorInventario('')
    setErrorSolicitudes('')

    setCargandoInventario(false)
    setCargandoSolicitudes(false)
  }

  // -------------------- CONSULTA DE INVENTARIO --------------------

  const cargarInventario = useCallback(async () => {
    if (!tokenSesion) return

    setCargandoInventario(true)
    setErrorInventario('')

    try {
      const datos = await consultarAPI<RespuestaInventario>(
        API_INVENTARIO,
        tokenSesion,
      )

      if (!datos.success || !Array.isArray(datos.recursos)) {
        throw new Error('La respuesta del inventario no es válida.')
      }

      setRecursos(datos.recursos)
    } catch (error) {
      setErrorInventario(
        error instanceof Error
          ? error.message
          : 'No fue posible consultar el inventario.',
      )
    } finally {
      setCargandoInventario(false)
    }
  }, [tokenSesion])

  // -------------------- CONSULTA DE SOLICITUDES --------------------

  const cargarSolicitudes = useCallback(async () => {
    if (!tokenSesion || !usuarioSesion) return

    if (!puedeConsultarSolicitudes) {
      setSolicitudes([])
      setErrorSolicitudes('')
      setCargandoSolicitudes(false)
      return
    }

    setCargandoSolicitudes(true)
    setErrorSolicitudes('')

    try {
      const endpoint = esEstudiante
        ? API_MIS_SOLICITUDES
        : API_SOLICITUDES

      const datos = await consultarAPI<RespuestaSolicitudes>(
        endpoint,
        tokenSesion,
      )

      if (!datos.success || !Array.isArray(datos.solicitudes)) {
        throw new Error('La respuesta de solicitudes no es válida.')
      }

      setSolicitudes(datos.solicitudes)
    } catch (error) {
      setErrorSolicitudes(
        error instanceof Error
          ? error.message
          : 'No fue posible consultar las solicitudes.',
      )
    } finally {
      setCargandoSolicitudes(false)
    }
  }, [
    tokenSesion,
    usuarioSesion,
    puedeConsultarSolicitudes,
    esEstudiante,
  ])

  // -------------------- CARGA INICIAL --------------------

  useEffect(() => {
    if (!tokenSesion || !usuarioSesion) return

    void cargarInventario()
    void cargarSolicitudes()
  }, [
    tokenSesion,
    usuarioSesion,
    cargarInventario,
    cargarSolicitudes,
  ])

  // Actualizar información.
  const actualizarDashboard = () => {
    void Promise.all([
      cargarInventario(),
      cargarSolicitudes(),
    ])
  }

  // -------------------- ESTADÍSTICAS --------------------

  const estadisticas = useMemo(() => {
    const pendientes = solicitudes.filter(
      (solicitud) =>
        normalizarEstado(solicitud.estado) === 'pendiente',
    ).length

    const autorizadas = solicitudes.filter(
      (solicitud) =>
        normalizarEstado(solicitud.estado) === 'autorizada',
    ).length

    const denegadas = solicitudes.filter(
      (solicitud) =>
        normalizarEstado(solicitud.estado) === 'denegada',
    ).length

    const disponibles = recursos.filter(
      (recurso) => recurso.estado === 'DISPONIBLE',
    ).length

    return {
      totalSolicitudes: solicitudes.length,
      pendientes,
      autorizadas,
      denegadas,
      totalRecursos: recursos.length,
      disponibles,
    }
  }, [solicitudes, recursos])

  // -------------------- PERSONALIZACIÓN --------------------

  const tema = temas[temaSeleccionado]

  const estilosInstitucionales = {
    '--institution-primary': tema.primary,
    '--institution-secondary': tema.secondary,
    '--institution-accent': tema.accent,
  } as CSSProperties

  // Validación del logotipo.
  const manejarLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]

    if (!archivo) return

    const formatosPermitidos = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ]

    if (!formatosPermitidos.includes(archivo.type)) {
      setErrorLogo(
        'Formato no permitido. Utiliza PNG, JPG, WEBP o SVG.',
      )
      event.target.value = ''
      return
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setErrorLogo('El logotipo no debe superar los 2 MB.')
      event.target.value = ''
      return
    }

    const lector = new FileReader()

    lector.onload = () => {
      if (typeof lector.result === 'string') {
        setLogoInstitucion(lector.result)
        setErrorLogo('')
      }
    }

    lector.onerror = () => {
      setErrorLogo('No fue posible leer el archivo.')
    }

    lector.readAsDataURL(archivo)
  }

  // -------------------- VISTA DE LOGIN --------------------

  if (!tokenSesion || !usuarioSesion) {
    return <Login onLogin={iniciarSesion} />
  }

  // Nombre completo.
  const nombreCompleto =
    `${usuarioSesion.nombre} ${usuarioSesion.apellido}`.trim()

  const inicialUsuario =
    usuarioSesion.nombre.charAt(0).toUpperCase() || 'U'

  // -------------------- DASHBOARD --------------------

  return (
    <div className="app" style={estilosInstitucionales}>
      {/* MENÚ LATERAL */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">M</div>
          <div>
            <h1>MOTPI</h1>
            <span>Motor de Políticas Institucionales</span>
          </div>
        </div>

        <nav>
          <p className="nav-label">MENÚ PRINCIPAL</p>

          <a className="active" href="#dashboard">
            <span className="nav-icon">▦</span>
            <span>Dashboard</span>
          </a>

          {puedeConsultarSolicitudes && (
            <a href="#solicitudes">
              <span className="nav-icon">▣</span>
              <span>
                {esEstudiante ? 'Mis solicitudes' : 'Solicitudes'}
              </span>
            </a>
          )}

          <a href="#inventario">
            <span className="nav-icon">⌕</span>
            <span>Inventario</span>
          </a>

          {(esAdministrador || esEncargado) && (
            <a href="#prestamos">
              <span className="nav-icon">⌂</span>
              <span>Préstamos</span>
            </a>
          )}

          {puedeAdministrar && (
            <>
              <p className="nav-label">ADMINISTRACIÓN</p>

              <a href="#usuarios">
                <span className="nav-icon">♙</span>
                <span>Usuarios</span>
              </a>

              <a href="#politicas">
                <span className="nav-icon">⚙</span>
                <span>Políticas</span>
              </a>

              <a href="#auditoria">
                <span className="nav-icon">▤</span>
                <span>Auditoría</span>
              </a>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{inicialUsuario}</div>

          <div className="user-info">
            <strong>{nombreCompleto}</strong>
            <small>{usuarioSesion.rol.replace(/_/g, ' ')}</small>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            ↪
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main" id="dashboard">
        <header className="topbar">
          <div>
            <span className="breadcrumb">MOTPI / Dashboard</span>
            <h2>Panel principal</h2>
          </div>

          <div className="section-heading">
            <span className="system-status">
              <span className="status-dot" />
              Sistema local
            </span>

            <button
              type="button"
              onClick={actualizarDashboard}
              disabled={
                cargandoInventario ||
                (puedeConsultarSolicitudes && cargandoSolicitudes)
              }
            >
              {cargandoInventario ||
              (puedeConsultarSolicitudes && cargandoSolicitudes)
                ? 'Actualizando...'
                : 'Actualizar datos'}
            </button>
          </div>
        </header>

        {/* BIENVENIDA */}
        <section className="welcome">
          <div className="welcome-content">
            <span className="eyebrow">
              PLATAFORMA DE AUTORIZACIÓN CONTEXTUAL
            </span>

            <h2>Bienvenido a MOTPI</h2>

            <p>
              Hola, {usuarioSesion.nombre}. Consulta los recursos y
              las funciones disponibles para tu perfil institucional.
            </p>

            <span className="institution-name">
              {nombreInstitucion || 'Institución educativa'}
            </span>
          </div>

          <div className="welcome-logo">
            {logoInstitucion ? (
              <img
                src={logoInstitucion}
                alt="Logotipo institucional"
              />
            ) : (
              <span>M</span>
            )}
          </div>
        </section>

        {/* PERSONALIZACIÓN */}
        <section className="settings-grid">
          <article className="settings-card">
            <div className="settings-heading">
              <div>
                <h3>Identidad visual</h3>
                <p>Personaliza los colores institucionales.</p>
              </div>
              <span className="settings-icon">◈</span>
            </div>

            <label htmlFor="theme-selector">
              Tema institucional
            </label>

            <select
              id="theme-selector"
              value={temaSeleccionado}
              onChange={(event) =>
                setTemaSeleccionado(event.target.value as Tema)
              }
            >
              {Object.entries(temas).map(([clave, valor]) => (
                <option key={clave} value={clave}>
                  {valor.nombre}
                </option>
              ))}
            </select>

            <div className="theme-preview">
              <div>
                <span style={{ background: tema.primary }} />
                <small>Principal</small>
              </div>

              <div>
                <span style={{ background: tema.secondary }} />
                <small>Secundario</small>
              </div>

              <div>
                <span style={{ background: tema.accent }} />
                <small>Acento</small>
              </div>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-heading">
              <div>
                <h3>Datos institucionales</h3>
                <p>Configura el nombre y logotipo.</p>
              </div>
              <span className="settings-icon">⌂</span>
            </div>

            <label htmlFor="institution-name">
              Nombre de la institución
            </label>

            <input
              id="institution-name"
              type="text"
              value={nombreInstitucion}
              onChange={(event) =>
                setNombreInstitucion(event.target.value)
              }
              placeholder="Nombre de la institución"
              maxLength={100}
            />

            <label htmlFor="institution-logo">
              Logotipo institucional
            </label>

            <input
              id="institution-logo"
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              onChange={manejarLogo}
            />

            {errorLogo && (
              <p className="error-message">{errorLogo}</p>
            )}

            <div className="institution-preview">
              <div className="institution-logo">
                {logoInstitucion ? (
                  <img
                    src={logoInstitucion}
                    alt="Vista previa del logotipo"
                  />
                ) : (
                  <span>LOGO</span>
                )}
              </div>

              <div>
                <strong>
                  {nombreInstitucion || 'Institución educativa'}
                </strong>
                <small>Identidad institucional</small>
              </div>
            </div>
          </article>
        </section>

        {/* ESTADÍSTICAS */}
        <section className="stats">
          {puedeConsultarSolicitudes && (
            <>
              <article className="stat-card">
                <span>
                  {esEstudiante ? 'Mis solicitudes' : 'Solicitudes totales'}
                </span>
                <strong>
                  {cargandoSolicitudes
                    ? '...'
                    : estadisticas.totalSolicitudes}
                </strong>
                <small>Registros en PostgreSQL</small>
              </article>

              <article className="stat-card">
                <span>Pendientes</span>
                <strong className="orange">
                  {cargandoSolicitudes ? '...' : estadisticas.pendientes}
                </strong>
                <small>Solicitudes pendientes</small>
              </article>

              <article className="stat-card">
                <span>Autorizadas</span>
                <strong className="green">
                  {cargandoSolicitudes ? '...' : estadisticas.autorizadas}
                </strong>
                <small>Decisiones autorizadas</small>
              </article>
            </>
          )}

          <article className="stat-card">
            <span>Recursos disponibles</span>
            <strong className="green">
              {cargandoInventario ? '...' : estadisticas.disponibles}
            </strong>
            <small>
              {cargandoInventario
                ? 'Consultando inventario'
                : `${estadisticas.totalRecursos} recursos registrados`}
            </small>
          </article>
        </section>

        {/* RESUMEN DE DECISIONES */}
        {puedeConsultarSolicitudes && (
          <section className="stats">
            <article className="stat-card">
              <span>Solicitudes denegadas</span>
              <strong className="orange">
                {cargandoSolicitudes ? '...' : estadisticas.denegadas}
              </strong>
              <small>Decisiones denegadas por MOTPI</small>
            </article>

            <article className="stat-card">
              <span>Recursos registrados</span>
              <strong>
                {cargandoInventario ? '...' : estadisticas.totalRecursos}
              </strong>
              <small>Inventario institucional</small>
            </article>
          </section>
        )}

        {/* INVENTARIO */}
        <section
          className="content-card inventory-section"
          id="inventario"
        >
          <div className="section-heading">
            <div>
              <h3>Inventario de recursos</h3>
              <p>
                Equipos registrados en la base de datos de MOTPI
              </p>
            </div>

            <button
              type="button"
              onClick={() => void cargarInventario()}
              disabled={cargandoInventario}
            >
              {cargandoInventario
                ? 'Actualizando...'
                : 'Actualizar inventario'}
            </button>
          </div>

          {cargandoInventario && (
            <p className="inventory-message">
              Consultando inventario...
            </p>
          )}

          {errorInventario && (
            <div className="inventory-error">
              <p>{errorInventario}</p>
              <button
                type="button"
                onClick={() => void cargarInventario()}
              >
                Reintentar
              </button>
            </div>
          )}

          {!cargandoInventario &&
            !errorInventario &&
            recursos.length === 0 && (
              <p className="inventory-message">
                No hay recursos registrados.
              </p>
            )}

          {!cargandoInventario &&
            !errorInventario &&
            recursos.length > 0 && (
              <div className="inventory-grid">
                {recursos.map((recurso) => (
                  <article
                    className="resource-card"
                    key={recurso.id_recurso}
                  >
                    <div className="resource-card-heading">
                      <span className="resource-icon">▣</span>

                      <span
                        className={`resource-status ${
                          recurso.estado === 'DISPONIBLE'
                            ? 'available'
                            : 'unavailable'
                        }`}
                      >
                        {recurso.estado}
                      </span>
                    </div>

                    <h4>{recurso.nombre}</h4>

                    <p className="resource-type">
                      {recurso.tipo}
                    </p>

                    <div className="resource-details">
                      <span>
                        <strong>Serie:</strong>{' '}
                        {recurso.numero_serie || 'Sin asignar'}
                      </span>

                      <span>
                        <strong>Laboratorio:</strong>{' '}
                        {recurso.laboratorio?.nombre || 'Sin asignar'}
                      </span>

                      <span>
                        <strong>Ubicación:</strong>{' '}
                        {recurso.laboratorio?.ubicacion ||
                          'No especificada'}
                      </span>
                    </div>

                    {recurso.descripcion && (
                      <p className="resource-description">
                        {recurso.descripcion}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
        </section>

        {/* SOLICITUDES */}
        {puedeConsultarSolicitudes && (
          <section className="content-card" id="solicitudes">
            <div className="section-heading">
              <div>
                <h3>
                  {esEstudiante
                    ? 'Mis solicitudes'
                    : 'Solicitudes recientes'}
                </h3>
                <p>
                  Solicitudes registradas y evaluadas por MOTPI
                </p>
              </div>

              <button
                type="button"
                onClick={() => void cargarSolicitudes()}
                disabled={cargandoSolicitudes}
              >
                {cargandoSolicitudes
                  ? 'Actualizando...'
                  : 'Actualizar solicitudes'}
              </button>
            </div>

            {cargandoSolicitudes && (
              <p className="inventory-message">
                Consultando solicitudes...
              </p>
            )}

            {errorSolicitudes && (
              <div className="inventory-error">
                <p>{errorSolicitudes}</p>
                <button
                  type="button"
                  onClick={() => void cargarSolicitudes()}
                >
                  Reintentar
                </button>
              </div>
            )}

            {!cargandoSolicitudes &&
              !errorSolicitudes &&
              solicitudes.length === 0 && (
                <p className="inventory-message">
                  Todavía no hay solicitudes registradas.
                </p>
              )}

            {!cargandoSolicitudes &&
              !errorSolicitudes &&
              solicitudes.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {!esEstudiante && <th>Solicitante</th>}
                        <th>Equipo(s)</th>
                        <th>Fecha</th>
                        <th>Decisión MOTPI</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {solicitudes.map((solicitud) => (
                        <tr key={solicitud.id_solicitud}>
                          {!esEstudiante && (
                            <td>
                              <strong>
                                {solicitud.solicitante.nombre}
                              </strong>
                              <br />
                              <small>
                                {solicitud.solicitante.matricula ||
                                  solicitud.solicitante.correo}
                              </small>
                            </td>
                          )}

                          <td>
                            {solicitud.equipos.length > 0
                              ? solicitud.equipos
                                  .map((equipo) => equipo.nombre)
                                  .join(', ')
                              : 'Sin equipos'}
                          </td>

                          <td>
                            {formatearFecha(
                              solicitud.fecha_solicitud,
                            )}
                          </td>

                          <td>
                            {solicitud.decision ? (
                              <div>
                                <span
                                  className={`status ${obtenerClaseEstado(
                                    solicitud.decision.resultado,
                                  )}`}
                                >
                                  {solicitud.decision.resultado}
                                </span>
                                <br />
                                <small>
                                  {solicitud.decision.justificacion}
                                </small>
                              </div>
                            ) : (
                              'Sin evaluación'
                            )}
                          </td>

                          <td>
                            <span
                              className={`status ${obtenerClaseEstado(
                                solicitud.estado,
                              )}`}
                            >
                              {solicitud.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </section>
        )}

        {/* PRÉSTAMOS */}
        {(esAdministrador || esEncargado) && (
          <section className="content-card" id="prestamos">
            <div className="section-heading">
              <div>
                <h3>Estado de los préstamos</h3>
                <p>
                  Información de entrega y devolución de equipos
                </p>
              </div>
            </div>

            {solicitudes.filter((solicitud) => solicitud.prestamo).length ===
            0 ? (
              <p className="inventory-message">
                No hay préstamos registrados.
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Solicitante</th>
                      <th>Equipos</th>
                      <th>Entrega</th>
                      <th>Devolución prevista</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {solicitudes
                      .filter(
                        (
                          solicitud,
                        ): solicitud is Solicitud & {
                          prestamo: PrestamoSolicitud
                        } => solicitud.prestamo !== null,
                      )
                      .map((solicitud) => (
                        <tr key={solicitud.prestamo.id_prestamo}>
                          <td>{solicitud.solicitante.nombre}</td>

                          <td>
                            {solicitud.equipos
                              .map((equipo) => equipo.nombre)
                              .join(', ')}
                          </td>

                          <td>
                            {formatearFecha(
                              solicitud.prestamo.fecha_entrega,
                            )}
                          </td>

                          <td>
                            {formatearFecha(
                              solicitud.prestamo.fecha_devolucion_prevista,
                            )}
                          </td>

                          <td>
                            <span
                              className={`status ${obtenerClaseEstado(
                                solicitud.prestamo.estado,
                              )}`}
                            >
                              {solicitud.prestamo.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <footer>
          MOTPI · Motor de Políticas Institucionales · Versión de desarrollo
        </footer>
      </main>
    </div>
  )
}

export default App
