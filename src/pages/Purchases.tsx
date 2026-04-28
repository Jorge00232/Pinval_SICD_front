import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

type PurchaseLine = {
  id: string;
  codigo: string;
  quantity: number;
};

function createPurchaseLine(codigo = ''): PurchaseLine {
  return {
    id: crypto.randomUUID(),
    codigo,
    quantity: 1,
  };
}

function Purchases() {
  const { movements, products, recordPurchase, suppliers } = useInventory();
  const canRegisterPurchase = products.length > 0 && suppliers.length > 0;
  const purchaseMovements = movements.filter(
    (movement) => movement.type === 'Entrada',
  );
  const [purchaseDate, setPurchaseDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [items, setItems] = useState<PurchaseLine[]>([createPurchaseLine()]);
  const selectedSupplier = supplierName || suppliers[0]?.name || '';

  return (
    <AppLayout
      title="Compras"
      description="Registra compras de Pinval a proveedores y consulta el historial que aumenta el inventario."
    >
      <section className="purchase-layout">
        <article className="panel purchase-form-panel">
          <div className="panel-heading">
            <h2>Registrar compra</h2>
            <span className="purchase-counter">
              {purchaseMovements.length} lineas registradas
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

              recordPurchase({
                date: purchaseDate,
                supplierName: selectedSupplier,
                documentNumber,
                items: normalizedItems,
              });

              setPurchaseDate('');
              setDocumentNumber('');
              setSupplierName('');
              setItems([createPurchaseLine(products[0]?.codigo ?? '')]);
            }}
          >
            <div className="grid-form purchase-header-grid">
              <label>
                Fecha
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  required
                />
              </label>

              <label>
                Proveedor
                <select
                  value={selectedSupplier}
                  onChange={(event) => setSupplierName(event.target.value)}
                  disabled={suppliers.length === 0}
                  required
                >
                  {suppliers.length > 0 ? (
                    suppliers.map((supplier) => (
                      <option key={supplier.name} value={supplier.name}>
                        {supplier.name}
                      </option>
                    ))
                  ) : (
                    <option value="">Sin proveedores registrados</option>
                  )}
                </select>
              </label>

              <label className="purchase-document-field">
                Numero de factura
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder="Ej: 10234"
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
                    createPurchaseLine(products[0]?.codigo ?? ''),
                  ])
                }
                disabled={products.length === 0}
              >
                + Agregar producto
              </button>

              <button
                type="submit"
                className="purchase-primary-button"
                disabled={!canRegisterPurchase}
              >
                Guardar compra
              </button>
            </div>
          </form>
        </article>

        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>Historial de compras</h2>
            <span className="purchase-counter">{purchaseMovements.length} registros</span>
          </div>

          <div className="table-wrap purchase-history-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Factura</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {purchaseMovements.length > 0 ? (
                  purchaseMovements.map((movement) => {
                    const [documentPart, supplierPart] = movement.detail.split(' - ');
                    const documentLabel = documentPart.replace('Factura ', '');

                    return (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td>{movement.product}</td>
                        <td className="numeric-cell">{movement.quantity}</td>
                        <td>{documentLabel}</td>
                        <td>{supplierPart}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      {canRegisterPurchase
                        ? 'Aun no hay compras registradas.'
                        : 'Para registrar compras primero agrega proveedores y productos.'}
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

export default Purchases;
