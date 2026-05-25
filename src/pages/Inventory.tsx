import AppLayout from '../components/AppLayout';
import { currencyFormatter, FAMILY_LABELS, type Product } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function requiresAdjustment(product: Product) {
  return product.dataIssue === 'STOCK_NEGATIVO';
}

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
}

function Inventory() {
  const { products } = useInventory();
  const { t } = useLanguage();
  const hasProducts = products.length > 0;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValCosto = products.reduce((sum, p) => sum + p.stock * p.prcosto, 0);
  const totalValVenta = products.reduce((sum, p) => sum + p.stock * p.prventa, 0);
  const productsToReview = products.filter(
    (p) => requiresAdjustment(p) || p.stock <= p.minStock,
  );

  return (
    <AppLayout
      title={t('page.inventory.title')}
      description={t('page.inventory.description')}
    >
      <section className="metric-grid compact inventory-metric-grid">
        <article className="metric-card">
          <span>{t('inventory.currentStock')}</span>
          <strong>{hasProducts ? totalStock.toLocaleString('es-CL') : t('home.noData')}</strong>
          <p>{t('inventory.currentStockDescription')}</p>
        </article>
        <article className="metric-card warning">
          <span>{t('inventory.lowStockProducts')}</span>
          <strong>{hasProducts ? productsToReview.length : t('home.noData')}</strong>
          <p>{t('inventory.lowStockDescription')}</p>
        </article>
        <article className="metric-card">
          <span>{t('inventory.totalCost')}</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValCosto) : t('home.noData')}</strong>
          <p>{t('inventory.totalCostDescription')}</p>
        </article>
        <article className="metric-card">
          <span>{t('inventory.estimatedSaleValue')}</span>
          <strong>{hasProducts ? currencyFormatter.format(totalValVenta) : t('home.noData')}</strong>
          <p>{t('inventory.estimatedSaleDescription')}</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('inventory.stockByProduct')}</h2>
          <span>{t('inventory.updatedToday')}</span>
        </div>
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
      </section>
    </AppLayout>
  );
}

export default Inventory;
