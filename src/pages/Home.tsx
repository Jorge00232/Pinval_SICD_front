import { Link } from 'react-router-dom';
import '../App.css';

function Home() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 className="title">SICD - Sistema de Inventario</h1>
          <p className="subtitle">
            Bienvenido al frontend del proyecto Pinval.
          </p>

          <div className="nav">
            <Link to="/login">Login</Link>
            <Link to="/inventory">Inventario</Link>
            <Link to="/products">Productos</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;