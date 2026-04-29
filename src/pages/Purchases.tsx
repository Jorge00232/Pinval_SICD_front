import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

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
  const { t } = useLanguage();
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
      title={t('page.purchases.title')}
      description={t('page.purchases.description')}
    >
      <section className="purchase-layout">
        <article className="panel purchase-form-panel">
          <div className="panel-heading">
            <h2>{t('purchases.registerPurchase')}</h2>
            <span className="purchase-counter">
              {purchaseMovements.length} {t('purchases.linesRegistered')}
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
                {t('purchases.date')}
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  required
                />
              </label>

              <label>
                {t('purchases.supplier')}
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
                    <option value="">{t('purchases.noSuppliers')}</option>
                  )}
                </select>
              </label>

              <label className="purchase-document-field">
                {t('purchases.invoiceNumber')}
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  placeholder={t('purchases.invoicePlaceholder')}
                  maxLength={40}
                  required
                />
              </label>
            </div>

            <div className="purchase-items">
              {items.map((item, index) => (
                <div key={item.id} className="purchase-item-row">
                  <label>
                    {`${t('purchases.product')} ${index + 1}`}
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
                        <option value="">{t('purchases.noProducts')}</option>
                      )}
                    </select>
                  </label>

                  <label>
                    {t('purchases.quantity')}
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
                    {t('purchases.remove')}
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
                {t('purchases.addProduct')}
              </button>

              <button
                type="submit"
                className="purchase-primary-button"
                disabled={!canRegisterPurchase}
              >
                {t('purchases.savePurchase')}
              </button>
            </div>
          </form>
        </article>

        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>{t('purchases.history')}</h2>
            <span className="purchase-counter">
              {purchaseMovements.length} {t('purchases.records')}
            </span>
          </div>

          <div className="table-wrap purchase-history-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('purchases.date')}</th>
                  <th>{t('purchases.product')}</th>
                  <th>{t('purchases.quantity')}</th>
                  <th>{t('sales.invoice')}</th>
                  <th>{t('purchases.supplier')}</th>
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
                        ? t('purchases.noPurchases')
                        : t('purchases.addSuppliersProductsFirst')}
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
