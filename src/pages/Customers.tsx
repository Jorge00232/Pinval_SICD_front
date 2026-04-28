import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Customers() {
  const { addCustomer, customers } = useInventory();
  const totalB2B = customers.filter(
    (customer) => customer.customerType === 'B2B',
  ).length;
  const totalB2C = customers.filter(
    (customer) => customer.customerType === 'B2C',
  ).length;

  return (
    <AppLayout
      title="Clientes"
      description="Registro de clientes para ventas y seguimiento comercial, con foco principal en clientes B2B."
    >
      <section className="products-layout">
        <article className="panel products-form-panel">
          <div className="panel-heading">
            <h2>Nuevo cliente</h2>
            <span>{customers.length} registros</span>
          </div>

          <form
            className="grid-form products-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addCustomer({
                name: String(formData.get('name')).trim(),
                contact: String(formData.get('contact')).trim(),
                identifier: String(formData.get('identifier')).trim(),
                customerType: String(formData.get('customerType')) as 'B2B' | 'B2C',
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Nombre o razon social
              <input
                name="name"
                placeholder="Ej: Empresa B"
                maxLength={120}
                required
              />
            </label>

            <label>
              Tipo de cliente
              <select name="customerType" defaultValue="B2B" required>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </label>

            <label>
              RUT o identificador
              <input
                name="identifier"
                placeholder="Ej: 76.123.456-7"
                maxLength={60}
              />
            </label>

            <label>
              Contacto
              <input
                name="contact"
                placeholder="Telefono, correo o referencia comercial"
                maxLength={120}
                required
              />
            </label>

            <button type="submit">Agregar cliente</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Registro de clientes</h2>
            <span>
              {totalB2B} B2B / {totalB2C} B2C
            </span>
          </div>

          <div className="table-wrap products-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>RUT / Id</th>
                  <th>Contacto</th>
                  <th>Ultima compra</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.name}>
                      <td className="description-cell">{customer.name}</td>
                      <td>
                        <span
                          className={`customer-type-badge ${
                            customer.customerType === 'B2B' ? 'b2b' : 'b2c'
                          }`}
                        >
                          {customer.customerType}
                        </span>
                      </td>
                      <td>{customer.identifier || '-'}</td>
                      <td>{customer.contact}</td>
                      <td>{customer.lastPurchase}</td>
                      <td className="numeric-cell">{customer.purchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Aun no hay clientes registrados.</td>
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
