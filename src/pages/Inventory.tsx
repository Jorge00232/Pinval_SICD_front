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
      <section className="metric-grid compact">
        <article className="metric-card">
          <span>Unidades disponibles</span>
          <strong>{hasProducts ? totalStock.toLocaleString('es-CL') : 'Sin datos'}</strong>
          <p>Stock actual consolidado</p>
        </article>
        <article className="metric-card warning">
          <span>Quiebres posibles</span>
          <strong>{hasProducts ? lowStock.length : 'Sin datos'}</strong>
          <p>Productos bajo mínimo</p>
        </article>
        <article className="metric-card">
          <span>Val. stock a costo</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValCosto) : 'Sin datos'}</strong>
          <p>Subtotal a precio costo</p>
        </article>
        <article className="metric-card">
          <span>Val. stock a venta</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValVenta) : 'Sin datos'}</strong>
          <p>Subtotal a precio venta</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Stock por producto</h2>
          <span>Actualizado hoy</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Familia</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Pr. Costo</th>
                <th>Val. Costo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const needsRestock = product.stock <= product.minStock;
                  const sbtot = product.stock * product.prcosto;

                  return (
                    <tr key={product.codigo}>
                      <td>{product.codigo}</td>
                      <td>{product.descrip}</td>
                      <td>{FAMILY_LABELS[product.familia] ?? product.familia}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
                      <td>{currencyFormatter.format(product.prcosto)}</td>
                      <td>{currencyFormatter.format(sbtot)}</td>
                      <td>
                        <span
                          className={`status ${needsRestock ? 'danger' : 'ok'}`}
                        >
                          {needsRestock ? 'Bajo stock' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>No hay productos registrados.</td>
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

