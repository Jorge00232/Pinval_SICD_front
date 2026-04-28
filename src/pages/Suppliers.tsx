import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Suppliers() {
  const { addSupplier, suppliers } = useInventory();

  return (
    <AppLayout
      title="Proveedores"
      description="Registro de proveedores para compras, contacto comercial y seguimiento de abastecimiento."
    >
      <section className="products-layout">
        <article className="panel products-form-panel">
          <div className="panel-heading">
            <h2>Nuevo proveedor</h2>
            <span>{suppliers.length} registros</span>
          </div>

          <form
            className="grid-form products-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addSupplier({
                name: String(formData.get('name')).trim(),
                identifier: String(formData.get('identifier')).trim(),
                contactName: String(formData.get('contactName')).trim(),
                phone: String(formData.get('phone')).trim(),
                email: String(formData.get('email')).trim(),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              Nombre proveedor
              <input
                name="name"
                placeholder="Ej: Distribuidora Central"
                maxLength={120}
                required
              />
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
              Persona de contacto
              <input
                name="contactName"
                placeholder="Ej: Marcela Soto"
                maxLength={120}
                required
              />
            </label>

            <label>
              Telefono
              <input
                name="phone"
                placeholder="Ej: +56 9 8765 4321"
                maxLength={40}
              />
            </label>

            <label>
              Correo
              <input
                name="email"
                type="email"
                placeholder="Ej: contacto@proveedor.cl"
                maxLength={120}
              />
            </label>

            <button type="submit">Agregar proveedor</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Lista de proveedores</h2>
            <span>{suppliers.length} activos</span>
          </div>

          <div className="table-wrap products-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>RUT / Id</th>
                  <th>Contacto</th>
                  <th>Telefono</th>
                  <th>Correo</th>
                  <th>Ultima compra</th>
                  <th>Compras</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <tr key={supplier.name}>
                      <td className="description-cell">{supplier.name}</td>
                      <td>{supplier.identifier || '-'}</td>
                      <td>{supplier.contactName}</td>
                      <td>{supplier.phone || '-'}</td>
                      <td>{supplier.email || '-'}</td>
                      <td>{supplier.lastPurchase}</td>
                      <td className="numeric-cell">{supplier.totalPurchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>Aun no hay proveedores registrados.</td>
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
