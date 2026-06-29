import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FAMILY_LABELS, type Product } from '../data/mockData';
import { fetchProductExistenceCard, type ProductExistenceCard } from '../api/productsApi';
import {
  fetchInventoryMovements,
  type BackendInventoryMovement,
} from '../api/inventoryMovementsApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

const INVENTORY_PRODUCTS_BATCH_SIZE = 12;
const SENSITIVE_CURRENCY_MASK = '$••••••••';
const SENSITIVE_INFORMATION_LABEL = 'Información restringida';

function requiresAdjustment(product: Product) {
  return product.dataIssue === 'STOCK_NEGATIVO';
}

function getProductDisplayName(product: Product) {
  return product.displayName?.trim() || product.descrip?.trim() || 'Producto sin nombre';
}

function getProductSearchText(product: Product) {
  return [
    product.codigo,
    product.searchName,
    product.displayName,
    product.descrip,
    product.familia,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) {
    return '-';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

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
}

function formatSensitiveCurrency() {
  return SENSITIVE_CURRENCY_MASK;
}

function formatOptionalSensitiveCurrency(value: number | null) {
  if (value === null) {
    return '-';
  }

  return SENSITIVE_CURRENCY_MASK;
}

function Inventory() {
  const { movements, products } = useInventory();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [visibleProductCount, setVisibleProductCount] = useState(
    INVENTORY_PRODUCTS_BATCH_SIZE,
  );
  const infiniteScrollTriggerRef = useRef<HTMLDivElement | null>(null);

  const [backendMovements, setBackendMovements] = useState<BackendInventoryMovement[]>([]);

  const [existenceCard, setExistenceCard] = useState<ProductExistenceCard | null>(null);
  const [existenceCardLoading, setExistenceCardLoading] = useState(false);
  const [existenceCardError, setExistenceCardError] = useState('');

  useEffect(() => {
    let isActive = true;

    fetchInventoryMovements()
      .then((data) => {
        if (!isActive) {
          return;
        }

        setBackendMovements(data);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setBackendMovements([]);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const hasProducts = products.length > 0;

  const families = useMemo(
    () => [...new Set(products.map((product) => product.familia))].sort(),
    [products],
  );

  const inventoryProducts = useMemo(
    () => products.filter((product) => !requiresAdjustment(product) && product.stock > 0),
    [products],
  );

  const totalStock = inventoryProducts.reduce((sum, product) => sum + product.stock, 0);

  const productsToReview = products.filter(
    (product) => requiresAdjustment(product) || product.stock <= product.minStock,
  );

  const movementSummaryByCode = useMemo(() => {
    const summary = new Map<
      string,
      {
        entradas: number;
        salidas: number;
      }
    >();

    for (const movement of backendMovements) {
      const codigo = movement.codigo.trim();

      if (!codigo) {
        continue;
      }

      const current = summary.get(codigo) ?? {
        entradas: 0,
        salidas: 0,
      };

      if (movement.type === 'ENTRADA') {
        current.entradas += movement.quantity;
      }

      if (movement.type === 'SALIDA') {
        current.salidas += movement.quantity;
      }

      summary.set(codigo, current);
    }

    return summary;
  }, [backendMovements]);

  const sortedProducts = useMemo(
    () =>
      [...products]
        .filter((product) => {
          const normalizedSearchTerm = searchTerm.toLowerCase().trim();

          const matchesSearch =
            !normalizedSearchTerm ||
            getProductSearchText(product).includes(normalizedSearchTerm);

          const matchesFamily =
            selectedFamily === 'all' || product.familia === selectedFamily;

          return matchesSearch && matchesFamily;
        })
        .sort((a, b) => {
          const priorityA = requiresAdjustment(a) || a.stock <= a.minStock ? 0 : 1;
          const priorityB = requiresAdjustment(b) || b.stock <= b.minStock ? 0 : 1;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          return getProductDisplayName(a).localeCompare(getProductDisplayName(b));
        }),
    [products, searchTerm, selectedFamily],
  );

  const visibleProducts = useMemo(
    () => sortedProducts.slice(0, visibleProductCount),
    [sortedProducts, visibleProductCount],
  );

  const hasMoreVisibleProducts = visibleProductCount < sortedProducts.length;

  useEffect(() => {
    setVisibleProductCount(INVENTORY_PRODUCTS_BATCH_SIZE);
  }, [searchTerm, selectedFamily, products.length]);

  useEffect(() => {
    const trigger = infiniteScrollTriggerRef.current;

    if (!trigger || !hasMoreVisibleProducts) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleProductCount((currentCount) =>
          Math.min(
            currentCount + INVENTORY_PRODUCTS_BATCH_SIZE,
            sortedProducts.length,
          ),
        );
      },
      {
        root: null,
        rootMargin: '260px 0px',
        threshold: 0.01,
      },
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreVisibleProducts, sortedProducts.length]);

  const periodMovements = movements.filter(
    (movement) => parseMovementMonth(movement.date) === selectedMonth,
  );

  async function refreshBackendMovements() {
    try {
      const updatedMovements = await fetchInventoryMovements();
      setBackendMovements(updatedMovements);
    } catch {
      setBackendMovements([]);
    }
  }

  async function handleOpenExistenceCard(product: Product) {
    setExistenceCard(null);
    setExistenceCardError('');
    setExistenceCardLoading(true);

    try {
      const card = await fetchProductExistenceCard(product.codigo);
      setExistenceCard(card);

      await refreshBackendMovements();
    } catch (error) {
      setExistenceCardError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la tarjeta de existencia.',
      );
    } finally {
      setExistenceCardLoading(false);
    }
  }

  function handleCloseExistenceCard() {
    setExistenceCard(null);
    setExistenceCardError('');
    setExistenceCardLoading(false);
  }

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
          <strong className="sensitive-value">
            {hasProducts ? formatSensitiveCurrency() : t('home.noData')}
          </strong>
          <p>{hasProducts ? SENSITIVE_INFORMATION_LABEL : t('inventory.availableCostDescription')}</p>
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
              max={getCurrentMonth()}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </label>
        </div>

        <div className="period-summary-grid">
          <div>
            <span>{t('inventory.purchaseCostPeriod')}</span>
            <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
          </div>
          <div>
            <span>{t('inventory.salesPeriod')}</span>
            <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
          </div>
          <div>
            <span>{t('inventory.estimatedMargin')}</span>
            <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
          </div>
        </div>

        <p className="panel-note">
          {SENSITIVE_INFORMATION_LABEL}. {t('inventory.periodNote')}
        </p>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('inventory.stockByProduct')}</h2>
          <span>
            {visibleProducts.length.toLocaleString('es-CL')} de{' '}
            {sortedProducts.length.toLocaleString('es-CL')}{' '}
            {t('products.productsCount')}
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
            {t('products.category')}
            <select
              value={selectedFamily}
              onChange={(event) => setSelectedFamily(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              {families.map((family) => (
                <option key={family} value={family}>
                  {FAMILY_LABELS[family] ?? family}
                </option>
              ))}
            </select>
          </label>
        </div>

        {sortedProducts.length > 0 ? (
          <div className="inventory-list">
            {visibleProducts.map((product) => {
              const status = getStatus(product, t);
              const family = FAMILY_LABELS[product.familia] ?? product.familia;
              const productName = getProductDisplayName(product);
              const movementSummary = movementSummaryByCode.get(product.codigo) ?? {
                entradas: 0,
                salidas: 0,
              };

              return (
                <article className="inventory-list-card" key={product.codigo}>
                  <div className="inventory-list-main">
                    <strong title={product.descrip}>{productName}</strong>
                    <span>
                      {product.codigo} - {family}
                    </span>
                  </div>

                  <div className="inventory-row-center-actions">
                    <span className="inventory-movement-chip entry">
                      Entradas {movementSummary.entradas.toLocaleString('es-CL')}
                    </span>

                    <span className="inventory-movement-chip exit">
                      Salidas {movementSummary.salidas.toLocaleString('es-CL')}
                    </span>

                    <button
                      type="button"
                      className="existence-card-button"
                      onClick={() => void handleOpenExistenceCard(product)}
                    >
                      Tarjeta existencia
                    </button>
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

                  <div className="inventory-row-actions">
                    <details className="row-details">
                      <summary>{t('inventory.viewDetail')}</summary>
                      <div>
                        <span>{t('inventory.minimumStock')}: {product.minStock}</span>
                        <span>{t('inventory.fecha')}: {formatDate(product.fecha)}</span>
                        <span>
                          {t('inventory.costPrice')}:{' '}
                          <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                        </span>
                        <span>
                          {t('products.salePrice')}:{' '}
                          <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                        </span>
                        <span>
                          {t('inventory.costValue')}:{' '}
                          <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                        </span>
                        <span>Nombre original: {product.descrip}</span>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}

            <div
              ref={infiniteScrollTriggerRef}
              className="inventory-infinite-scroll-trigger"
              aria-hidden={!hasMoreVisibleProducts}
            >
              {hasMoreVisibleProducts ? (
                <span>Cargando más productos...</span>
              ) : (
                <span>Se cargaron todos los productos disponibles.</span>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">{t('inventory.noProducts')}</div>
        )}
      </section>

      {(existenceCardLoading || existenceCardError || existenceCard) ? (
        <div className="modal-backdrop existence-card-backdrop" role="presentation">
          <section className="modal-panel existence-card-modal" role="dialog" aria-modal="true">
            <div className="existence-card-header">
              <div>
                <span>Tarjeta de existencia</span>
                <h2>{existenceCard?.displayName || 'Cargando producto...'}</h2>
                {existenceCard ? (
                  <p>
                    Código {existenceCard.codigo} · {existenceCard.familia}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                className="existence-card-close"
                onClick={handleCloseExistenceCard}
                aria-label="Cerrar tarjeta de existencia"
              >
                ×
              </button>
            </div>

            {existenceCardLoading ? (
              <div className="empty-state">Cargando tarjeta de existencia...</div>
            ) : null}

            {existenceCardError ? (
              <div className="form-message error">{existenceCardError}</div>
            ) : null}

            {existenceCard && !existenceCardLoading ? (
              <>
                <div className="existence-card-summary">
                  <div>
                    <span>Stock actual</span>
                    <strong>{existenceCard.currentStock.toLocaleString('es-CL')}</strong>
                  </div>
                  <div>
                    <span>Total entradas</span>
                    <strong>{existenceCard.totalEntradas.toLocaleString('es-CL')}</strong>
                  </div>
                  <div>
                    <span>Total salidas</span>
                    <strong>{existenceCard.totalSalidas.toLocaleString('es-CL')}</strong>
                  </div>
                  <div>
                    <span>Valor costo</span>
                    <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                  </div>
                </div>

                <div className="existence-card-price-grid">
                  <div>
                    <span>Precio costo</span>
                    <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                  </div>
                  <div>
                    <span>Precio venta</span>
                    <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                  </div>
                  <div>
                    <span>Valor venta stock</span>
                    <strong className="sensitive-value">{formatSensitiveCurrency()}</strong>
                  </div>
                </div>

                {existenceCard.dataIssue === 'STOCK_NEGATIVO' ? (
                  <p className="existence-card-warning">
                    Este producto requiere ajuste porque su stock original es{' '}
                    {existenceCard.stockOriginal}.
                  </p>
                ) : null}

                <div className="table-wrap existence-card-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Detalle</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Stock total</th>
                        <th>Precio unitario</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existenceCard.movements.length > 0 ? (
                        existenceCard.movements.map((movement) => (
                          <tr key={movement.id}>
                            <td>{formatDate(movement.fecha)}</td>
                            <td>{movement.detalle}</td>
                            <td className="numeric-cell">
                              {movement.entrada
                                ? movement.entrada.toLocaleString('es-CL')
                                : '-'}
                            </td>
                            <td className="numeric-cell">
                              {movement.salida
                                ? movement.salida.toLocaleString('es-CL')
                                : '-'}
                            </td>
                            <td className="numeric-cell">
                              {movement.stockTotal === null
                                ? '-'
                                : movement.stockTotal.toLocaleString('es-CL')}
                            </td>
                            <td className="numeric-cell sensitive-value">
                              {formatOptionalSensitiveCurrency(movement.precioUnitario)}
                            </td>
                            <td className="numeric-cell sensitive-value">
                              {formatOptionalSensitiveCurrency(movement.total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>
                            Todavía no hay movimientos registrados para este producto.
                            La tarjeta ya está lista para mostrar entradas y salidas cuando
                            compras y ventas creen movimientos reales en el backend.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default Inventory;
