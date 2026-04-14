import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Customers() {
  const { addCustomer, customers } = useInventory();

  return (
    <AppLayout
      title="Clientes B2C/B2B"
      description="Consulta clientes cuando la informacion comercial real este disponible."
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Nuevo cliente</h2>
            <span>B2C/B2B</span>
          </div>
          <form
            className="grid-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addCustomer({
                name: String(formData.get('name')).trim(),
                contact: String(formData.get('contact')).trim(),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Nombre cliente
              <input name="name" placeholder="Ingrese cliente" required />
            </label>
            <label>
              Contacto
              <input name="contact" placeholder="Ingrese contacto" required />
            </label>
            <button type="submit">Agregar cliente</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Registro de clientes</h2>
            <span>{customers.length} contactos</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Ultima compra</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.name}>
                      <td>{customer.name}</td>
                      <td>{customer.contact}</td>
                      <td>{customer.lastPurchase}</td>
                      <td>{customer.purchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      No hay clientes registrados con datos reales.
                    </td>
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

export default Customers;
