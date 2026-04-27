import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Home() {
  const { products, movements } = useInventory();
  const hasProducts = products.length > 0;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );

  return (
    <AppLayout
      title="Dashboard"
      description="Vista inicial para centralizar el inventario que hoy se controla en Excel."
    >
      <section className="metric-grid" aria-label="Indicadores principales">
        <article className="metric-card">
          <span>Stock total</span>
          <strong>{hasProducts ? `${totalStock} unidades` : 'Sin datos'}</strong>
          <p>Disponible cuando existan productos registrados</p>
        </article>
        <article className="metric-card warning">
          <span>Bajo stock</span>
          <strong>{hasProducts ? `${lowStock.length} productos` : 'Sin datos'}</strong>
          <p>Se calcula con stock minimo por producto</p>
        </article>
        <article className="metric-card success">
          <span>Datos por validar</span>
          <strong>Sin datos</strong>
          <p>Disponible al cargar archivos reales de Pinval</p>
        </article>
        <article className="metric-card accent">
          <span>Movimientos auditables</span>
          <strong>{movements.length > 0 ? movements.length : 'Sin datos'}</strong>
          <p>Disponible cuando existan registros de entrada o salida</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Alertas prioritarias</h2>
            <span>{hasProducts ? `${lowStock.length} activas` : 'Sin datos'}</span>
          </div>
          <div className="alert-list">
            {lowStock.length > 0 ? (
              lowStock.map((product) => (
                <div className="alert-row" key={product.codigo}>
                  <div>
                    <strong>{product.descrip}</strong>
                    <p>
                      Stock actual: {product.stock} / mínimo:{' '}
                      {product.minStock}
                    </p>
                  </div>
                  <span className="status danger">Reponer</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No hay productos registrados para calcular alertas.
              </div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Estado del sistema</h2>
            <span>Sin conexion a datos</span>
          </div>
          <ul className="check-list">
            <li>Inventario pendiente de carga desde archivo real.</li>
            <li>Modelo de datos pendiente de conexion con backend.</li>
            <li>Validaciones de calidad listas para definirse.</li>
            <li>Auditoria disponible cuando existan usuarios y movimientos.</li>
          </ul>
        </article>
      </section>
    </AppLayout>
  );
}

export default Home;
