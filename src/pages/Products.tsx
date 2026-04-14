import AppLayout from '../components/AppLayout';
import { currencyFormatter } from '../data/mockData';
import { useInventory } from '../state/useInventory';

function Products() {
  const { addProduct, products } = useInventory();

  return (
    <AppLayout
      title="Gestion de productos"
      description="Registra y consulta los articulos de aseo que Pinval mantiene en inventario."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nuevo producto</h2>
            <span>CRUD base</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addProduct({
                sku: String(formData.get('sku')).trim(),
                name: String(formData.get('name')).trim(),
                category: String(formData.get('category')).trim(),
                purchasePrice: Number(formData.get('purchasePrice')),
                salePrice: Number(formData.get('salePrice')),
                stock: Number(formData.get('stock')),
                minStock: Number(formData.get('minStock')),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              SKU
              <input name="sku" placeholder="Ingrese SKU" required />
            </label>
            <label>
              Nombre
              <input name="name" placeholder="Nombre del producto" required />
            </label>
            <label>
              Categoria
              <input name="category" placeholder="Ingrese categoria" required />
            </label>
            <label>
              Precio compra
              <input
                name="purchasePrice"
                type="number"
                min="0"
                placeholder="Ingrese precio"
                required
              />
            </label>
            <label>
              Precio venta
              <input
                name="salePrice"
                type="number"
                min="0"
                placeholder="Ingrese precio"
                required
              />
            </label>
            <label>
              Stock actual
              <input
                name="stock"
                type="number"
                min="0"
                placeholder="Ingrese stock"
                required
              />
            </label>
            <label>
              Stock minimo
              <input
                name="minStock"
                type="number"
                min="0"
                placeholder="Ingrese minimo"
                required
              />
            </label>
            <button type="submit">Agregar producto</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Catalogo</h2>
            <span>{products.length} productos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th>Compra</th>
                  <th>Venta</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.sku}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{currencyFormatter.format(product.purchasePrice)}</td>
                      <td>{currencyFormatter.format(product.salePrice)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button">Editar</button>
                          <button type="button" className="danger-button">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>No hay productos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppLayout>
  );
}

export default Products;
