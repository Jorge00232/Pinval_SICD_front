import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { currencyFormatter, FAMILY_LABELS, type Product } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function requiresAdjustment(product: Product) {
  return product.dataIssue === 'STOCK_NEGATIVO';
}

<<<<<<< Updated upstream
function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
=======
function getStatus(product: Product, t: (key: string) => string) {
  const needsAdjustment = requiresAdjustment(product);
  const hasNoStock = !needsAdjustment && product.stock === 0;
  const needsRestock =
    !needsAdjustment && product.stock > 0 && product.stock <= product.minStock;

  if (needsAdjustment) {
    return { label: t('inventory.requiresAdjustment'), tone: 'danger' };
  }

  if (hasNoStock) {
    return { label: t('inventory.noStock'), tone: 'danger' };
  }

  if (needsRestock) {
    return { label: t('inventory.belowMinimum'), tone: 'warning' };
  }

  return { label: t('inventory.inRange'), tone: 'ok' };
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function parseMovementMonth(dateLabel: string) {
  const datePart = dateLabel.split(',')[0]?.trim();
  const parts = datePart?.split(/[/-]/).map((part) => Number(part));

  if (!parts || parts.length < 3 || parts.some((part) => !Number.isFinite(part))) {
    return '';
  }

  const [, month, year] = parts;

  if (!month || !year) {
    return '';
  }

  return `${year}-${String(month).padStart(2, '0')}`;
>>>>>>> Stashed changes
}

function Inventory() {
  const { movements, products } = useInventory();
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const hasProducts = products.length > 0;

  const inventoryProducts = useMemo(
    () => products.filter((product) => !requiresAdjustment(product) && product.stock > 0),
    [products],
  );
  const totalStock = inventoryProducts.reduce((sum, product) => sum + product.stock, 0);
  const totalValCosto = inventoryProducts.reduce(
    (sum, product) => sum + product.stock * product.prcosto,
    0,
  );
  const productsToReview = products.filter(
    (product) => requiresAdjustment(product) || product.stock <= product.minStock,
  );
  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const priorityA = requiresAdjustment(a) || a.stock <= a.minStock ? 0 : 1;
        const priorityB = requiresAdjustment(b) || b.stock <= b.minStock ? 0 : 1;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return a.descrip.localeCompare(b.descrip);
      }),
    [products],
  );
  const productByName = useMemo(
    () => new Map(products.map((product) => [product.descrip, product])),
    [products],
  );
  const periodMovements = movements.filter(
    (movement) => parseMovementMonth(movement.date) === selectedMonth,
  );
  const periodStats = periodMovements.reduce(
    (totals, movement) => {
      const product = productByName.get(movement.product);

      if (!product) {
        return totals;
      }

      if (movement.type === 'Entrada') {
        totals.purchaseCost += movement.quantity * product.prcosto;
      }

      if (movement.type === 'Salida') {
        totals.saleRevenue += movement.quantity * product.prventa;
        totals.saleCost += movement.quantity * product.prcosto;
      }

      return totals;
    },
    { purchaseCost: 0, saleCost: 0, saleRevenue: 0 },
  );
  const estimatedMargin = periodStats.saleRevenue - periodStats.saleCost;

  return (
    <AppLayout
      title={t('page.inventory.title')}
      description={t('page.inventory.description')}
    >
      <section className="dashboard-kpi-strip">
        <article className="metric-card compact-metric blue">
          <span className="metric-icon">ST</span>
          <span>{t('inventory.currentStock')}</span>
          <strong>{hasProducts ? totalStock.toLocaleString('es-CL') : t('home.noData')}</strong>
          <p>{t('home.units')}</p>
        </article>
        <article className="metric-card compact-metric amber">
          <span className="metric-icon">RE</span>
          <span>{t('inventory.lowStockProducts')}</span>
          <strong>{hasProducts ? productsToReview.length : t('home.noData')}</strong>
          <p>{t('home.products')}</p>
        </article>
        <article className="metric-card compact-metric green">
          <span className="metric-icon">CO</span>
          <span>{t('inventory.availableCost')}</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValCosto) : t('home.noData')}</strong>
          <p>{t('inventory.availableCostDescription')}</p>
        </article>
        <article className="metric-card compact-metric red">
          <span className="metric-icon">MO</span>
          <span>{t('inventory.movementsPeriod')}</span>
          <strong>{periodMovements.length}</strong>
          <p>{t('home.movements')}</p>
        </article>
      </section>

      <section className="panel inventory-period-panel">
        <div className="panel-heading">
          <h2>{t('inventory.periodSummary')}</h2>
          <label className="inline-month-filter">
            {t('inventory.period')}
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
        </div>
        <div className="period-summary-grid">
          <div>
            <span>{t('inventory.purchaseCostPeriod')}</span>
            <strong>{currencyFormatter.format(periodStats.purchaseCost)}</strong>
          </div>
          <div>
            <span>{t('inventory.salesPeriod')}</span>
            <strong>{currencyFormatter.format(periodStats.saleRevenue)}</strong>
          </div>
          <div>
            <span>{t('inventory.estimatedMargin')}</span>
            <strong>{currencyFormatter.format(estimatedMargin)}</strong>
          </div>
        </div>
        <p className="panel-note">{t('inventory.periodNote')}</p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('inventory.stockByProduct')}</h2>
          <span>{products.length} {t('products.productsCount')}</span>
        </div>
<<<<<<< Updated upstream
        <div className="table-wrap inventory-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('inventory.code')}</th>
                <th>{t('inventory.description')}</th>
                <th>{t('inventory.family')}</th>
                <th>{t('inventory.currentStock')}</th>
                <th>{t('inventory.minimumStock')}</th>
                <th>{t('inventory.fecha')}</th>
                <th>{t('inventory.status')}</th>
                <th>{t('inventory.costPrice')}</th>
                <th>{t('inventory.costValue')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const needsAdjustment = requiresAdjustment(product);
                  const hasNoStock = !needsAdjustment && product.stock === 0;
                  const needsRestock =
                    !needsAdjustment && product.stock > 0 && product.stock <= product.minStock;
                  const sbtot = product.stock * product.prcosto;
                  const statusLabel = needsAdjustment
                    ? t('inventory.requiresAdjustment')
                    : hasNoStock
                      ? t('inventory.noStock')
                      : needsRestock
                        ? t('inventory.belowMinimum')
                        : t('inventory.inRange');

                  return (
                    <tr key={product.codigo}>
                      <td className="inventory-code-cell">{product.codigo}</td>
                      <td className="inventory-description-cell">{product.descrip}</td>
                      <td className="inventory-family-cell">
                        {FAMILY_LABELS[product.familia] ?? product.familia}
                      </td>
                      <td className="numeric-cell">
                        {product.stock}
                        {needsAdjustment ? (
                          <span className="stock-note">
                            {t('inventory.originalStock')}: {product.stockOriginal}
                          </span>
                        ) : null}
                      </td>
                      <td className="numeric-cell">{product.minStock}</td>
                      <td>{formatDate(product.fecha)}</td>
                      <td>
                        <span
                          className={`status ${
                            needsAdjustment || hasNoStock || needsRestock ? 'danger' : 'ok'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="numeric-cell">{currencyFormatter.format(product.prcosto)}</td>
                      <td className="numeric-cell">{currencyFormatter.format(sbtot)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9}>{t('inventory.noProducts')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
=======
        {sortedProducts.length > 0 ? (
          <div className="inventory-list">
            {sortedProducts.slice(0, 12).map((product) => {
              const status = getStatus(product, t);
              const family = FAMILY_LABELS[product.familia] ?? product.familia;
              const costValue = Math.max(product.stock, 0) * product.prcosto;

              return (
                <article className="inventory-list-card" key={product.codigo}>
                  <div className="inventory-list-main">
                    <strong>{product.descrip}</strong>
                    <span>{product.codigo} · {family}</span>
                  </div>
                  <div className="inventory-list-stock">
                    <strong>{product.stock.toLocaleString('es-CL')}</strong>
                    <span>{t('home.units')}</span>
                    {requiresAdjustment(product) ? (
                      <small>
                        {t('inventory.originalStock')}: {product.stockOriginal}
                      </small>
                    ) : null}
                  </div>
                  <span className={`status ${status.tone}`}>{status.label}</span>
                  <details className="row-details">
                    <summary>{t('inventory.viewDetail')}</summary>
                    <div>
                      <span>{t('inventory.minimumStock')}: {product.minStock}</span>
                      <span>{t('inventory.costPrice')}: {currencyFormatter.format(product.prcosto)}</span>
                      <span>{t('products.salePrice')}: {currencyFormatter.format(product.prventa)}</span>
                      <span>{t('inventory.costValue')}: {currencyFormatter.format(costValue)}</span>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">{t('inventory.noProducts')}</div>
        )}
>>>>>>> Stashed changes
      </section>
    </AppLayout>
  );
}

export default Inventory;
