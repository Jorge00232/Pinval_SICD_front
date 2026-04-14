import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Reports() {
  const { movements, products } = useInventory();
  const purchaseMovements = movements.filter(
    (movement) => movement.type === 'Entrada',
  );
  const saleMovements = movements.filter((movement) => movement.type === 'Salida');
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );

  return (
    <AppLayout
      title="Reportes de gestion"
      description="Entrega informacion para la toma de decisiones cuando existan datos centralizados."
    >
      <section className="metric-grid compact">
        <article className="metric-card success">
          <span>Salidas registradas</span>
          <strong>{saleMovements.length || 'Sin datos'}</strong>
          <p>Movimientos asociados a ventas POS</p>
        </article>
        <article className="metric-card accent">
          <span>Productos bajo stock</span>
          <strong>{products.length > 0 ? lowStock.length : 'Sin datos'}</strong>
          <p>Segun stock minimo registrado</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Reportes disponibles</h2>
          <span>{movements.length} movimientos</span>
        </div>
        <ul className="check-list">
          <li>Productos registrados: {products.length}</li>
          <li>Entradas registradas: {purchaseMovements.length}</li>
          <li>Salidas registradas: {saleMovements.length}</li>
          <li>Productos bajo stock minimo: {lowStock.length}</li>
        </ul>
      </section>
    </AppLayout>
  );
}

export default Reports;
