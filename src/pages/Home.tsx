import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Home() {
  const { products, movements } = useInventory();
  const hasProducts = products.length > 0;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );
  const salesCount = movements.filter((movement) => movement.type === 'Salida').length;
  const purchasesCount = movements.filter(
    (movement) => movement.type === 'Entrada',
  ).length;
  const recentMovements = movements.slice(0, 5);

  return (
    <AppLayout
      title="Dashboard"
      description="Resumen general de ventas, compras, inventario y movimientos registrados en SICD Pinval."
    >
      <section className="metric-grid" aria-label="Indicadores principales">
        <article className="metric-card">
          <span>Stock total</span>
          <strong>{hasProducts ? `${totalStock} unidades` : 'Sin datos'}</strong>
          <p>Total disponible segun los productos cargados en inventario.</p>
        </article>

        <article className="metric-card warning">
          <span>Bajo stock</span>
          <strong>{hasProducts ? `${lowStock.length} productos` : 'Sin datos'}</strong>
          <p>Productos que ya estan en o bajo su stock minimo.</p>
        </article>

        <article className="metric-card success">
          <span>Compras registradas</span>
          <strong>{purchasesCount > 0 ? purchasesCount : 'Sin datos'}</strong>
          <p>Entradas registradas desde la vista de compras.</p>
        </article>

        <article className="metric-card accent">
          <span>Ventas registradas</span>
          <strong>{salesCount > 0 ? salesCount : 'Sin datos'}</strong>
          <p>Salidas registradas desde la vista de ventas.</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Actividad reciente</h2>
            <span>{movements.length} movimientos</span>
          </div>

          <div className="timeline">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement) => (
                <div key={movement.id}>
                  <strong>{movement.product}</strong>
                  <p>
                    {movement.type} de {movement.quantity} unidades
                  </p>
                  <p>{movement.detail}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                Aun no hay movimientos registrados.
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Estado del sistema</h2>
            <span>Vista operativa</span>
          </div>

          <ul className="check-list">
            <li>Ventas y compras actualizan el stock desde el frontend actual.</li>
            <li>Inventario y productos usan la estructura real definida para SICD.</li>
            <li>Movimientos centraliza la trazabilidad de entradas y salidas.</li>
            <li>Clientes y proveedores quedan disponibles para el flujo operativo.</li>
          </ul>
        </article>
      </section>
    </AppLayout>
  );
}

export default Home;
