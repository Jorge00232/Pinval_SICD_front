import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Alerts() {
  const { products } = useInventory();
  const lowStock = products
    .filter((product) => product.stock <= product.minStock)
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) {
        return -1;
      }

      if (b.stock === 0 && a.stock > 0) {
        return 1;
      }

      return a.stock - b.stock;
    });
  const criticalAlerts = lowStock.filter((product) => product.stock === 0);
  const warningAlerts = lowStock.filter((product) => product.stock > 0);

  return (
    <AppLayout
      title="Alertas"
      description="Productos que requieren reposicion o seguimiento inmediato."
    >
      <section className="alerts-strip" aria-label="Resumen de alertas">
        <div className="alerts-strip-header">
          <strong>Alertas</strong>
          <span>{lowStock.length} activas</span>
        </div>

        <div className="alerts-summary-list single-row">
          <div>
            <strong>{criticalAlerts.length}</strong>
            <span>Sin stock</span>
          </div>
          <div>
            <strong>{warningAlerts.length}</strong>
            <span>Por reponer</span>
          </div>
          <div>
            <strong>{lowStock.length > 0 ? 'Revisar' : 'Sin pendientes'}</strong>
            <span>Estado</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Productos a revisar</h2>
          <span>{lowStock.length} productos</span>
        </div>

        <div className="table-wrap alerts-table-wrap">
          {lowStock.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Prioridad</th>
                  <th>Producto</th>
                  <th>Codigo</th>
                  <th>Stock actual</th>
                  <th>Stock minimo</th>
                  <th>Estado</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => {
                  const isCritical = product.stock === 0;

                  return (
                    <tr key={product.codigo}>
                      <td>
                        <span className={`status ${isCritical ? 'danger' : 'ok'}`}>
                          {isCritical ? 'Alta' : 'Media'}
                        </span>
                      </td>
                      <td className="alerts-product-cell">{product.descrip}</td>
                      <td className="code-cell">{product.codigo}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
                      <td>{isCritical ? 'Sin stock' : 'Bajo minimo'}</td>
                      <td>
                        <div className="table-actions">
                          <Link to="/inventory" className="ghost-button alert-action-link">
                            Inventario
                          </Link>
                          <Link to="/purchases" className="secondary-action">
                            Comprar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              No hay alertas activas. Cuando un producto quede bajo su minimo,
              aparecera aqui.
            </div>
          )} 
        </div>
      </section>
    </AppLayout>
  );
}

export default Alerts;
