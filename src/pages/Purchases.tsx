import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ProductSearchSelect from '../components/ProductSearchSelect';
import { canManageData } from '../api/authApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  fetchPurchases,
  type Purchase,
  type CreatePurchaseInput,
} from '../api/purchasesApi';

type PurchaseLine = {
  id: string;
  codigo: string;
  quantity: number;
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

function generateNextDocumentNumber(purchases: Purchase[], prefix: string) {
  const documentPattern = new RegExp(
    `\\b${escapeRegExp(prefix)}-(\\d+)\\b`,
    'i',
  );

  const maxDocumentNumber = purchases.reduce((maxNumber, purchase) => {
    const match = String(purchase.documentNumber ?? '').match(documentPattern);

    if (!match) {
      return maxNumber;
    }

    const parsedNumber = Number(match[1]);

    return Number.isFinite(parsedNumber)
      ? Math.max(maxNumber, parsedNumber)
      : maxNumber;
  }, 0);

  return `${prefix}-${String(maxDocumentNumber + 1).padStart(4, '0')}`;
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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || '-';
  }

  return date.toLocaleDateString('es-CL');
}

function getPurchaseRows(purchases: Purchase[]) {
  return purchases.flatMap((purchase) =>
    purchase.items.map((item) => ({
      id: `${purchase.id}-${item.id}`,
      date: purchase.date,
      supplierName: purchase.supplierName,
      documentNumber: purchase.documentNumber,
      productName: item.productName || item.codigo,
      quantity: item.quantity,
    })),
  );
}

function Purchases() {
  const { products, recordPurchase, reloadInventoryData, suppliers } = useInventory();
  const { t } = useLanguage();

  const canRegister = canManageData();
  const canRegisterPurchase =
    canRegister && products.length > 0 && suppliers.length > 0;

  const todayDate = useMemo(() => getTodayInputValue(), []);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseDate, setPurchaseDate] = useState(todayDate);
  const [supplierName, setSupplierName] = useState('');
  const [items, setItems] = useState<PurchaseLine[]>([createPurchaseLine()]);
  const [formMessage, setFormMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPurchase, setPendingPurchase] =
    useState<CreatePurchaseInput | null>(null);

  const purchaseRows = useMemo(() => getPurchaseRows(purchases), [purchases]);

  const nextDocumentNumber = useMemo(
    () => generateNextDocumentNumber(purchases, PURCHASE_DOCUMENT_PREFIX),
    [purchases],
  );

  const selectedSupplier = supplierName || suppliers[0]?.name || '';

  async function reloadPurchases() {
    setIsLoading(true);

    try {
      const backendPurchases = await fetchPurchases();
      setPurchases(backendPurchases);
    } catch (error) {
      console.warn('No se pudieron cargar las compras desde el backend.', error);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reloadPurchases();
  }, []);

  function resetForm() {
    setPurchaseDate(todayDate);
    setSupplierName('');
    setItems([createPurchaseLine()]);
    setFormMessage('');
  }

  return (
    <AppLayout
      title={t('page.purchases.title')}
      description={t('page.purchases.description')}
    >
      <section className="stacked-management-layout">
        {canRegister ? (
          <details className="form-disclosure" open>
            <summary>
              <span>{t('purchases.registerPurchase')}</span>

              <strong>Formulario desplegado</strong>
            </summary>

            <article className="panel purchase-form-panel form-panel">
              <form
                className="form purchase-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  const normalizedItems = items.map((item) => ({
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

                  setPendingPurchase({
                    date: purchaseDate,
                    supplierName: selectedSupplier,
                    documentNumber: nextDocumentNumber,
                    items: normalizedItems,
                  });
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
                          <option key={supplier.id || supplier.name} value={supplier.name}>
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
                    disabled={!canRegisterPurchase || isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : t('purchases.savePurchase')}
                  </button>
                </div>
              </form>
            </article>
          </details>
        ) : null}

        <details className="records-disclosure purchase-records-disclosure">
          <summary>
            <span>{t('purchases.history')}</span>
            <strong>
              {purchaseRows.length} {t('purchases.records')}
            </strong>
          </summary>

          <article className="panel purchase-history-panel records-panel">
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
                {purchaseRows.length > 0 ? (
                  purchaseRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.productName}</td>
                      <td className="numeric-cell">{row.quantity}</td>
                      <td>{row.documentNumber}</td>
                      <td>{row.supplierName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      {isLoading
                        ? 'Cargando compras...'
                        : canRegisterPurchase
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
        </details>
      </section>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title={t('purchases.successTitle')}
        message={t('purchases.successMessage')}
      />

      {pendingPurchase ? (
        <ConfirmModal
          isOpen={true}
          title="¿Estás seguro?"
          subtitle="Se registrará la siguiente compra en el sistema."
          confirmLabel={isSubmitting ? 'Registrando...' : 'Registrar compra'}
          cancelLabel="Cancelar"
          details={[
            { label: 'Proveedor', value: pendingPurchase.supplierName },
            { label: 'Fecha', value: pendingPurchase.date },
            { label: 'Número doc.', value: pendingPurchase.documentNumber },
            ...pendingPurchase.items.map((item, i) => {
              const found = products.find((p) => p.codigo === item.codigo);
              const productName =
                found?.displayName?.trim() ||
                found?.descrip?.trim() ||
                item.codigo;

              return {
                label: `Producto ${i + 1}`,
                value: `${productName} (${item.codigo}) × ${item.quantity}`,
              };
            }),
          ]}
          onConfirm={() => {
            if (isSubmitting) {
              return;
            }

            setIsSubmitting(true);

            recordPurchase(pendingPurchase)
              .then(() => reloadPurchases())
              .then(() => reloadInventoryData())
              .then(() => {
                setPendingPurchase(null);
                resetForm();
                setShowSuccess(true);
              })
              .catch((error) => {
                setFormMessage(
                  error instanceof Error
                    ? error.message
                    : 'No se pudo registrar la compra.',
                );
                setPendingPurchase(null);
              })
              .finally(() => {
                setIsSubmitting(false);
              });
          }}
          onCancel={() => setPendingPurchase(null)}
        />
      ) : null}
    </AppLayout>
  );
}

export default Purchases;
