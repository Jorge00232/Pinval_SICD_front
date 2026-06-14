import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ProductSearchSelect from '../components/ProductSearchSelect';
import { canManageData } from '../api/authApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';
import SuccessModal from '../components/SuccessModal';

type PurchaseLine = {
  id: string;
  codigo: string;
  quantity: number;
};

type MovementLike = {
  detail?: string | null;
};

const PURCHASE_DOCUMENT_PREFIX = 'COMP';

function createPurchaseLine(codigo = ''): PurchaseLine {
  return {
    id: crypto.randomUUID(),
    codigo,
    quantity: 1,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateNextDocumentNumber(
  movements: MovementLike[],
  prefix: string,
) {
  const documentPattern = new RegExp(
    `\\b${escapeRegExp(prefix)}-(\\d+)\\b`,
    'i',
  );

  const maxDocumentNumber = movements.reduce((maxNumber, movement) => {
    const match = String(movement.detail ?? '').match(documentPattern);

    if (!match) {
      return maxNumber;
    }

    const parsedNumber = Number(match[1]);

    if (!Number.isFinite(parsedNumber)) {
      return maxNumber;
    }

    return Math.max(maxNumber, parsedNumber);
  }, 0);

  return `${prefix}-${String(maxDocumentNumber + 1).padStart(6, '0')}`;
}

function getTodayInputValue() {
  const today = new Date();
  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60 * 1000,
  );

  return localToday.toISOString().slice(0, 10);
}

function isFutureDate(value: string) {
  if (!value) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate > today;
}

function getPurchaseDocumentLabel(detail: string) {
  const [documentPart = '-'] = detail.split(' - ');
  return documentPart.replace(/^Factura\s+/i, '').trim() || '-';
}

function getPurchaseSupplierLabel(detail: string) {
  const [, supplierPart = '-'] = detail.split(' - ');
  return supplierPart.trim() || '-';
}

function Purchases() {
  const { movements, products, recordPurchase, suppliers } = useInventory();
  const { t } = useLanguage();

  const canRegister = canManageData();

  const canRegisterPurchase =
    canRegister && products.length > 0 && suppliers.length > 0;

  const purchaseMovements = movements.filter(
    (movement) => movement.type === 'Entrada',
  );

  const nextDocumentNumber = useMemo(
    () => generateNextDocumentNumber(purchaseMovements, PURCHASE_DOCUMENT_PREFIX),
    [purchaseMovements],
  );

  const todayDate = useMemo(() => getTodayInputValue(), []);

  const [purchaseDate, setPurchaseDate] = useState(todayDate);
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<PurchaseLine[]>([createPurchaseLine()]);
  const [formMessage, setFormMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedSupplier = supplierName || suppliers[0]?.name || '';

  return (
    <AppLayout
      title={t('page.purchases.title')}
      description={t('page.purchases.description')}
    >
      <section className="stacked-management-layout">
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
                  purchaseMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.date}</td>
                      <td>{movement.product}</td>
                      <td className="numeric-cell">{movement.quantity}</td>
                      <td>{getPurchaseDocumentLabel(movement.detail)}</td>
                      <td>{getPurchaseSupplierLabel(movement.detail)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      {canRegisterPurchase
                        ? t('purchases.noPurchases')
                        : canRegister
                          ? t('purchases.addSuppliersProductsFirst')
                          : t('purchases.noPurchases')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {canRegister ? (
          <details className="form-disclosure">
            <summary>
              <span>{t('purchases.registerPurchase')}</span>

              <strong>
                {purchaseMovements.length} {t('purchases.linesRegistered')}
              </strong>
            </summary>

            <article className="panel purchase-form-panel form-panel">
              <form
                className="form purchase-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  const normalizedItems = items.map((item) => ({
                    ...item,
                    codigo: item.codigo.trim(),
                    quantity: Number(item.quantity),
                  }));

                  const hasProductWithoutSelection = normalizedItems.some(
                    (item) => !item.codigo,
                  );

                  const hasInvalidQuantity = normalizedItems.some(
                    (item) =>
                      !Number.isFinite(item.quantity) || item.quantity <= 0,
                  );

                  if (!purchaseDate) {
                    setFormMessage('Debes seleccionar una fecha válida.');
                    return;
                  }

                  if (isFutureDate(purchaseDate)) {
                    setFormMessage('La fecha de la compra no puede ser futura.');
                    return;
                  }

                  if (!selectedSupplier) {
                    setFormMessage('Debes seleccionar un proveedor válido.');
                    return;
                  }

                  if (hasProductWithoutSelection) {
                    setFormMessage('Debes seleccionar un producto válido en cada línea.');
                    return;
                  }

                  if (hasInvalidQuantity) {
                    setFormMessage('La cantidad debe ser mayor a 0 en cada producto.');
                    return;
                  }

                  recordPurchase({
                    date: purchaseDate,
                    supplierName: selectedSupplier,
                    documentNumber: nextDocumentNumber,
                    items: normalizedItems,
                  });

                  setPurchaseDate(todayDate);
                  setSupplierName('');
                  setItems([createPurchaseLine()]);
                  setFormMessage('');
                  setShowSuccess(true);
                }}
              >
                <div className="grid-form purchase-header-grid">
                  <label>
                    {t('purchases.date')}

                    <input
                      type="date"
                      value={purchaseDate}
                      max={todayDate}
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
                      value={nextDocumentNumber}
                      readOnly
                      aria-readonly="true"
                      title="Número generado automáticamente al registrar la compra"
                    />
                  </label>
                </div>

                {formMessage ? (
                  <div className="form-message error">{formMessage}</div>
                ) : null}

                <div className="purchase-items">
                  {items.map((item, index) => (
                    <div key={item.id} className="purchase-item-row">
                      <ProductSearchSelect
                        label={`${t('purchases.product')} ${index + 1}`}
                        products={products}
                        value={item.codigo}
                        disabled={products.length === 0}
                        noProductsText={t('purchases.noProducts')}
                        placeholder="Buscar producto por nombre o código..."
                        onChange={(codigo) => {
                          setItems((current) =>
                            current.map((line) =>
                              line.id === item.id
                                ? {
                                    ...line,
                                    codigo,
                                  }
                                : line,
                            ),
                          );
                        }}
                      />

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
                                      quantity: Number.isNaN(quantity)
                                        ? 1
                                        : quantity,
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
                      setItems((current) => [...current, createPurchaseLine()])
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
          </details>
        ) : null}
      </section>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={t('purchases.successTitle')}
        message={t('purchases.successMessage')}
      />
    </AppLayout>
  );
}

export default Purchases;
