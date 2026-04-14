import { Link } from 'react-router-dom';
import '../App.css';

function Inventory() {
  return (
    <div className="page">
      <div className="container">
        <div className="card">
          <h1 className="title">Inventario</h1>
          <p className="subtitle">
            Aquí podrás visualizar el stock disponible y los movimientos de
            inventario.
          </p>

          <div className="table-placeholder">
            Tabla de inventario próximamente...
          </div>

          <div className="nav">
            <Link to="/home">Inicio</Link>
            <Link to="/products">Productos</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventory;