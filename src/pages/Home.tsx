import type { CSSProperties } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Home() {
  const { products, movements } = useInventory();
  const { t } = useLanguage();
  const hasProducts = products.length > 0;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock <= product.minStock,
  );
  const outOfStock = products.filter((product) => product.stock === 0);
  const lowStockAvailable = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  );
  const availableProducts = products.filter(
    (product) => product.stock > product.minStock,
  );
  const salesCount = movements.filter((movement) => movement.type === 'Salida').length;
  const purchasesCount = movements.filter(
    (movement) => movement.type === 'Entrada',
  ).length;
  const availablePercentage = hasProducts
    ? Math.round((availableProducts.length / products.length) * 100)
    : 0;
  const reviewPercentage = hasProducts
    ? Math.round((lowStockAvailable.length / products.length) * 100)
    : 0;
  const outOfStockPercentage = hasProducts
    ? Math.round((outOfStock.length / products.length) * 100)
    : 0;
  const movementTotal = Math.max(purchasesCount + salesCount, 1);
  const purchasesPercentage = Math.round((purchasesCount / movementTotal) * 100);
  const salesPercentage = Math.round((salesCount / movementTotal) * 100);
  const stockChartStyle = {
    '--stock-ok': `${availablePercentage}%`,
    '--stock-review': `${availablePercentage + reviewPercentage}%`,
  } as CSSProperties;
  const purchasesBarStyle = {
    '--bar-value': `${purchasesPercentage}%`,
  } as CSSProperties;
  const salesBarStyle = {
    '--bar-value': `${salesPercentage}%`,
  } as CSSProperties;

  return (
    <AppLayout
      title={t('page.home.title')}
      description={t('page.home.description')}
    >
      <section className="dashboard-kpi-strip" aria-label={t('home.metricsLabel')}>
        <article className="metric-card compact-metric blue">
          <div className="metric-icon">ST</div>
          <span>{t('home.stockTotal')}</span>
          <strong>
            {hasProducts
              ? totalStock.toLocaleString('es-CL')
              : t('home.noData')}
          </strong>
          <p>{t('home.units')}</p>
        </article>

        <article className="metric-card compact-metric amber">
          <div className="metric-icon">AL</div>
          <span>{t('home.lowStock')}</span>
          <strong>
            {hasProducts
              ? lowStock.length.toLocaleString('es-CL')
              : t('home.noData')}
          </strong>
          <p>{t('home.products')}</p>
        </article>

        <article className="metric-card compact-metric green">
          <div className="metric-icon">CO</div>
          <span>{t('home.purchasesRegistered')}</span>
          <strong>{purchasesCount > 0 ? purchasesCount : t('home.noData')}</strong>
          <p>{t('home.movements')}</p>
        </article>

        <article className="metric-card compact-metric red">
          <div className="metric-icon">VE</div>
          <span>{t('home.salesRegistered')}</span>
          <strong>{salesCount > 0 ? salesCount : t('home.noData')}</strong>
          <p>{t('home.movements')}</p>
        </article>
      </section>

      <section className="dashboard-chart-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>{t('home.stockStatus')}</h2>
            <span>{products.length} {t('home.products')}</span>
          </div>

          <div className="stock-chart">
            <div
              className="donut-chart"
              aria-label={t('home.stockStatus')}
              style={stockChartStyle}
            >
              <div className="donut-content">
                <strong>{availablePercentage}%</strong>
                <span>{t('home.available')}</span>
              </div>
            </div>

            <div className="chart-legend">
              <div>
                <span className="legend-dot blue"></span>
                <strong>{availableProducts.length}</strong>
                <p>{t('home.available')}</p>
              </div>
              <div>
                <span className="legend-dot amber"></span>
                <strong>{lowStockAvailable.length}</strong>
                <p>{t('home.productsToReview')}</p>
              </div>
              <div>
                <span className="legend-dot red"></span>
                <strong>{outOfStock.length}</strong>
                <p>{t('home.outOfStock')}</p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>{t('home.operationalFlow')}</h2>
            <span>{movements.length} {t('home.movements')}</span>
          </div>

          <div className="bar-chart">
            <div className="bar-chart-row">
              <div>
                <strong>{t('home.purchasesRegistered')}</strong>
                <span>{purchasesCount}</span>
              </div>
              <div className="bar-chart-track">
                <span className="green" style={purchasesBarStyle}></span>
              </div>
            </div>

            <div className="bar-chart-row">
              <div>
                <strong>{t('home.salesRegistered')}</strong>
                <span>{salesCount}</span>
              </div>
              <div className="bar-chart-track">
                <span className="red" style={salesBarStyle}></span>
              </div>
            </div>

            <div className="flow-note">
              <strong>{reviewPercentage + outOfStockPercentage}%</strong>
              <span>{t('home.inventoryAttention')}</span>
            </div>
          </div>
        </article>
      </section>
    </AppLayout>
  );
}

export default Home;
