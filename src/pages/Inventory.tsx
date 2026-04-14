import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Inventory() {
  const { products } = useInventory();
  const hasProducts = products.length > 0;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );

  return (
    <AppLayout
      title="Inventario"
      description="Consulta el stock disponible y detecta quiebres antes de vender."
    >
      <section className="metric-grid compact">
        <article className="metric-card">
          <span>Unidades disponibles</span>
          <strong>{hasProducts ? totalStock : 'Sin datos'}</strong>
          <p>Stock actual consolidado</p>
        </article>
        <article className="metric-card warning">
          <span>Quiebres posibles</span>
          <strong>{hasProducts ? lowStock.length : 'Sin datos'}</strong>
          <p>Productos bajo minimo</p>
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
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoria</th>
                <th>Stock</th>
                <th>Minimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const needsRestock = product.stock <= product.minStock;

                  return (
                    <tr key={product.sku}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
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
                  <td colSpan={6}>No hay productos registrados.</td>
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
