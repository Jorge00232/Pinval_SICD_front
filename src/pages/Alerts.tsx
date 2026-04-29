import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Alerts() {
  const { products } = useInventory();
  const { t } = useLanguage();
  const lowStock = products
    .filter((product) => product.stock <= product.minStock)
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) {
        return -1;
      }

      if (b.stock === 0 && a.stock > 0) {
        return 1;
      }

      return a.stock - b.stock;
    });
  const criticalAlerts = lowStock.filter((product) => product.stock === 0);
  const warningAlerts = lowStock.filter((product) => product.stock > 0);

  return (
    <AppLayout
      title={t('page.alerts.title')}
      description={t('page.alerts.description')}
    >
      <section className="alerts-strip" aria-label={t('alerts.summaryLabel')}>
        <div className="alerts-strip-header">
          <strong>{t('alerts.title')}</strong>
          <span>{lowStock.length} {t('alerts.active')}</span>
        </div>

        <div className="alerts-summary-list single-row">
          <div>
            <strong>{criticalAlerts.length}</strong>
            <span>{t('alerts.noStock')}</span>
          </div>
          <div>
            <strong>{warningAlerts.length}</strong>
            <span>{t('alerts.restock')}</span>
          </div>
          <div>
            <strong>{lowStock.length > 0 ? t('alerts.review') : t('alerts.noPending')}</strong>
            <span>{t('alerts.state')}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('alerts.productsToReview')}</h2>
          <span>{lowStock.length} {t('alerts.products')}</span>
        </div>

        <div className="table-wrap alerts-table-wrap">
          {lowStock.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>{t('alerts.priority')}</th>
                  <th>{t('alerts.product')}</th>
                  <th>{t('alerts.code')}</th>
                  <th>{t('alerts.currentStock')}</th>
                  <th>{t('alerts.minimumStock')}</th>
                  <th>{t('alerts.status')}</th>
                  <th>{t('alerts.action')}</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((product) => {
                  const isCritical = product.stock === 0;

                  return (
                    <tr key={product.codigo}>
                      <td>
                        <span className={`status ${isCritical ? 'danger' : 'ok'}`}>
                          {isCritical ? t('alerts.high') : t('alerts.medium')}
                        </span>
                      </td>
                      <td className="alerts-product-cell">{product.descrip}</td>
                      <td className="code-cell">{product.codigo}</td>
                      <td>{product.stock}</td>
                      <td>{product.minStock}</td>
                      <td>{isCritical ? t('alerts.noStock') : t('alerts.belowMinimum')}</td>
                      <td>
                        <div className="table-actions">
                          <Link to="/inventory" className="ghost-button alert-action-link">
                            {t('alerts.inventoryAction')}
                          </Link>
                          <Link to="/purchases" className="secondary-action">
                            {t('alerts.buyAction')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{t('alerts.noActive')}</div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

export default Alerts;
