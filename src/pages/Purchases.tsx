import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Purchases() {
  const { products, recordPurchase, suppliers } = useInventory();
  const canRegisterPurchase = products.length > 0 && suppliers.length > 0;

  return (
    <AppLayout
      title="Entradas de inventario"
      description="Registra compras a proveedores para aumentar el stock de productos."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nueva compra</h2>
            <span>Entrada</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              recordPurchase({
                date: String(formData.get('date')),
                supplierName: String(formData.get('supplier')),
                sku: String(formData.get('product')),
                quantity: Number(formData.get('quantity')),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Fecha
              <input name="date" type="date" required />
            </label>
            <label>
              Proveedor
              <select name="supplier">
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <option key={supplier.name}>{supplier.name}</option>
                  ))
                ) : (
                  <option>Sin proveedores registrados</option>
                )}
              </select>
            </label>
            <label>
              Producto
              <select name="product">
                {products.length > 0 ? (
                  products.map((product) => (
                    <option key={product.sku} value={product.sku}>
                      {product.name}
                    </option>
                  ))
                ) : (
                  <option>Sin productos registrados</option>
                )}
              </select>
            </label>
            <label>
              Cantidad
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="Cantidad comprada"
                required
              />
            </label>
            <button type="submit" disabled={!canRegisterPurchase}>
              Agregar entrada
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Ultimas compras</h2>
            <span>Sin datos</span>
          </div>
          <div className="empty-state">
            {canRegisterPurchase
              ? 'Las compras registradas apareceran en Movimientos.'
              : 'Para registrar compras primero agrega proveedores y productos.'}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}

export default Purchases;
