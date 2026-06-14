import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';
import type { Product } from '../data/mockData';

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
  onChange: (codigo: string) => void;
};

function createSaleLine(codigo = ''): SaleLine {
  return {
    id: crypto.randomUUID(),
    codigo,
    quantity: 1,
  };
}

function getProductDisplayName(product: Product) {
  return product.displayName?.trim() || product.descrip?.trim() || 'Producto sin nombre';
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

function parseSaleDetail(detail: string) {
  const [documentPart, metadataPart = ''] = detail.split(' - ');
  const metadataSections = metadataPart.split(' | ');
  const customer = metadataSections[0] || '-';
  const typeSection = metadataSections.find((section) =>
    section.startsWith('Tipo: '),
  );
  const identifierSection = metadataSections.find((section) =>
    section.startsWith('Id: '),
  );

  return {
    document: documentPart,
    customer,
    customerType: typeSection?.replace('Tipo: ', '') ?? '-',
    identifier: identifierSection?.replace('Id: ', '') ?? '-',
  };
}

function ProductSearchSelect({
  label,
  products,
  value,
  disabled = false,
  noProductsText,
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

          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
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
          placeholder={
            products.length > 0
              ? 'Buscar producto por nombre o código...'
              : noProductsText
          }
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
                    Código {product.codigo} · Stock {product.stock.toLocaleString('es-CL')}
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
  const { customers, movements, products, recordSale } = useInventory();
  const { t } = useLanguage();
  const canRegister = canManageData();
  const canRegisterSale = canRegister && products.length > 0;
  const saleMovements = movements.filter((movement) => movement.type === 'Salida');

  const [customerName, setCustomerName] = useState('B2C');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [documentType, setDocumentType] = useState('Boleta');
  const [documentNumber, setDocumentNumber] = useState('');
  const [items, setItems] = useState<SaleLine[]>([createSaleLine()]);
  const [formMessage, setFormMessage] = useState('');

  const genericCustomerOptions = useMemo(() => ['B2C', 'B2B'], []);

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
      title={t('page.sales.title')}
      description={t('page.sales.description')}
    >
      <section className="sales-layout">
        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>{t('sales.registeredSales')}</h2>
            <span className="purchase-counter">
              {saleMovements.length} {t('purchases.records')}
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
                {saleMovements.length} {t('sales.linesRegistered')}
              </strong>
            </summary>

            <article className="panel purchase-form-panel sales-form-panel">
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
                    (item) => !Number.isFinite(item.quantity) || item.quantity <= 0,
                  );

                  if (hasProductWithoutSelection) {
                    setFormMessage('Debes seleccionar un producto válido en cada línea.');
                    return;
                  }

                  if (hasInvalidQuantity) {
                    setFormMessage('La cantidad debe ser mayor a 0 en cada producto.');
                    return;
                  }

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
                  setItems([createSaleLine()]);
                  setFormMessage('');
                }}
              >
                <div className="grid-form purchase-header-grid">
                  <label>
                    {t('sales.customerOrType')}
                    <select
                      value={selectedCustomer}
                      onChange={(event) => setCustomerName(event.target.value)}
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

                  <label className="purchase-document-field">
                    {t('sales.identifier')}
                    <input
                      value={customerIdentifier}
                      onChange={(event) => setCustomerIdentifier(event.target.value)}
                      placeholder={
                        selectedRegisteredCustomer?.identifier ||
                        selectedRegisteredCustomer?.contact ||
                        t('sales.identifierPlaceholder')
                      }
                      maxLength={60}
                    />
                  </label>

                  <label className="purchase-document-field">
                    {t('sales.documentNumber')}
                    <input
                      value={documentNumber}
                      onChange={(event) => setDocumentNumber(event.target.value)}
                      placeholder={t('sales.documentPlaceholder')}
                      maxLength={40}
                      required
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
                    disabled={!canRegisterSale}
                  >
                    {t('sales.saveSale')}
                  </button>
                </div>
              </form>
            </article>
          </details>
        ) : null}
      </section>
    </AppLayout>
  );
}

export default Sales;