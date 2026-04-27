import AppLayout from '../components/AppLayout';
import {
  currencyFormatter,
  FAMILY_LABELS,
  type ProductFamily,
} from '../data/mockData';
import { useInventory } from '../state/useInventory';

const FAMILIES = Object.keys(FAMILY_LABELS) as ProductFamily[];

function Products() {
  const { addProduct, products } = useInventory();

  return (
    <AppLayout
      title="Gestión de productos"
      description="Registra y consulta los artículos de aseo que Pinval mantiene en inventario."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nuevo producto</h2>
            <span>Campos alineados con BD</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addProduct({
                codigo: String(formData.get('codigo')).trim(),
                descrip: String(formData.get('descrip')).trim(),
                familia: String(formData.get('familia')) as ProductFamily,
                prcosto: Number(formData.get('prcosto')),
                prventa: Number(formData.get('prventa')),
                stock: Number(formData.get('stock')),
                minStock: Number(formData.get('minStock')),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Código (codigo)
              <input
                name="codigo"
                placeholder="Ej: 001104"
                maxLength={20}
                required
              />
            </label>
            <label>
              Descripción (descrip)
              <input
                name="descrip"
                placeholder="Nombre del producto"
                required
              />
            </label>
            <label>
              Familia (familia)
              <select name="familia" required defaultValue="">
                <option value="" disabled>
                  Seleccione categoría
                </option>
                {FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {FAMILY_LABELS[f]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Precio costo (prcosto)
              <input
                name="prcosto"
                type="number"
                min="0"
                placeholder="Precio de costo en CLP"
                required
              />
            </label>
            <label>
              Precio venta (prventa)
              <input
                name="prventa"
                type="number"
                min="0"
                placeholder="Precio de venta en CLP"
                required
              />
            </label>
            <label>
              Stock actual
              <input
                name="stock"
                type="number"
                placeholder="Unidades en bodega"
                required
              />
            </label>
            <label>
              Stock mínimo (alerta)
              <input
                name="minStock"
                type="number"
                min="0"
                placeholder="Umbral de alerta"
                required
              />
            </label>
            <button type="submit">Agregar producto</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Catálogo</h2>
            <span>{products.length} productos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Familia</th>
                  <th>Pr. Costo</th>
                  <th>Pr. Venta</th>
                  <th>Stock</th>
                  <th>Val. Costo</th>
                  <th>Val. Venta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const sbtot = product.stock * product.prcosto;
                    const sbtotal = product.stock * product.prventa;
                    return (
                      <tr key={product.codigo}>
                        <td>{product.codigo}</td>
                        <td>{product.descrip}</td>
                        <td>{FAMILY_LABELS[product.familia] ?? product.familia}</td>
                        <td>{currencyFormatter.format(product.prcosto)}</td>
                        <td>{currencyFormatter.format(product.prventa)}</td>
                        <td>{product.stock}</td>
                        <td>{currencyFormatter.format(sbtot)}</td>
                        <td>{currencyFormatter.format(sbtotal)}</td>
                        <td>
                          <div className="table-actions">
                            <button type="button">Editar</button>
                            <button type="button" className="danger-button">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>No hay productos registrados.</td>
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

