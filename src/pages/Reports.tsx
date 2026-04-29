import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { FAMILY_LABELS, currencyFormatter } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

type ReportType = 'general' | 'sales' | 'purchases' | 'inventory' | 'customers';
type StockFilter = 'all' | 'low' | 'out';
type CustomerFilter = 'all' | 'B2B' | 'B2C';

type ParsedSale = {
  documentType: string;
  documentNumber: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  identifier: string;
};

type ParsedPurchase = {
  documentNumber: string;
  supplierName: string;
};

function parseSaleDetail(detail: string): ParsedSale {
  const [
    documentSection = '',
    customerSection = '',
    typeSection = '',
    identifierSection = '',
  ] = detail.split('|').map((part) => part.trim());
  const documentTokens = documentSection.split(' ').filter(Boolean);
  const documentType = documentTokens[0] ?? 'Document';
  const documentNumber = documentTokens.slice(1).join(' ') || '-';
  const customerName = customerSection.split(' - ').slice(1).join(' - ') || '-';
  const customerTypeText = typeSection.replace('Tipo:', '').trim();
  const identifier = identifierSection.replace('Id:', '').trim();

  return {
    documentType,
    documentNumber,
    customerName,
    customerType: customerTypeText === 'B2C' ? 'B2C' : 'B2B',
    identifier,
  };
}

function parsePurchaseDetail(detail: string): ParsedPurchase {
  const purchaseText = detail.replace('Factura', '').trim();
  const [documentNumber = '-', supplierName = '-'] = purchaseText.split(' - ');

  return {
    documentNumber: documentNumber.trim() || '-',
    supplierName: supplierName.trim() || '-',
  };
}

function Reports() {
  const { movements, products, customers, suppliers } = useInventory();
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>('general');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');

  const saleMovements = useMemo(
    () => movements.filter((movement) => movement.type === 'Salida'),
    [movements],
  );
  const purchaseMovements = useMemo(
    () => movements.filter((movement) => movement.type === 'Entrada'),
    [movements],
  );
  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= product.minStock),
    [products],
  );

  const salesRows = useMemo(
    () =>
      saleMovements.map((movement) => {
        const detail = parseSaleDetail(movement.detail);

        return {
          ...movement,
          ...detail,
        };
      }),
    [saleMovements],
  );

  const purchaseRows = useMemo(
    () =>
      purchaseMovements.map((movement) => {
        const detail = parsePurchaseDetail(movement.detail);

        return {
          ...movement,
          ...detail,
        };
      }),
    [purchaseMovements],
  );

  const filteredSalesRows = useMemo(() => {
    if (customerFilter === 'all') {
      return salesRows;
    }

    return salesRows.filter((row) => row.customerType === customerFilter);
  }, [customerFilter, salesRows]);

  const filteredInventoryRows = useMemo(() => {
    if (stockFilter === 'low') {
      return products.filter(
        (product) => product.stock > 0 && product.stock <= product.minStock,
      );
    }

    if (stockFilter === 'out') {
      return products.filter((product) => product.stock === 0);
    }

    return products;
  }, [products, stockFilter]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        customerFilter === 'all'
          ? true
          : customer.customerType === customerFilter,
      ),
    [customerFilter, customers],
  );

  const totalStockCost = products.reduce(
    (total, product) => total + product.stock * product.prcosto,
    0,
  );
  const totalStockSale = products.reduce(
    (total, product) => total + product.stock * product.prventa,
    0,
  );
  const totalUnitsSold = filteredSalesRows.reduce(
    (total, movement) => total + movement.quantity,
    0,
  );
  const totalUnitsPurchased = purchaseRows.reduce(
    (total, movement) => total + movement.quantity,
    0,
  );
  const uniqueSaleCustomers = new Set(
    filteredSalesRows.map((movement) => movement.customerName),
  ).size;
  const uniqueSuppliers = new Set(
    purchaseRows.map((movement) => movement.supplierName),
  ).size;
  const reportLabel =
    {
      general: t('reports.general'),
      sales: t('reports.sales'),
      purchases: t('reports.purchases'),
      inventory: t('reports.inventory'),
      customers: t('reports.customers'),
    }[reportType] ?? t('reports.general');

  return (
    <AppLayout
      title={t('page.reports.title')}
      description={t('page.reports.description')}
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('reports.config')}</h2>
          <span>{reportLabel}</span>
        </div>

        <div className="grid-form reports-filter-grid">
          <label>
            {t('reports.reportType')}
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value as ReportType)}
            >
              <option value="general">{t('reports.general')}</option>
              <option value="sales">{t('reports.sales')}</option>
              <option value="purchases">{t('reports.purchases')}</option>
              <option value="inventory">{t('reports.inventory')}</option>
              <option value="customers">{t('reports.customers')}</option>
            </select>
          </label>

          {reportType === 'inventory' ? (
            <label>
              {t('reports.stockStatus')}
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              >
                <option value="all">{t('reports.fullInventory')}</option>
                <option value="low">{t('reports.restockOnly')}</option>
                <option value="out">{t('reports.outOfStockOnly')}</option>
              </select>
            </label>
          ) : null}

          {reportType === 'sales' || reportType === 'customers' ? (
            <label>
              {t('reports.customerType')}
              <select
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value as CustomerFilter)}
              >
                <option value="all">{t('reports.all')}</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {reportType === 'general' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>{t('reports.productsRegistered')}</span>
              <strong>{products.length || t('home.noData')}</strong>
              <p>{t('reports.totalProducts')}</p>
            </article>
            <article className="metric-card accent">
              <span>{t('reports.salesRegistered')}</span>
              <strong>{saleMovements.length || t('home.noData')}</strong>
              <p>{t('reports.totalSales')}</p>
            </article>
            <article className="metric-card warning">
              <span>{t('reports.purchasesRegistered')}</span>
              <strong>{purchaseMovements.length || t('home.noData')}</strong>
              <p>{t('reports.totalPurchases')}</p>
            </article>
            <article className="metric-card">
              <span>{t('reports.activeAlerts')}</span>
              <strong>{lowStockProducts.length || t('home.noData')}</strong>
              <p>{t('reports.stockReview')}</p>
            </article>
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-heading">
                <h2>{t('reports.inventorySummary')}</h2>
                <span>{products.length} {t('alerts.products')}</span>
              </div>
              <div className="reports-kpi-list">
                <div>
                  <strong>{currencyFormatter.format(totalStockCost)}</strong>
                  <span>{t('reports.totalStockCost')}</span>
                </div>
                <div>
                  <strong>{currencyFormatter.format(totalStockSale)}</strong>
                  <span>{t('reports.approxSaleValue')}</span>
                </div>
                <div>
                  <strong>{lowStockProducts.length}</strong>
                  <span>{t('reports.productsToReview')}</span>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h2>{t('reports.activity')}</h2>
                <span>{movements.length} {t('home.movements')}</span>
              </div>
              <div className="reports-kpi-list">
                <div>
                  <strong>{totalUnitsPurchased}</strong>
                  <span>{t('reports.unitsEntered')}</span>
                </div>
                <div>
                  <strong>{totalUnitsSold}</strong>
                  <span>{t('reports.unitsSold')}</span>
                </div>
                <div>
                  <strong>{customers.length}</strong>
                  <span>{t('reports.customersRegistered')}</span>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}

      {reportType === 'sales' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>{t('reports.salesRegistered')}</span>
              <strong>{filteredSalesRows.length || t('home.noData')}</strong>
              <p>{t('reports.salesFound')}</p>
            </article>
            <article className="metric-card accent">
              <span>{t('reports.unitsSold')}</span>
              <strong>{totalUnitsSold || t('home.noData')}</strong>
              <p>{t('reports.unitsSoldTotal')}</p>
            </article>
            <article className="metric-card">
              <span>{t('reports.servedCustomers')}</span>
              <strong>{uniqueSaleCustomers || t('home.noData')}</strong>
              <p>{t('reports.distinctCustomers')}</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>{t('reports.salesDetail')}</h2>
              <span>{filteredSalesRows.length} {t('purchases.records')}</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {filteredSalesRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>{t('purchases.date')}</th>
                      <th>{t('sales.product')}</th>
                      <th>{t('sales.quantity')}</th>
                      <th>{t('page.customers.title')}</th>
                      <th>{t('customers.type')}</th>
                      <th>{t('sales.document')}</th>
                      <th>{t('sales.identifier')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesRows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td className="reports-primary-cell">{movement.product}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.customerName}</td>
                        <td>{movement.customerType}</td>
                        <td>{`${movement.documentType} ${movement.documentNumber}`}</td>
                        <td>{movement.identifier || t('reports.noValue')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">{t('reports.noSalesForFilter')}</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'purchases' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card warning">
              <span>{t('reports.purchasesRegistered')}</span>
              <strong>{purchaseRows.length || t('home.noData')}</strong>
              <p>{t('reports.purchasesFound')}</p>
            </article>
            <article className="metric-card success">
              <span>{t('reports.unitsEntered')}</span>
              <strong>{totalUnitsPurchased || t('home.noData')}</strong>
              <p>{t('reports.totalPurchasedUnits')}</p>
            </article>
            <article className="metric-card">
              <span>{t('reports.suppliersUsed')}</span>
              <strong>{uniqueSuppliers || t('home.noData')}</strong>
              <p>{t('reports.distinctSuppliers')}</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>{t('reports.purchasesDetail')}</h2>
              <span>{purchaseRows.length} {t('purchases.records')}</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {purchaseRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>{t('purchases.date')}</th>
                      <th>{t('purchases.product')}</th>
                      <th>{t('purchases.quantity')}</th>
                      <th>{t('purchases.supplier')}</th>
                      <th>{t('sales.invoice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td className="reports-primary-cell">{movement.product}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.supplierName}</td>
                        <td>{movement.documentNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">{t('reports.noPurchasesYet')}</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'inventory' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card">
              <span>{t('reports.productsShown')}</span>
              <strong>{filteredInventoryRows.length || t('home.noData')}</strong>
              <p>{t('reports.matchesFilter')}</p>
            </article>
            <article className="metric-card warning">
              <span>{t('alerts.restock')}</span>
              <strong>
                {lowStockProducts.filter((product) => product.stock > 0).length || t('home.noData')}
              </strong>
              <p>{t('reports.lowButAvailable')}</p>
            </article>
            <article className="metric-card accent">
              <span>{t('reports.outOfStock')}</span>
              <strong>
                {lowStockProducts.filter((product) => product.stock === 0).length || t('home.noData')}
              </strong>
              <p>{t('reports.noUnitsAvailable')}</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>{t('reports.inventoryDetail')}</h2>
              <span>{filteredInventoryRows.length} {t('alerts.products')}</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {filteredInventoryRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>{t('inventory.code')}</th>
                      <th>{t('inventory.description')}</th>
                      <th>{t('inventory.family')}</th>
                      <th>{t('products.stock')}</th>
                      <th>{t('products.minimumStock')}</th>
                      <th>{t('inventory.costPrice')}</th>
                      <th>{t('products.salePrice')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventoryRows.map((product) => (
                      <tr key={product.codigo}>
                        <td className="code-cell">{product.codigo}</td>
                        <td className="reports-primary-cell">{product.descrip}</td>
                        <td>{FAMILY_LABELS[product.familia] ?? product.familia}</td>
                        <td>{product.stock}</td>
                        <td>{product.minStock}</td>
                        <td>{currencyFormatter.format(product.prcosto)}</td>
                        <td>{currencyFormatter.format(product.prventa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">{t('reports.noProductsForFilter')}</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'customers' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>{t('reports.customersRegistered')}</span>
              <strong>{customers.length || t('home.noData')}</strong>
              <p>{t('reports.customersStored')}</p>
            </article>
            <article className="metric-card">
              <span>{t('reports.businessCustomers')}</span>
              <strong>
                {customers.filter((customer) => customer.customerType === 'B2B').length || t('home.noData')}
              </strong>
              <p>{t('reports.currentBusinessCustomers')}</p>
            </article>
            <article className="metric-card accent">
              <span>{t('reports.endCustomers')}</span>
              <strong>
                {customers.filter((customer) => customer.customerType === 'B2C').length || t('home.noData')}
              </strong>
              <p>{t('reports.currentEndCustomers')}</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>{t('reports.customersDetail')}</h2>
              <span>{customers.length} {t('page.customers.title').toLowerCase()}</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {filteredCustomers.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>{t('page.customers.title')}</th>
                      <th>{t('customers.type')}</th>
                      <th>{t('customers.identifier')}</th>
                      <th>{t('customers.contact')}</th>
                      <th>{t('customers.lastPurchase')}</th>
                      <th>{t('customers.purchases')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.name}>
                        <td className="reports-primary-cell">{customer.name}</td>
                        <td>{customer.customerType}</td>
                        <td>{customer.identifier || t('reports.noValue')}</td>
                        <td>{customer.contact || t('reports.noValue')}</td>
                        <td>{customer.lastPurchase}</td>
                        <td>{customer.purchases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">{t('reports.noCustomersForFilter')}</div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('reports.currentDatabaseState')}</h2>
          <span>{t('reports.availableData')}</span>
        </div>
        <ul className="check-list">
          <li>{t('reports.productsRegistered')}: {products.length}</li>
          <li>{t('page.suppliers.title')}: {suppliers.length}</li>
          <li>{t('page.customers.title')}: {customers.length}</li>
          <li>{t('nav.movements')}: {movements.length}</li>
        </ul>
      </section>
    </AppLayout>
  );
}

export default Reports;
