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
  const salesCount = movements.filter((movement) => movement.type === 'Salida').length;
  const purchasesCount = movements.filter(
    (movement) => movement.type === 'Entrada',
  ).length;
  const recentMovements = movements.slice(0, 5);

  const formatMetricValue = (value: number, suffixKey: string) =>
    `${value} ${t(suffixKey)}`;

  const getMovementSummary = (type: string, quantity: number) => {
    const movementKey =
      type === 'Entrada' ? 'home.entryMovement' : 'home.exitMovement';

    return `${t(movementKey)} ${quantity} ${t('home.units')}`;
  };

  return (
    <AppLayout
      title={t('page.home.title')}
      description={t('page.home.description')}
    >
      <section className="metric-grid" aria-label={t('home.metricsLabel')}>
        <article className="metric-card">
          <span>{t('home.stockTotal')}</span>
          <strong>
            {hasProducts
              ? formatMetricValue(totalStock, 'home.units')
              : t('home.noData')}
          </strong>
          <p>{t('home.stockTotalDescription')}</p>
        </article>

        <article className="metric-card warning">
          <span>{t('home.lowStock')}</span>
          <strong>
            {hasProducts
              ? formatMetricValue(lowStock.length, 'home.products')
              : t('home.noData')}
          </strong>
          <p>{t('home.lowStockDescription')}</p>
        </article>

        <article className="metric-card success">
          <span>{t('home.purchasesRegistered')}</span>
          <strong>{purchasesCount > 0 ? purchasesCount : t('home.noData')}</strong>
          <p>{t('home.purchasesDescription')}</p>
        </article>

        <article className="metric-card accent">
          <span>{t('home.salesRegistered')}</span>
          <strong>{salesCount > 0 ? salesCount : t('home.noData')}</strong>
          <p>{t('home.salesDescription')}</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>{t('home.recentActivity')}</h2>
            <span>{formatMetricValue(movements.length, 'home.movements')}</span>
          </div>

          <div className="timeline">
            {recentMovements.length > 0 ? (
              recentMovements.map((movement) => (
                <div key={movement.id}>
                  <strong>{movement.product}</strong>
                  <p>{getMovementSummary(movement.type, movement.quantity)}</p>
                  <p>{movement.detail}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">{t('home.noMovements')}</div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('home.systemStatus')}</h2>
            <span>{t('home.operationalView')}</span>
          </div>

          <ul className="check-list">
            <li>{t('home.systemStatusItem1')}</li>
            <li>{t('home.systemStatusItem2')}</li>
            <li>{t('home.systemStatusItem3')}</li>
            <li>{t('home.systemStatusItem4')}</li>
          </ul>
        </article>
      </section>
    </AppLayout>
  );
}

export default Home;
