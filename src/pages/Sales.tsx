import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

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

function Sales() {
  const { customers, movements, products, recordSale } = useInventory();
  const { t } = useLanguage();
  const canRegisterSale = products.length > 0;
  const saleMovements = movements.filter((movement) => movement.type === 'Salida');
  const [customerName, setCustomerName] = useState('B2C');
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [documentType, setDocumentType] = useState('Boleta');
  const [documentNumber, setDocumentNumber] = useState('');
  const [items, setItems] = useState<SaleLine[]>([createSaleLine()]);

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
      <section className="purchase-layout">
        <article className="panel purchase-form-panel">
          <div className="panel-heading">
            <h2>{t('sales.registerSale')}</h2>
            <span className="purchase-counter">
              {saleMovements.length} {t('sales.linesRegistered')}
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

            <div className="purchase-items">
              {items.map((item, index) => (
                <div key={item.id} className="purchase-item-row">
                  <label>
                    {`${t('sales.product')} ${index + 1}`}
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
                        <option value="">{t('sales.noProducts')}</option>
                      )}
                    </select>
                  </label>

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
                  setItems((current) => [
                    ...current,
                    createSaleLine(products[0]?.codigo ?? ''),
                  ])
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

        <article className="panel purchase-history-panel">
          <div className="panel-heading">
            <h2>{t('sales.registeredSales')}</h2>
            <span className="purchase-counter">
              {saleMovements.length} {t('purchases.records')}
            </span>
          </div>

          <div className="table-wrap purchase-history-wrap">
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
                        : t('sales.addProductsFirst')}
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
