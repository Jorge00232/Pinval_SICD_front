import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

type SaleLine = {
  id: string;
  codigo: string;
  quantity: number;
};

function createSaleLine(codigo = ''): SaleLine {
  return {
    id: crypto.randomUUID(),
    codigo,
    quantity: 1,
  };
}

function parseSaleDetail(detail: string) {
  const [documentPart, metadataPart = ''] = detail.split(' - ');
  const metadataSections = metadataPart.split(' | ');
  const customer = metadataSections[0] || 'Sin cliente';
  const typeSection = metadataSections.find((section) =>
    section.startsWith('Tipo: '),
  );
  const identifierSection = metadataSections.find((section) =>
    section.startsWith('Id: '),
  );

  return {
    document: documentPart,
    customer,
    customerType: typeSection?.replace('Tipo: ', '') ?? 'Sin tipo',
    identifier: identifierSection?.replace('Id: ', '') ?? '-',
  };
}

function Sales() {
  const { customers, movements, products, recordSale } = useInventory();
  const canRegisterSale = products.length > 0;
  const saleMovements = movements.filter((movement) => movement.type === 'Salida');
  const [customerName, setCustomerName] = useState('B2C');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [documentType, setDocumentType] = useState('Boleta');
  const [documentNumber, setDocumentNumber] = useState('');
  const [items, setItems] = useState<SaleLine[]>([createSaleLine()]);

  const genericCustomerOptions = useMemo(
    () => ['B2C', 'B2B'],
    [],
  );
  const registeredCustomerOptions = useMemo(
    () => customers.map((customer) => customer.name),
    [customers],
  );
  const uniqueCustomerOptions = [
    ...new Set([...genericCustomerOptions, ...registeredCustomerOptions]),
  ];
  const selectedCustomer = uniqueCustomerOptions.includes(customerName)
    ? customerName
    : uniqueCustomerOptions[0] ?? 'B2C';
  const selectedRegisteredCustomer = customers.find(
    (customer) => customer.name === selectedCustomer,
  );
  const resolvedCustomerType: 'B2B' | 'B2C' =
    selectedRegisteredCustomer?.customerType ??
    (selectedCustomer === 'B2B' ? 'B2B' : 'B2C');

  return (
    <AppLayout
      title="Ventas"
      description="Registra boletas o facturas del sistema actual para reflejar la salida de productos en inventario."
    >
      <section className="purchase-layout">
        <article className="panel purchase-form-panel">
          <div className="panel-heading">
            <h2>Registrar venta</h2>
            <span className="purchase-counter">
              {saleMovements.length} lineas registradas
            </span>
          </div>

          <form
            className="form purchase-form"
            onSubmit={(event) => {
              event.preventDefault();

              const normalizedItems = items.map((item) => ({
                ...item,
                codigo: item.codigo || products[0]?.codigo || '',
              }));

              recordSale({
                customerName: selectedCustomer,
                customerType: resolvedCustomerType,
                customerIdentifier,
                documentType,
                documentNumber,
                items: normalizedItems,
              });

              setCustomerName(uniqueCustomerOptions[0] ?? 'B2C');
              setCustomerIdentifier('');
              setDocumentType('Boleta');
              setDocumentNumber('');
              setItems([createSaleLine(products[0]?.codigo ?? '')]);
            }}
          >
            <div className="grid-form purchase-header-grid">
              <label>
                Cliente o tipo de cliente
                <select
                  value={selectedCustomer}
                  onChange={(event) => setCustomerName(event.target.value)}
                >
                  <optgroup label="Tipo de cliente">
                    {genericCustomerOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                  {registeredCustomerOptions.length > 0 ? (
                    <optgroup label="Clientes registrados">
                      {registeredCustomerOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </label>

              <label>
                Documento
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                >
                  <option value="Boleta">Boleta</option>
                  <option value="Factura">Factura</option>
                </select>
              </label>

              <label className="purchase-document-field">
                RUT o identificador
                <input
                  value={customerIdentifier}
                  onChange={(event) => setCustomerIdentifier(event.target.value)}
                  placeholder={
                    selectedRegisteredCustomer?.identifier ||
                    selectedRegisteredCustomer?.contact ||
                    'Ej: 76.123.456-7'
                  }
                  maxLength={60}
                />
              </label>

              <label className="purchase-document-field">
                Numero de documento
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="Ej: 30518"
                  maxLength={40}
                  required
                />
              </label>
            </div>

            <div className="purchase-items">
              {items.map((item, index) => (
                <div key={item.id} className="purchase-item-row">
                  <label>
                    Producto {index + 1}
                    <select
                      value={item.codigo || products[0]?.codigo || ''}
                      onChange={(event) => {
                        const codigo = event.target.value;
                        setItems((current) =>
                          current.map((line) =>
                            line.id === item.id ? { ...line, codigo } : line,
                          ),
                        );
                      }}
                      disabled={products.length === 0}
                      required
                    >
                      {products.length > 0 ? (
                        products.map((product) => (
                          <option key={product.codigo} value={product.codigo}>
                            {product.descrip}
                          </option>
                        ))
                      ) : (
                        <option value="">Sin productos registrados</option>
                      )}
                    </select>
                  </label>

                  <label>
                    Cantidad
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => {
                        const quantity = Number(event.target.value);
                        setItems((current) =>
                          current.map((line) =>
                            line.id === item.id
                              ? {
                                  ...line,
                                  quantity: Number.isNaN(quantity) ? 1 : quantity,
                                }
                              : line,
                          ),
                        );
                      }}
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="ghost-button purchase-remove-button purchase-small-button"
                    onClick={() => {
                      setItems((current) =>
                        current.length === 1
                          ? current
                          : current.filter((line) => line.id !== item.id),
                      );
                    }}
                    disabled={items.length === 1}
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="purchase-actions">
              <button
                type="button"
                className="ghost-button purchase-secondary-button"
                onClick={() =>
                  setItems((current) => [
                    ...current,
                    createSaleLine(products[0]?.codigo ?? ''),
                  ])
                }
                disabled={products.length === 0}
              >
                + Agregar producto
              </button>

              <button
                type="submit"
                className="purchase-primary-button"
                disabled={!canRegisterSale}
              >
                Registrar venta
              </button>
            </div>
          </form>
        </article>

        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>Ventas registradas</h2>
            <span className="purchase-counter">{saleMovements.length} registros</span>
          </div>

          <div className="table-wrap purchase-history-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>RUT / Id</th>
                </tr>
              </thead>
              <tbody>
                {saleMovements.length > 0 ? (
                  saleMovements.map((movement) => {
                    const detail = parseSaleDetail(movement.detail);

                    return (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td>{movement.product}</td>
                        <td className="numeric-cell">{movement.quantity}</td>
                        <td>{detail.document}</td>
                        <td>{detail.customer}</td>
                        <td>{detail.customerType}</td>
                        <td>{detail.identifier}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      {canRegisterSale
                        ? 'Aun no hay ventas registradas desde POS.'
                        : 'Para registrar ventas primero agrega productos.'}
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

export default Sales;
