import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Sales() {
  const { customers, products, recordSale } = useInventory();
  const canRegisterSale = products.length > 0;

  return (
    <AppLayout
      title="Ventas POS"
      description="Registra salidas asociadas a boletas o facturas del sistema de ventas existente."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nueva salida por venta</h2>
            <span>POS a inventario</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              recordSale({
                customerName: String(formData.get('customer')),
                documentType: String(formData.get('documentType')),
                codigo: String(formData.get('product')),
                quantity: Number(formData.get('quantity')),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Cliente o tipo de cliente
              <select name="customer">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <option key={customer.name}>{customer.name}</option>
                  ))
                ) : (
                  <>
                    <option>B2C</option>
                    <option>B2B</option>
                  </>
                )}
              </select>
            </label>
            <label>
              Documento de venta
              <select name="documentType" defaultValue="Boleta">
                <option>Boleta</option>
                <option>Factura</option>
              </select>
            </label>
            <label>
              Producto
              <select name="product">
                {products.length > 0 ? (
                  products.map((product) => (
                    <option key={product.codigo} value={product.codigo}>
                      {product.descrip}
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
                placeholder="Cantidad vendida"
                required
              />
            </label>
            <button type="submit" disabled={!canRegisterSale}>
              Agregar salida
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Salidas registradas</h2>
            <span>Sin datos</span>
          </div>
          <div className="empty-state">
            {canRegisterSale
              ? 'Las salidas registradas apareceran en Movimientos.'
              : 'Para registrar salidas primero agrega productos.'}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}

export default Sales;
