
import { useState, type FormEvent } from 'react'

const API_LOGIN = 'http://localhost:3000/api/v1/auth/login'

interface LoginProps {
  onLogin: (token: string, usuario: Usuario) => void
}

export interface Usuario {
  id_usuario: string
  nombre: string
  apellido: string
  correo: string
  matricula: string | null
  rol: string
  estado: string
}

interface RespuestaLogin {
  success: boolean
  access_token: string
  token_type: string
  usuario: Usuario
}

function Login({ onLogin }: LoginProps) {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const manejarLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await fetch(API_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo,
          password,
        }),
      })

      const datos = await respuesta.json()

      if (!respuesta.ok) {
        throw new Error(
          datos.message || 'Correo o contraseña incorrectos.',
        )
      }

      const sesion = datos as RespuestaLogin

      if (!sesion.success || !sesion.access_token || !sesion.usuario) {
        throw new Error('La respuesta del servidor no es válida.')
      }

      onLogin(sesion.access_token, sesion.usuario)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión.',
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">M</div>
          <h1>MOTPI</h1>
          <p>Motor de Políticas Institucionales</p>
        </div>

        <div className="login-heading">
          <h2>Bienvenido</h2>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>

        <form onSubmit={manejarLogin}>
          <label htmlFor="login-correo">Correo electrónico</label>
          <input
            id="login-correo"
            type="email"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            placeholder="usuario@institucion.edu"
            autoComplete="username"
            required
          />

          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        <footer>MOTPI · Plataforma institucional</footer>
      </div>
    </div>
  )
}

export default Login
