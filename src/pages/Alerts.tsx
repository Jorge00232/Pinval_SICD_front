import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import type { Product } from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function requiresAdjustment(product: Product) {
  return product.dataIssue === 'STOCK_NEGATIVO';
}

function Alerts() {
  const { products } = useInventory();
  const { t } = useLanguage();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const adjustmentAlerts = products.filter((product) => requiresAdjustment(product));
  const criticalAlerts = products.filter(
    (product) => !requiresAdjustment(product) && product.stock === 0,
  );
  const warningAlerts = products.filter(
    (product) =>
      !requiresAdjustment(product) &&
      product.stock > 0 &&
      product.stock <= product.minStock,
  );
  
  const alerts = useMemo(() => [
    ...adjustmentAlerts,
    ...criticalAlerts,
    ...warningAlerts.sort((a, b) => a.stock - b.stock),
  ], [products]);

  // Reactive Multi-attribute filter
  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return alerts.filter((product) => {
      const matchesSearch =
        !query ||
        product.codigo.toLowerCase().includes(query) ||
        product.descrip.toLowerCase().includes(query);

      const needsAdjustment = requiresAdjustment(product);
      const isCritical = needsAdjustment || product.stock === 0;
      const priority = isCritical ? 'high' : 'medium';
      
      const matchesPriority =
        selectedPriority === 'all' || priority === selectedPriority;

      let status = 'belowMinimum';
      if (needsAdjustment) {
        status = 'requiresAdjustment';
      } else if (product.stock === 0) {
        status = 'noStock';
      }

      const matchesStatus =
        selectedStatus === 'all' || status === selectedStatus;

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
          <span>{alerts.length} {t('alerts.active')}</span>
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
          <span>{filteredAlerts.length} {t('alerts.products')}</span>
        </div>

        {/* Dynamic Filters Toolbar */}
        <div className="catalog-toolbar" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
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
                  const needsAdjustment = requiresAdjustment(product);
                  const isCritical = needsAdjustment || product.stock === 0;
                  const statusLabel = needsAdjustment
                     ? t('alerts.requiresAdjustment')
                     : product.stock === 0
                       ? t('alerts.noStock')
                       : t('alerts.belowMinimum');

                  return (
                    <tr key={product.codigo}>
                      <td>
                        <span className={`status ${isCritical ? 'danger' : 'ok'}`}>
                          {isCritical ? t('alerts.high') : t('alerts.medium')}
                        </span>
                      </td>
                      <td className="alerts-product-cell">{product.descrip}</td>
                      <td className="code-cell">{product.codigo}</td>
                      <td>
                        {product.stock}
                        {needsAdjustment ? (
                          <span className="stock-note">
                            {t('alerts.originalStock')}: {product.stockOriginal}
                          </span>
                        ) : null}
                      </td>
                      <td>{product.minStock}</td>
                      <td>{statusLabel}</td>
                      <td>
                        <div className="table-actions">
                          {needsAdjustment ? (
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
            <div className="empty-state">{t('alerts.noActive') || 'Sin alertas pendientes de revisión'}</div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

export default Alerts;
