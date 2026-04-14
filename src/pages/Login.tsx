import { Link } from 'react-router-dom';
import '../App.css';

function Login() {
  return (
    <div className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Acceso seguro</p>
          <h1 id="login-title">Iniciar sesión</h1>
          <p>
            Entra al sistema para consultar inventario, registrar movimientos y
            mantener trazabilidad de los datos.
          </p>
        </div>

        <form className="form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="email">Usuario</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Ingrese usuario"
            autoComplete="username"
            required
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Ingresa tu contraseña"
            autoComplete="current-password"
            required
          />

          <label htmlFor="role">Rol</label>
          <select id="role" name="role" defaultValue="admin">
            <option value="admin">Administracion</option>
            <option value="stock">Control stock</option>
            <option value="consulta">Consulta</option>
          </select>

          <button type="submit">Ingresar</button>
        </form>

        <div className="login-links">
          <Link to="/home">Entrar al sistema</Link>
          <a href="#recuperar">Recuperar contraseña</a>
        </div>
      </section>
    </div>
  );
}

export default Login;
