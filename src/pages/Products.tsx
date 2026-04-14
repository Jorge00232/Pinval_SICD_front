import { Link } from 'react-router-dom';
import '../App.css';

function Products() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 className="title">Productos</h1>
          <p className="subtitle">
            Aquí podrás gestionar el catálogo de productos del sistema.
          </p>

          <div className="table-placeholder">
            Lista de productos próximamente...
          </div>

          <div className="nav">
            <Link to="/home">Inicio</Link>
            <Link to="/inventory">Inventario</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;