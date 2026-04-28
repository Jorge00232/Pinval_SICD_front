import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Alerts() {
  const { products } = useInventory();
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );

  return (
    <AppLayout
      title="Alertas"
      description="Notificaciones para anticipar quiebres de stock y atrasos operativos."
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>Productos con stock bajo</h2>
          <span>{lowStock.length} pendientes</span>
        </div>
        <div className="alert-list">
          {lowStock.length > 0 ? (
            lowStock.map((product) => (
              <div className="alert-row" key={product.codigo}>
                <div>
                  <strong>{product.descrip}</strong>
                  <p>
                    Código {product.codigo}: quedan {product.stock} unidades y el
                    minimo definido es {product.minStock}.
                  </p>
                </div>
                <Link to="/purchases" className="secondary-action">
                  Crear compra
                </Link>
              </div>
            ))
          ) : (
            <div className="empty-state">
              No hay alertas porque aun no existen productos registrados.
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

export default Alerts;
