import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import {
  currencyFormatter,
  FAMILY_LABELS,
  type ProductFamily,
} from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

const BASE_FAMILIES = Object.keys(FAMILY_LABELS) as ProductFamily[];

function formatDate(dateStr?: string) {
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

function Products() {
  const { addProduct, products, suppliers: registeredSuppliers } = useInventory();
  const { t } = useLanguage();
  const canManage = canManageData();
  const [searchParams] = useSearchParams();
  
  // Category management modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<ProductFamily[]>([]);
  
  // Basic search filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedFamily, setSelectedFamily] = useState('all');

  
  // Advanced search filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [searchBatch, setSearchBatch] = useState('');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('all');

  const families = useMemo(
    () =>
      [
        ...new Set([
          ...BASE_FAMILIES,
          ...customCategories,
          ...products.map((product) => product.familia),
        ]),
      ],
    [customCategories, products],
  );

  // Expiry calculation helper: returns remaining days (negative if expired, null if no expiry)
  const getExpiryDaysDiff = (expiryDateStr?: string) => {
    if (!expiryDateStr) return null;
    const expiry = new Date(expiryDateStr);
    if (Number.isNaN(expiry.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Collect unique locations and suppliers dynamically from currently active products
  const uniqueLocations = useMemo(() => {
    const locs = products
      .map((p) => p.ubicacion)
      .filter((l): l is string => typeof l === 'string' && l.trim().length > 0);
    return [...new Set(locs)].sort();
  }, [products]);

  const uniqueSuppliers = useMemo(() => {
    const sups = products
      .map((p) => p.proveedor)
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
    return [...new Set(sups)].sort();
  }, [products]);

  const productsToReview = products.filter(
    (product) => {
      const isCriticalStock = product.dataIssue === 'STOCK_NEGATIVO' || product.stock <= product.minStock;
      const daysDiff = getExpiryDaysDiff(product.fechaCaducidad);
      const isExpiredOrNear = daysDiff !== null && daysDiff <= 30;
      return isCriticalStock || isExpiredOrNear;
    }
  );

  // Multi-attribute advanced filtering logic
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedBatch = searchBatch.trim().toLowerCase();

    return products.filter((product) => {
      // 1. Text filter (SKU / Name)
      const matchesSearch =
        !normalizedSearch ||
        product.codigo.toLowerCase().includes(normalizedSearch) ||
        product.descrip.toLowerCase().includes(normalizedSearch);
      
      // 2. Category filter
      const matchesFamily =
        selectedFamily === 'all' || product.familia === selectedFamily;

      // 3. Location filter (handles unassigned too)
      const matchesLocation =
        selectedLocation === 'all' ||
        (selectedLocation === 'none' && !product.ubicacion) ||
        product.ubicacion === selectedLocation;

      // 4. Supplier filter (handles unassigned too)
      const matchesSupplier =
        selectedSupplier === 'all' ||
        (selectedSupplier === 'none' && !product.proveedor) ||
        product.proveedor === selectedSupplier;

      // 5. Batch / Lote text filter
      const matchesBatch =
        !normalizedBatch ||
        (product.lote && product.lote.toLowerCase().includes(normalizedBatch));

      // 6. Expiry status filter (All, Expired, Near Expiration <= 30 days, Valid)
      let matchesExpiry = true;
      if (selectedExpiryStatus !== 'all') {
        const days = getExpiryDaysDiff(product.fechaCaducidad);
        if (selectedExpiryStatus === 'expired') {
          matchesExpiry = days !== null && days < 0;
        } else if (selectedExpiryStatus === 'near') {
          matchesExpiry = days !== null && days >= 0 && days <= 30;
        } else if (selectedExpiryStatus === 'valid') {
          // Products with NO expiry date or expiry date > 30 days are valid
          matchesExpiry = !product.fechaCaducidad || (days !== null && days > 30);
        }
      }

      return (
        matchesSearch &&
        matchesFamily &&
        matchesLocation &&
        matchesSupplier &&
        matchesBatch &&
        matchesExpiry
      );
    });
  }, [
    products,
    searchTerm,
    selectedFamily,
    selectedLocation,
    selectedSupplier,
    searchBatch,
    selectedExpiryStatus,
  ]);

  return (
    <AppLayout
      title={t('page.products.title')}
      description={t('page.products.description')}
    >
      <section className="stacked-management-layout">
        <section className="dashboard-kpi-strip">
          <article className="metric-card compact-metric blue">
            <span className="metric-icon">PR</span>
            <span>{t('products.totalCatalog')}</span>
            <strong>{products.length || t('home.noData')}</strong>
            <p>{t('products.productsCount')}</p>
          </article>
          <article className="metric-card compact-metric amber">
            <span className="metric-icon">CA</span>
            <span>{t('products.categories')}</span>
            <strong>{families.length || t('home.noData')}</strong>
            <p>{t('products.activeCategories')}</p>
          </article>
          <article className="metric-card compact-metric red">
            <span className="metric-icon">RE</span>
            <span>{t('products.toReview')}</span>
            <strong>{productsToReview.length || t('home.noData')}</strong>
            <p>{t('inventory.lowStockProducts')}</p>
          </article>
          <article className="metric-card compact-metric green">
            <span className="metric-icon">VI</span>
            <span>{t('products.visible')}</span>
            <strong>{filteredProducts.length || t('home.noData')}</strong>
            <p>{t('products.filteredProducts')}</p>
          </article>
        </section>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('products.catalog')}</h2>
            <div className="panel-heading-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>{products.length} {t('products.productsCount')}</span>
              {canManage && (
                <button
                  type="button"
                  className="add-product-trigger-btn"
                  onClick={() => setIsAddModalOpen(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ➕ {t('products.newProduct') || 'Añadir Producto'}
                </button>
              )}
            </div>
          </div>

          <div className="catalog-toolbar-wrapper">
            <div className="catalog-toolbar">
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
              <button
                type="button"
                className={`ghost-button toggle-filters-btn ${showAdvanced ? 'active' : ''}`}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? `⚡ ${t('products.hideFilters')}` : `🔍 ${t('products.showFilters')}`}
              </button>
            </div>

            {/* Expandable Advanced Dynamic Filters Panel */}
            {showAdvanced && (
              <div className="advanced-filters-panel fade-in">
                <label>
                  📍 {t('products.location')}
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                  >
                    <option value="all">{t('reports.all')}</option>
                    <option value="none">{t('products.noLocation')}</option>
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  📦 {t('products.supplier')}
                  <select
                    value={selectedSupplier}
                    onChange={(event) => setSelectedSupplier(event.target.value)}
                  >
                    <option value="all">{t('reports.all')}</option>
                    <option value="none">{t('products.noSupplier')}</option>
                    {uniqueSuppliers.map((sup) => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  🏷️ {t('products.batch')}
                  <input
                    value={searchBatch}
                    onChange={(event) => setSearchBatch(event.target.value)}
                    placeholder={t('products.batchPlaceholder')}
                  />
                </label>

                <label>
                  📅 {t('products.expiryFilter')}
                  <select
                    value={selectedExpiryStatus}
                    onChange={(event) => setSelectedExpiryStatus(event.target.value)}
                  >
                    <option value="all">{t('products.expiry.all')}</option>
                    <option value="expired">{t('products.expiry.expired')}</option>
                    <option value="near">{t('products.expiry.near')}</option>
                    <option value="valid">{t('products.expiry.valid')}</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <div className="catalog-grid">
              {filteredProducts.slice(0, 18).map((product) => {
                const needsReview =
                  product.dataIssue === 'STOCK_NEGATIVO' || product.stock <= product.minStock;
                const statusLabel = product.dataIssue === 'STOCK_NEGATIVO'
                  ? t('inventory.requiresAdjustment')
                  : product.stock <= product.minStock
                    ? t('inventory.belowMinimum')
                    : t('inventory.inRange');
                const family = FAMILY_LABELS[product.familia] ?? product.familia;

                // Semantic Expiration calculations & style badges
                const daysDiff = getExpiryDaysDiff(product.fechaCaducidad);
                let expiryTag = null;
                let isExpired = false;
                let isExpiringSoon = false;

                if (product.fechaCaducidad && daysDiff !== null) {
                  if (daysDiff < 0) {
                    isExpired = true;
                    expiryTag = <span className="expiry-tag expired">{t('products.expired')}</span>;
                  } else if (daysDiff <= 30) {
                    isExpiringSoon = true;
                    expiryTag = (
                      <span className="expiry-tag near-expired">
                        {t('products.expiresIn')} {daysDiff} {t('products.days')}
                      </span>
                    );
                  } else {
                    expiryTag = (
                      <span className="expiry-tag valid-expiry">
                        {t('products.expiresIn')} {daysDiff} {t('products.days')}
                      </span>
                    );
                  }
                }

                return (
                  <article 
                    className={`catalog-card ${isExpired ? 'card-expired' : ''} ${isExpiringSoon ? 'card-warning' : ''}`} 
                    key={product.codigo}
                  >
                    <div className="catalog-card-head">
                      <span className="catalog-icon">
                        {family.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="catalog-card-tags">
                        <span className={`status ${needsReview ? 'danger' : 'ok'}`}>
                          {statusLabel}
                        </span>
                        {expiryTag}
                      </div>
                    </div>
                    <strong>{product.descrip}</strong>
                    <p>{product.codigo} - {family}</p>
                    
                    {/* Compact layout tags for Location and Batch */}
                    <div className="catalog-card-meta-chips">
                      <span className="meta-chip">
                        📍 {product.ubicacion || t('products.noLocation')}
                      </span>
                      {product.lote && (
                        <span className="meta-chip">
                          🏷️ {product.lote}
                        </span>
                      )}
                    </div>

                    <div className="catalog-card-metrics">
                      <div>
                        <span>{t('products.stock')}</span>
                        <strong>{product.stock.toLocaleString('es-CL')}</strong>
                      </div>
                      <div>
                        <span>{t('products.salePrice')}</span>
                        <strong>{currencyFormatter.format(product.prventa)}</strong>
                      </div>
                    </div>

                    <details className="row-details">
                      <summary>{t('inventory.viewDetail')}</summary>
                      <div className="product-details-grid">
                        <span><strong>{t('products.costPrice')}:</strong> {currencyFormatter.format(product.prcosto)}</span>
                        <span><strong>{t('products.minimumStock')}:</strong> {product.minStock}</span>
                        <span><strong>{t('inventory.fecha')}:</strong> {formatDate(product.fecha)}</span>
                        <span><strong>{t('products.category')}:</strong> {family}</span>
                        <span><strong>📍 {t('products.location')}:</strong> {product.ubicacion || t('products.noLocation')}</span>
                        <span><strong>📦 {t('products.supplier')}:</strong> {product.proveedor || t('products.noSupplier')}</span>
                        <span><strong>🏷️ {t('products.batch')}:</strong> {product.lote || t('products.noBatch')}</span>
                        <span><strong>📅 {t('products.expiry')}:</strong> {product.fechaCaducidad ? formatDate(product.fechaCaducidad) : t('products.noExpiry')}</span>
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">{t('products.noProducts')}</div>
          )}
        </article>
      </section>

      {canManage && isCategoryModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-category-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <h2 id="new-category-title">{t('products.newCategory')}</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                {t('products.close')}
              </button>
            </div>
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                const normalizedCategory = newCategory.trim();

                if (!normalizedCategory) {
                  return;
                }

                setCustomCategories((current) => {
                  const exists = current.some(
                    (category) =>
                      category.toLowerCase() === normalizedCategory.toLowerCase(),
                  );

                  if (exists) {
                    return current;
                  }

                  return [...current, normalizedCategory];
                });
                setNewCategory('');
                setIsCategoryModalOpen(false);
              }}
            >
              <label>
                {t('products.categoryName')}
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder={t('products.categoryNamePlaceholder')}
                  maxLength={60}
                  required
                />
              </label>
              <button type="submit">{t('products.saveCategory')}</button>
            </form>
          </section>
        </div>
      ) : null}

      {canManage && isAddModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setIsAddModalOpen(false)}
        >
          <section
            className="modal-panel products-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-title"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '640px', width: '90%', animation: 'fadeIn 0.2s ease-out' }}
          >
            <div className="panel-heading">
              <h2 id="add-product-title">{t('products.newProduct') || 'Añadir Nuevo Producto'}</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setIsAddModalOpen(false)}
              >
                {t('products.close')}
              </button>
            </div>
            
            <form
              className="grid-form products-form"
              onSubmit={(event) => {
                event.preventDefault();

                const formData = new FormData(event.currentTarget);

                addProduct({
                  codigo: String(formData.get('codigo')).trim(),
                  descrip: String(formData.get('descrip')).trim(),
                  familia: String(formData.get('familia')) as ProductFamily,
                  prcosto: Number(formData.get('prcosto')),
                  prventa: Number(formData.get('prventa')),
                  stock: Number(formData.get('stock')),
                  minStock: Number(formData.get('minStock')),
                  fecha: String(formData.get('fecha')),
                  ubicacion: String(formData.get('ubicacion')).trim() || undefined,
                  proveedor: String(formData.get('proveedor')).trim() || undefined,
                  lote: String(formData.get('lote')).trim() || undefined,
                  fechaCaducidad: String(formData.get('fechaCaducidad')).trim() || undefined,
                });

                setIsAddModalOpen(false);
              }}
            >
              <label>
                {t('products.code')}
                <input
                  name="codigo"
                  placeholder={t('products.codePlaceholder')}
                  maxLength={20}
                  required
                />
              </label>
              <label>
                {t('products.description')}
                <input
                  name="descrip"
                  placeholder={t('products.descriptionPlaceholder')}
                  required
                />
              </label>
              <label>
                {t('products.category')}
                <div className="select-with-action">
                  <select name="familia" required defaultValue="">
                    <option value="" disabled>
                      {t('products.selectCategory')}
                    </option>
                    {families.map((family) => (
                      <option key={family} value={family}>
                        {FAMILY_LABELS[family] ?? family}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => setIsCategoryModalOpen(true)}
                  >
                    {t('products.newCategory')}
                  </button>
                </div>
              </label>
              <label>
                {t('products.costPrice')}
                <input
                  name="prcosto"
                  type="number"
                  min="0"
                  placeholder={t('products.costPlaceholder')}
                  required
                />
              </label>
              <label>
                {t('products.salePrice')}
                <input
                  name="prventa"
                  type="number"
                  min="0"
                  placeholder={t('products.salePlaceholder')}
                  required
                />
              </label>
              <label>
                {t('products.stock')}
                <input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder={t('products.stockPlaceholder')}
                  required
                />
              </label>
              <label>
                {t('products.minimumStock')}
                <input
                  name="minStock"
                  type="number"
                  min="0"
                  placeholder={t('products.minimumStockPlaceholder')}
                  required
                />
              </label>
              <label>
                {t('inventory.fecha')}
                <input
                  name="fecha"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </label>

              {/* Advanced Attributes Form Fields */}
              <label>
                📍 {t('products.location')}
                <input
                  name="ubicacion"
                  placeholder={t('products.locationPlaceholder')}
                />
              </label>
              <label>
                📦 {t('products.supplier')}
                <select name="proveedor" defaultValue="">
                  <option value="">{t('products.selectSupplier')}</option>
                  {registeredSuppliers.map((supplier) => (
                    <option key={supplier.name} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                🏷️ {t('products.batch')}
                <input
                  name="lote"
                  placeholder={t('products.batchPlaceholder')}
                />
              </label>
              <label>
                📅 {t('products.expiry')}
                <input
                  name="fechaCaducidad"
                  type="date"
                />
              </label>

              <button type="submit" className="products-submit-btn" style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                {t('products.addProduct')}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default Products;
