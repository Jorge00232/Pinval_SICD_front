import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import {
  createSale,
  fetchSales,
  type CreateSaleInput,
  type Sale,
} from '../api/salesApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';
import type { Product } from '../data/mockData';
import SuccessModal from '../components/SuccessModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  formatRut,
  formatRutIfPossible,
  normalizeRutForSubmit,
} from '../utils/rut';

type SaleLine = {
  id: string;
  codigo: string;
  quantity: number;
};

type ProductSearchSelectProps = {
  label: string;
  products: Product[];
  value: string;
  disabled?: boolean;
  noProductsText: string;
  placeholder?: string;
  onChange: (codigo: string) => void;
};

type SaleRow = {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  document: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  customerIdentifier: string;
};

const SALE_DOCUMENT_PREFIX = 'VENT';

function createSaleLine(codigo = ''): SaleLine {
  return {
    id: crypto.randomUUID(),
    codigo,
    quantity: 1,
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateNextDocumentNumber(sales: Sale[], prefix: string) {
  const documentPattern = new RegExp(
    `\\b${escapeRegExp(prefix)}-(\\d+)\\b`,
    'i',
  );

  const maxDocumentNumber = sales.reduce((maxNumber, sale) => {
    const match = String(sale.documentNumber ?? '').match(documentPattern);

    if (!match) {
      return maxNumber;
    }

    const parsedNumber = Number(match[1]);

    if (!Number.isFinite(parsedNumber)) {
      return maxNumber;
    }

    return Math.max(maxNumber, parsedNumber);
  }, 0);

  return `${prefix}-${String(maxDocumentNumber + 1).padStart(4, '0')}`;
}

function getTodayInputValue() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - timezoneOffset * 60 * 1000);

  return localToday.toISOString().slice(0, 10);
}

function isFutureDate(value: string) {
  if (!value) {
    return false;
  }

  return value > getTodayInputValue();
}

function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-CL');
}

function getProductDisplayName(product: Product) {
  return (
    product.displayName?.trim() ||
    product.descrip?.trim() ||
    'Producto sin nombre'
  );
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getProductSearchText(product: Product) {
  return normalizeSearchText(
    [
      product.codigo,
      product.descrip,
      product.displayName,
      product.searchName,
      product.familia,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function getSaleRows(sales: Sale[]): SaleRow[] {
  return sales.flatMap((sale) =>
    sale.items.map((item) => ({
      id: `${sale.id}-${item.id}`,
      date: sale.date,
      productName: item.productName || item.codigo,
      quantity: item.quantity,
      document: `${sale.documentType} ${sale.documentNumber}`,
      customerName: sale.customerName,
      customerType: sale.customerType,
      customerIdentifier: formatRutIfPossible(sale.customerIdentifier) || '-',
    })),
  );
}

function ProductSearchSelect({
  label,
  products,
  value,
  disabled = false,
  noProductsText,
  placeholder = 'Buscar producto por nombre o código...',
  onChange,
}: ProductSearchSelectProps) {
  const selectedProduct = useMemo(
    () => products.find((product) => product.codigo === value) ?? null,
    [products, value],
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(getProductDisplayName(selectedProduct));
      return;
    }

    setSearchTerm('');
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    const normalizedTerm = normalizeSearchText(searchTerm);

    if (!normalizedTerm) {
      return products.slice(0, 12);
    }

    return products
      .filter((product) => getProductSearchText(product).includes(normalizedTerm))
      .slice(0, 12);
  }, [products, searchTerm]);

  function handleInputChange(inputValue: string) {
    setSearchTerm(inputValue);
    setIsOpen(true);

    if (selectedProduct && inputValue !== getProductDisplayName(selectedProduct)) {
      onChange('');
    }
  }

  function handleSelectProduct(product: Product) {
    onChange(product.codigo);
    setSearchTerm(getProductDisplayName(product));
    setIsOpen(false);
  }

  return (
    <div className="product-search-field">
      <label>{label}</label>

      <div
        className="product-search-combobox"
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;

          if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
          ) {
            setIsOpen(false);

            if (selectedProduct) {
              setSearchTerm(getProductDisplayName(selectedProduct));
            }
          }
        }}
      >
        <input
          type="text"
          value={searchTerm}
          disabled={disabled}
          placeholder={products.length > 0 ? placeholder : noProductsText}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => handleInputChange(event.target.value)}
          autoComplete="off"
          required
        />

        {isOpen && !disabled ? (
          <div className="product-search-results">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <button
                  key={product.codigo}
                  type="button"
                  className="product-search-option"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSelectProduct(product);
                  }}
                >
                  <strong>{getProductDisplayName(product)}</strong>
                  <span>
                    Código {product.codigo} · Stock{' '}
                    {product.stock.toLocaleString('es-CL')}
                  </span>
                </button>
              ))
            ) : (
              <div className="product-search-empty">
                No se encontraron productos con esa búsqueda.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Sales() {
  const { customers, products, reloadInventoryData } = useInventory();
  const { t } = useLanguage();
  const canRegister = canManageData();
  const canRegisterSale = canRegister && products.length > 0;
  const todayDate = useMemo(() => getTodayInputValue(), []);

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState('B2C');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [documentType, setDocumentType] = useState('Boleta');
  const [saleDate, setSaleDate] = useState(todayDate);
  const [items, setItems] = useState<SaleLine[]>([createSaleLine()]);
  const [formMessage, setFormMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSale, setPendingSale] = useState<CreateSaleInput | null>(null);

  const saleRows = useMemo(() => getSaleRows(sales), [sales]);

  const nextDocumentNumber = useMemo(
    () => generateNextDocumentNumber(sales, SALE_DOCUMENT_PREFIX),
    [sales],
  );

  const genericCustomerOptions = useMemo(() => ['B2C', 'B2B'], []);

  const registeredCustomerOptions = useMemo(
    () => customers.map((customer) => customer.name),
    [customers],
  );

  const uniqueCustomerOptions = useMemo(
    () => [...new Set([...genericCustomerOptions, ...registeredCustomerOptions])],
    [genericCustomerOptions, registeredCustomerOptions],
  );

  const selectedCustomer = uniqueCustomerOptions.includes(customerName)
    ? customerName
    : uniqueCustomerOptions[0] ?? 'B2C';

  const selectedRegisteredCustomer = customers.find(
    (customer) => customer.name === selectedCustomer,
  );

  const resolvedCustomerType: 'B2B' | 'B2C' =
    selectedRegisteredCustomer?.customerType ??
    (selectedCustomer === 'B2B' ? 'B2B' : 'B2C');

  async function reloadSales() {
    setIsLoading(true);

    try {
      const backendSales = await fetchSales();
      setSales(backendSales);
    } catch (error) {
      console.warn('No se pudieron cargar las ventas desde el backend.', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void reloadSales();
  }, []);

  function resetForm() {
    setCustomerName(uniqueCustomerOptions[0] ?? 'B2C');
    setCustomerIdentifier('');
    setDocumentType('Boleta');
    setSaleDate(getTodayInputValue());
    setItems([createSaleLine()]);
    setFormMessage('');
  }

  function handleCustomerChange(value: string) {
    setCustomerName(value);

    const matchedCustomer = customers.find((customer) => customer.name === value);

    if (matchedCustomer?.identifier) {
      setCustomerIdentifier(formatRut(matchedCustomer.identifier));
      return;
    }

    setCustomerIdentifier('');
  }

  return (
    <AppLayout
      title={t('page.sales.title')}
      description={t('page.sales.description')}
    >
      <section className="sales-layout">
        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>{t('sales.registeredSales')}</h2>
            <span className="purchase-counter">
              {saleRows.length} {t('purchases.records')}
            </span>
          </div>

          <div className="table-wrap purchase-history-wrap sales-history-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('purchases.date')}</th>
                  <th>{t('sales.product')}</th>
                  <th>{t('sales.quantity')}</th>
                  <th>{t('sales.document')}</th>
                  <th>{t('page.customers.title')}</th>
                  <th>{t('customers.type')}</th>
                  <th>{t('sales.identifier')}</th>
                </tr>
              </thead>

              <tbody>
                {saleRows.length > 0 ? (
                  saleRows.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.productName}</td>
                      <td className="numeric-cell">{row.quantity}</td>
                      <td>{row.document}</td>
                      <td>{row.customerName}</td>
                      <td>{row.customerType}</td>
                      <td>{row.customerIdentifier}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      {isLoading
                        ? 'Cargando ventas...'
                        : canRegisterSale
                          ? t('sales.noSales')
                          : canRegister
                            ? t('sales.addProductsFirst')
                            : t('sales.noSales')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {canRegister ? (
          <details className="sales-form-disclosure">
            <summary>
              <span>{t('sales.registerSale')}</span>
              <strong>
                {saleRows.length} {t('sales.linesRegistered')}
              </strong>
            </summary>

            <article className="panel purchase-form-panel sales-form-panel">
              <form
                className="form purchase-form"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (!saleDate) {
                    setFormMessage('Debes seleccionar una fecha de venta.');
                    return;
                  }

                  if (isFutureDate(saleDate)) {
                    setFormMessage('La fecha de venta no puede ser futura.');
                    return;
                  }

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

                  if (hasProductWithoutSelection) {
                    setFormMessage(
                      'Debes seleccionar un producto válido en cada línea.',
                    );
                    return;
                  }

                  if (hasInvalidQuantity) {
                    setFormMessage(
                      'La cantidad debe ser mayor a 0 en cada producto.',
                    );
                    return;
                  }

                  setPendingSale({
                    customerName: selectedCustomer,
                    customerType: resolvedCustomerType,
                    customerIdentifier: normalizeRutForSubmit(customerIdentifier),
                    documentType,
                    documentNumber: nextDocumentNumber,
                    date: saleDate,
                    items: normalizedItems,
                  });
                }}
              >
                <div className="grid-form purchase-header-grid">
                  <label>
                    {t('sales.customerOrType')}
                    <select
                      value={selectedCustomer}
                      onChange={(event) => handleCustomerChange(event.target.value)}
                    >
                      <optgroup label={t('sales.customerTypeGroup')}>
                        {genericCustomerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </optgroup>

                      {registeredCustomerOptions.length > 0 ? (
                        <optgroup label={t('sales.registeredCustomersGroup')}>
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
                    {t('sales.document')}
                    <select
                      value={documentType}
                      onChange={(event) => setDocumentType(event.target.value)}
                    >
                      <option value="Boleta">{t('sales.receipt')}</option>
                      <option value="Factura">{t('sales.invoice')}</option>
                    </select>
                  </label>

                  <label>
                    {t('purchases.date')}
                    <input
                      type="date"
                      value={saleDate}
                      max={todayDate}
                      onChange={(event) => setSaleDate(event.target.value)}
                      required
                    />
                  </label>

                  <label className="purchase-document-field">
                    {t('sales.identifier')}
                    <input
                      value={customerIdentifier}
                      onChange={(event) => {
                        setCustomerIdentifier(formatRut(event.target.value));
                      }}
                      placeholder={
                        selectedRegisteredCustomer?.identifier
                          ? formatRut(selectedRegisteredCustomer.identifier)
                          : selectedRegisteredCustomer?.contact ||
                            t('sales.identifierPlaceholder')
                      }
                      maxLength={12}
                    />
                  </label>

                  <label className="purchase-document-field">
                    {t('sales.documentNumber')}
                    <input
                      value={nextDocumentNumber}
                      readOnly
                      aria-readonly="true"
                      title="Número generado automáticamente al registrar la venta"
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
                        label={`${t('sales.product')} ${index + 1}`}
                        products={products}
                        value={item.codigo}
                        disabled={products.length === 0}
                        noProductsText={t('sales.noProducts')}
                        placeholder="Buscar producto por nombre o código..."
                        onChange={(codigo) => {
                          setItems((current) =>
                            current.map((line) =>
                              line.id === item.id ? { ...line, codigo } : line,
                            ),
                          );
                        }}
                      />

                      <label>
                        {t('sales.quantity')}
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
                        {t('sales.remove')}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="purchase-actions">
                  <button
                    type="button"
                    className="ghost-button purchase-secondary-button"
                    onClick={() =>
                      setItems((current) => [...current, createSaleLine()])
                    }
                    disabled={products.length === 0}
                  >
                    {t('sales.addProduct')}
                  </button>

                  <button
                    type="submit"
                    className="purchase-primary-button"
                    disabled={!canRegisterSale || isSubmitting}
                  >
                    {isSubmitting ? 'Guardando...' : t('sales.saveSale')}
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
        title={t('sales.successTitle')}
        message={t('sales.successMessage')}
      />

      {pendingSale ? (
        <ConfirmModal
          isOpen={true}
          title="¿Estás seguro?"
          subtitle="Se registrará la siguiente venta en el sistema."
          confirmLabel={isSubmitting ? 'Registrando...' : 'Registrar venta'}
          cancelLabel="Cancelar"
          details={[
            { label: 'Cliente', value: pendingSale.customerName },
            { label: 'Tipo cliente', value: pendingSale.customerType },
            { label: 'Documento', value: pendingSale.documentType },
            { label: 'Número doc.', value: pendingSale.documentNumber },
            { label: 'Fecha', value: pendingSale.date },
            ...(pendingSale.customerIdentifier
              ? [
                  {
                    label: 'Identificador',
                    value: formatRutIfPossible(pendingSale.customerIdentifier) || '-',
                  },
                ]
              : []),
            ...pendingSale.items.map((item, index) => {
              const found = products.find((product) => product.codigo === item.codigo);
              const productName =
                found?.displayName?.trim() ||
                found?.descrip?.trim() ||
                item.codigo;

              return {
                label: `Producto ${index + 1}`,
                value: `${productName} (${item.codigo}) × ${item.quantity}`,
              };
            }),
          ]}
          onConfirm={() => {
            if (isSubmitting) {
              return;
            }

            setIsSubmitting(true);

            createSale(pendingSale)
              .then(() => reloadSales())
              .then(() => reloadInventoryData())
              .then(() => {
                setPendingSale(null);
                resetForm();
                setShowSuccess(true);
              })
              .catch((error) => {
                setFormMessage(
                  error instanceof Error
                    ? error.message
                    : 'No se pudo registrar la venta.',
                );
                setPendingSale(null);
              })
              .finally(() => {
                setIsSubmitting(false);
              });
          }}
          onCancel={() => setPendingSale(null)}
        />
      ) : null}
    </AppLayout>
  );
}

export default Sales;
