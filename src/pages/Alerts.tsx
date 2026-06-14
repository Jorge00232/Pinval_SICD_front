import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import type { Product } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

type AlertStatus = 'requiresAdjustment' | 'noStock' | 'belowMinimum';

type AlertProduct = Product & {
  alertStatus: AlertStatus;
  alertPriority: 'high' | 'medium';
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getProductDisplayName(product: Product) {
  return product.displayName?.trim() || product.descrip?.trim() || 'Producto sin nombre';
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

function getAlertInfo(product: Product): Pick<AlertProduct, 'alertStatus' | 'alertPriority'> | null {
  const currentStock = toNumber(product.stock);
  const minimumStock = toNumber(product.minStock);
  const originalStock = toNumber(product.stockOriginal);

  /*
    Regla principal:
    Si el stock actual ya supera el mínimo, el producto NO debe aparecer en Alertas,
    aunque antes haya tenido stock bajo, stock negativo o stockOriginal distinto.
  */
  if (currentStock > minimumStock) {
    return null;
  }

  if (originalStock < 0 || product.dataIssue === 'STOCK_NEGATIVO') {
    return {
      alertStatus: 'requiresAdjustment',
      alertPriority: 'high',
    };
  }

  if (currentStock <= 0) {
    return {
      alertStatus: 'noStock',
      alertPriority: 'high',
    };
  }

  if (currentStock <= minimumStock) {
    return {
      alertStatus: 'belowMinimum',
      alertPriority: 'medium',
    };
  }

  return null;
}

function Alerts() {
  const { products } = useInventory();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const alerts = useMemo<AlertProduct[]>(() => {
    return products
      .map((product) => {
        const alertInfo = getAlertInfo(product);

        if (!alertInfo) {
          return null;
        }

        return {
          ...product,
          ...alertInfo,
        };
      })
      .filter((product): product is AlertProduct => product !== null)
      .sort((a, b) => {
        if (a.alertPriority !== b.alertPriority) {
          return a.alertPriority === 'high' ? -1 : 1;
        }

        return toNumber(a.stock) - toNumber(b.stock);
      });
  }, [products]);

  const adjustmentAlerts = useMemo(
    () => alerts.filter((product) => product.alertStatus === 'requiresAdjustment'),
    [alerts],
  );

  const criticalAlerts = useMemo(
    () => alerts.filter((product) => product.alertStatus === 'noStock'),
    [alerts],
  );

  const warningAlerts = useMemo(
    () => alerts.filter((product) => product.alertStatus === 'belowMinimum'),
    [alerts],
  );

  const filteredAlerts = useMemo(() => {
    const query = normalizeSearchText(searchTerm);

    return alerts.filter((product) => {
      const matchesSearch = !query || getProductSearchText(product).includes(query);

      const matchesPriority =
        selectedPriority === 'all' || product.alertPriority === selectedPriority;

      const matchesStatus =
        selectedStatus === 'all' || product.alertStatus === selectedStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [alerts, searchTerm, selectedPriority, selectedStatus]);

  return (
    <AppLayout
      title={t('page.alerts.title')}
      description={t('page.alerts.description')}
    >
      <section className="alerts-strip" aria-label={t('alerts.summaryLabel')}>
        <div className="alerts-strip-header">
          <strong>{t('alerts.title')}</strong>
          <span>
            {alerts.length} {t('alerts.active')}
          </span>
        </div>

        <div className="alerts-summary-list single-row">
          <div>
            <strong>{adjustmentAlerts.length}</strong>
            <span>{t('alerts.requiresAdjustment')}</span>
          </div>

          <div>
            <strong>{criticalAlerts.length}</strong>
            <span>{t('alerts.noStock')}</span>
          </div>

          <div>
            <strong>{warningAlerts.length}</strong>
            <span>{t('alerts.restock')}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('alerts.productsToReview')}</h2>
          <span>
            {filteredAlerts.length} {t('alerts.products')}
          </span>
        </div>

        <div
          className="catalog-toolbar"
          style={{
            borderBottom: '1px dashed #e2e8f0',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <label>
            {t('products.search')}
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('products.searchPlaceholder')}
            />
          </label>

          <label>
            {t('alerts.priority')}
            <select
              value={selectedPriority}
              onChange={(event) => setSelectedPriority(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              <option value="high">{t('alerts.high')}</option>
              <option value="medium">{t('alerts.medium')}</option>
            </select>
          </label>

          <label>
            {t('alerts.status')}
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              <option value="requiresAdjustment">{t('alerts.requiresAdjustment')}</option>
              <option value="noStock">{t('alerts.noStock')}</option>
              <option value="belowMinimum">{t('alerts.belowMinimum')}</option>
            </select>
          </label>
        </div>

        <div className="table-wrap alerts-table-wrap">
          {filteredAlerts.length > 0 ? (
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
                {filteredAlerts.map((product) => {
                  const isCritical = product.alertPriority === 'high';

                  const statusLabel =
                    product.alertStatus === 'requiresAdjustment'
                      ? t('alerts.requiresAdjustment')
                      : product.alertStatus === 'noStock'
                        ? t('alerts.noStock')
                        : t('alerts.belowMinimum');

                  const showOriginalStock =
                    product.stockOriginal !== undefined &&
                    toNumber(product.stockOriginal) !== toNumber(product.stock);

                  return (
                    <tr key={product.codigo}>
                      <td>
                        <span className={`status ${isCritical ? 'danger' : 'ok'}`}>
                          {isCritical ? t('alerts.high') : t('alerts.medium')}
                        </span>
                      </td>

                      <td className="alerts-product-cell">
                        {getProductDisplayName(product)}
                      </td>

                      <td className="code-cell">{product.codigo}</td>

                      <td>
                        {toNumber(product.stock).toLocaleString('es-CL')}

                        {showOriginalStock ? (
                          <span className="stock-note">
                            {t('alerts.originalStock')}: {product.stockOriginal}
                          </span>
                        ) : null}
                      </td>

                      <td>{toNumber(product.minStock).toLocaleString('es-CL')}</td>

                      <td>{statusLabel}</td>

                      <td>
                        <div className="table-actions">
                          {product.alertStatus === 'requiresAdjustment' ? (
                            <Link to="/inventory" className="secondary-action">
                              {t('alerts.regularizeAction')}
                            </Link>
                          ) : (
                            <>
                              <Link to="/inventory" className="ghost-button alert-action-link">
                                {t('alerts.inventoryAction')}
                              </Link>

                              <Link to="/purchases" className="secondary-action">
                                {t('alerts.buyAction')}
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              {t('alerts.noActive') || 'Sin alertas pendientes de revisión'}
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

export default Alerts;