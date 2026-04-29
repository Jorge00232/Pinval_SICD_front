import AppLayout from '../components/AppLayout';
import { currencyFormatter, FAMILY_LABELS } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Inventory() {
  const { products } = useInventory();
  const { t } = useLanguage();
  const hasProducts = products.length > 0;

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValCosto = products.reduce((sum, p) => sum + p.stock * p.prcosto, 0);
  const totalValVenta = products.reduce((sum, p) => sum + p.stock * p.prventa, 0);
  const lowStock = products.filter((p) => p.stock <= p.minStock);

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
          <strong>{hasProducts ? lowStock.length : t('home.noData')}</strong>
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
                <th>{t('inventory.status')}</th>
                <th>{t('inventory.costPrice')}</th>
                <th>{t('inventory.costValue')}</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const needsRestock = product.stock <= product.minStock;
                  const sbtot = product.stock * product.prcosto;

                  return (
                    <tr key={product.codigo}>
                      <td className="inventory-code-cell">{product.codigo}</td>
                      <td className="inventory-description-cell">{product.descrip}</td>
                      <td className="inventory-family-cell">
                        {FAMILY_LABELS[product.familia] ?? product.familia}
                      </td>
                      <td className="numeric-cell">{product.stock}</td>
                      <td className="numeric-cell">{product.minStock}</td>
                      <td>
                        <span className={`status ${needsRestock ? 'danger' : 'ok'}`}>
                          {needsRestock ? t('inventory.belowMinimum') : t('inventory.inRange')}
                        </span>
                      </td>
                      <td className="numeric-cell">{currencyFormatter.format(product.prcosto)}</td>
                      <td className="numeric-cell">{currencyFormatter.format(sbtot)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8}>{t('inventory.noProducts')}</td>
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
