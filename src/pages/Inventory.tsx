import AppLayout from '../components/AppLayout';
import { currencyFormatter, FAMILY_LABELS } from '../data/mockData';
import { useInventory } from '../state/useInventory';

function Inventory() {
  const { products } = useInventory();
  const hasProducts = products.length > 0;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValCosto = products.reduce((sum, p) => sum + p.stock * p.prcosto, 0);
  const totalValVenta = products.reduce((sum, p) => sum + p.stock * p.prventa, 0);
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  return (
    <AppLayout
      title="Inventario"
      description="Consulta el stock disponible y detecta quiebres antes de vender."
    >
      <section className="metric-grid compact inventory-metric-grid">
        <article className="metric-card">
          <span>Stock actual</span>
          <strong>{hasProducts ? totalStock.toLocaleString('es-CL') : 'Sin datos'}</strong>
          <p>Unidades totales disponibles en inventario</p>
        </article>
        <article className="metric-card warning">
          <span>Productos bajo stock mínimo</span>
          <strong>{hasProducts ? lowStock.length : 'Sin datos'}</strong>
          <p>Productos que requieren revisión o reposición</p>
        </article>
        <article className="metric-card">
          <span>Costo total</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValCosto) : 'Sin datos'}</strong>
          <p>Total calculado con precio costo</p>
        </article>
        <article className="metric-card">
          <span>Valor aproximado venta</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValVenta) : 'Sin datos'}</strong>
          <p>Total estimado según precio de venta</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Stock por producto</h2>
          <span>Actualizado hoy</span>
        </div>
        <div className="table-wrap inventory-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Familia</th>
                <th>Stock actual</th>
                <th>Stock mínimo</th>
                <th>Estado</th>
                <th>Precio costo</th>
                <th>Valor a costo</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const needsRestock = product.stock <= product.minStock;
                  const sbtot = product.stock * product.prcosto;

                  return (
                    <tr key={product.codigo}>
                      <td className="inventory-code-cell">{product.codigo}</td>
                      <td className="inventory-description-cell">{product.descrip}</td>
                      <td className="inventory-family-cell">
                        {FAMILY_LABELS[product.familia] ?? product.familia}
                      </td>
                      <td className="numeric-cell">{product.stock}</td>
                      <td className="numeric-cell">{product.minStock}</td>
                      <td>
                        <span
                          className={`status ${needsRestock ? 'danger' : 'ok'}`}
                        >
                          {needsRestock ? 'Bajo mínimo' : 'En rango'}
                        </span>
                      </td>
                      <td className="numeric-cell">{currencyFormatter.format(product.prcosto)}</td>
                      <td className="numeric-cell">{currencyFormatter.format(sbtot)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>Aún no hay productos cargados en inventario.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default Inventory;

