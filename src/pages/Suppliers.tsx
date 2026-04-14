import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Suppliers() {
  const { addSupplier, suppliers } = useInventory();

  return (
    <AppLayout
      title="Proveedores"
      description="Gestiona contactos y revisa el historial de compras por proveedor."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nuevo proveedor</h2>
            <span>Registro</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addSupplier({
                name: String(formData.get('name')).trim(),
                contact: String(formData.get('contact')).trim(),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Nombre proveedor
              <input name="name" placeholder="Ingrese proveedor" required />
            </label>
            <label>
              Contacto
              <input name="contact" placeholder="Ingrese contacto" required />
            </label>
            <button type="submit">Agregar proveedor</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Lista de proveedores</h2>
            <span>{suppliers.length} activos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Ultima compra</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <tr key={supplier.name}>
                      <td>{supplier.name}</td>
                      <td>{supplier.contact}</td>
                      <td>{supplier.lastPurchase}</td>
                      <td>{supplier.totalPurchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No hay proveedores registrados.</td>
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

export default Suppliers;
