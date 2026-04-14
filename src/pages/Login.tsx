import { Link } from 'react-router-dom';
import '../App.css';

function Login() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 className="title">Iniciar sesión</h1>
          <p className="subtitle">
            Accede al sistema de inventario de Pinval.
          </p>

          <form className="form">
            <input type="email" placeholder="Correo electrónico" />
            <input type="password" placeholder="Contraseña" />
            <button type="submit">Ingresar</button>
          </form>

          <div className="nav">
            <Link to="/home">Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;