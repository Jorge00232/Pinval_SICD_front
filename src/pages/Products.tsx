import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import { canManageData } from '../api/authApi';
import {
  currencyFormatter,
  FAMILY_LABELS,
  type Product,
  type ProductFamily,
} from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

const BASE_FAMILIES = Object.keys(FAMILY_LABELS) as ProductFamily[];
const PRODUCTS_BATCH_SIZE = 12;

type ProductSaveFeedback = {
  title: string;
  message: string;
  variant: 'success' | 'error';
};

function normalizeSearchText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toDisplayProductName(rawName?: string | null) {
  if (!rawName) {
    return '';
  }

  const cleaned = rawName
    .replace(/_/g, ' ')
    .replace(/\*/g, ' x')
    .replace(/\//g, ' / ')
    .replace(/\./g, ' ')
    .replace(/\b(\d+)\s*CC\b/gi, '$1 cc')
    .replace(/\b(\d+)\s*ML\b/gi, '$1 ml')
    .replace(/\b(\d+)\s*LT\b/gi, '$1 L')
    .replace(/\b(\d+)\s*LTS\b/gi, '$1 L')
    .replace(/\b(\d+)\s*L\b/gi, '$1 L')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bCc\b/g, 'cc')
    .replace(/\bMl\b/g, 'ml')
    .replace(/\bL\b/g, 'L')
    .replace(/\bX\s*(\d+)/g, 'x$1')
    .replace(/\s+\/\s+/g, ' / ');
}

function toSearchProductName(rawName?: string | null) {
  return normalizeSearchText(toDisplayProductName(rawName));
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
    product.ubicacion,
    product.proveedor,
    product.lote,
  ]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .join(' ');
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

function toInputDate(dateStr?: string | null) {
  if (!dateStr) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().split('T')[0];
}

function getExpiryDaysDiff(expiryDateStr?: string | null) {
  if (!expiryDateStr) {
    return null;
  }

  const expiry = new Date(expiryDateStr);

  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function Products() {
  const { addProduct, products, suppliers: registeredSuppliers } = useInventory();
  const { t } = useLanguage();
  const canManage = canManageData();
  const [searchParams] = useSearchParams();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<Product | null>(null);
  const [openProductDetailsCode, setOpenProductDetailsCode] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<ProductFamily[]>([]);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedFamily, setSelectedFamily] = useState('all');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [searchBatch, setSearchBatch] = useState('');
  const [selectedExpiryStatus, setSelectedExpiryStatus] = useState('all');
  const [visibleProductsCount, setVisibleProductsCount] = useState(PRODUCTS_BATCH_SIZE);
  const productInfiniteScrollTriggerRef = useRef<HTMLDivElement | null>(null);

  const isEditingProduct = selectedProductToEdit !== null;

  type PendingProduct = Parameters<typeof addProduct>[0];
  type PendingProductSaveOptions = Parameters<typeof addProduct>[1];
  const [pendingProduct, setPendingProduct] = useState<PendingProduct | null>(null);
  const [pendingProductSaveOptions, setPendingProductSaveOptions] =
    useState<PendingProductSaveOptions | null>(null);
  const [productSaveFeedback, setProductSaveFeedback] = useState<ProductSaveFeedback | null>(null);

  function openCreateProductModal() {
    setOpenProductDetailsCode(null);
    setSelectedProductToEdit(null);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setOpenProductDetailsCode(null);
    setSelectedProductToEdit(product);
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setSelectedProductToEdit(null);
    setIsProductModalOpen(false);
  }

  function confirmProductSave() {
    if (!pendingProduct) {
      return;
    }

    const wasEditingProduct = pendingProductSaveOptions?.mode === 'update' || isEditingProduct;
    const productName = pendingProduct.displayName || pendingProduct.descrip || pendingProduct.codigo;
    const saveOptions = pendingProductSaveOptions ?? {
      mode: wasEditingProduct ? 'update' : 'create',
      originalCodigo: selectedProductToEdit?.codigo ?? pendingProduct.codigo,
    };

    Promise.resolve()
      .then(() => addProduct(pendingProduct, saveOptions))
      .then(() => {
        setPendingProduct(null);
        setPendingProductSaveOptions(null);
        closeProductModal();
        setProductSaveFeedback({
          title: wasEditingProduct
            ? 'Producto actualizado correctamente'
            : 'Producto registrado correctamente',
          message: wasEditingProduct
            ? `${productName} fue actualizado en el catálogo de productos.`
            : `${productName} fue agregado al catálogo de productos.`,
          variant: 'success',
        });
      })
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Revisa la conexión con el backend e intenta nuevamente.';

        setPendingProduct(null);
        setPendingProductSaveOptions(null);
        setProductSaveFeedback({
          title: wasEditingProduct
            ? 'No se pudo actualizar el producto'
            : 'No se pudo registrar el producto',
          message: errorMessage,
          variant: 'error',
        });
      });
  }

  function locateProduct(product: Product) {
    setOpenProductDetailsCode(null);
    setSearchTerm(product.codigo);
    setSelectedFamily('all');
    setSelectedLocation('all');
    setSelectedSupplier('all');
    setSearchBatch('');
    setSelectedExpiryStatus('all');
    setShowAdvanced(false);
    setVisibleProductsCount(PRODUCTS_BATCH_SIZE);
  }

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

  const uniqueLocations = useMemo(() => {
    const locations = products
      .map((product) => product.ubicacion)
      .filter(
        (location): location is string =>
          typeof location === 'string' && location.trim().length > 0,
      );

    return [...new Set(locations)].sort();
  }, [products]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = products
      .map((product) => product.proveedor)
      .filter(
        (supplier): supplier is string =>
          typeof supplier === 'string' && supplier.trim().length > 0,
      );

    return [...new Set(suppliers)].sort();
  }, [products]);

  const productsToReview = products.filter((product) => {
    const isCriticalStock =
      product.dataIssue === 'STOCK_NEGATIVO' || product.stock <= product.minStock;

    const daysDiff = getExpiryDaysDiff(product.fechaCaducidad);
    const isExpiredOrNear = daysDiff !== null && daysDiff <= 30;

    return isCriticalStock || isExpiredOrNear;
  });

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeSearchText(searchTerm);
    const normalizedBatch = normalizeSearchText(searchBatch);

    return products
      .filter((product) => {
        const matchesSearch =
          !normalizedSearch || getProductSearchText(product).includes(normalizedSearch);

        const matchesFamily =
          selectedFamily === 'all' || product.familia === selectedFamily;

        const matchesLocation =
          selectedLocation === 'all' ||
          (selectedLocation === 'none' && !product.ubicacion) ||
          product.ubicacion === selectedLocation;

        const matchesSupplier =
          selectedSupplier === 'all' ||
          (selectedSupplier === 'none' && !product.proveedor) ||
          product.proveedor === selectedSupplier;

        const matchesBatch =
          !normalizedBatch || normalizeSearchText(product.lote).includes(normalizedBatch);

        let matchesExpiry = true;

        if (selectedExpiryStatus !== 'all') {
          const days = getExpiryDaysDiff(product.fechaCaducidad);

          if (selectedExpiryStatus === 'expired') {
            matchesExpiry = days !== null && days < 0;
          } else if (selectedExpiryStatus === 'near') {
            matchesExpiry = days !== null && days >= 0 && days <= 30;
          } else if (selectedExpiryStatus === 'valid') {
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
      })
      .sort((a, b) => getProductDisplayName(a).localeCompare(getProductDisplayName(b)));
  }, [
    products,
    searchTerm,
    selectedFamily,
    selectedLocation,
    selectedSupplier,
    searchBatch,
    selectedExpiryStatus,
  ]);

  useEffect(() => {
    setVisibleProductsCount(PRODUCTS_BATCH_SIZE);
  }, [
    searchTerm,
    selectedFamily,
    selectedLocation,
    selectedSupplier,
    searchBatch,
    selectedExpiryStatus,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleProductsCount);
  const hasMoreProducts = visibleProductsCount < filteredProducts.length;

  useEffect(() => {
    const trigger = productInfiniteScrollTriggerRef.current;

    if (!trigger || !hasMoreProducts) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry?.isIntersecting) {
          return;
        }

        setVisibleProductsCount((currentCount) =>
          Math.min(currentCount + PRODUCTS_BATCH_SIZE, filteredProducts.length),
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
  }, [filteredProducts.length, hasMoreProducts]);

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

            <div
              className="panel-heading-actions"
              style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              <span>
                {products.length} {t('products.productsCount')}
              </span>

              {canManage && (
                <button
                  type="button"
                  className="add-product-trigger-btn"
                  onClick={openCreateProductModal}
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
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t('products.newProduct') || 'Añadir Producto'}
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
                {showAdvanced
                  ? `${t('products.hideFilters')}`
                  : `${t('products.showFilters')}`}
              </button>
            </div>

            {showAdvanced && (
              <div className="advanced-filters-panel fade-in">
                <label>
                  {t('products.location')}
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                  >
                    <option value="all">{t('reports.all')}</option>
                    <option value="none">{t('products.noLocation')}</option>

                    {uniqueLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t('products.supplier')}
                  <select
                    value={selectedSupplier}
                    onChange={(event) => setSelectedSupplier(event.target.value)}
                  >
                    <option value="all">{t('reports.all')}</option>
                    <option value="none">{t('products.noSupplier')}</option>

                    {uniqueSuppliers.map((supplier) => (
                      <option key={supplier} value={supplier}>
                        {supplier}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t('products.batch')}
                  <input
                    value={searchBatch}
                    onChange={(event) => setSearchBatch(event.target.value)}
                    placeholder={t('products.batchPlaceholder')}
                  />
                </label>

                <label>
                  {t('products.expiryFilter')}
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
            <>
              <div className="catalog-grid">
                {visibleProducts.map((product) => {
                  const needsReview =
                    product.dataIssue === 'STOCK_NEGATIVO' ||
                    product.stock <= product.minStock;

                  const statusLabel =
                    product.dataIssue === 'STOCK_NEGATIVO'
                      ? t('inventory.requiresAdjustment')
                      : product.stock <= product.minStock
                        ? t('inventory.belowMinimum')
                        : t('inventory.inRange');

                  const family = FAMILY_LABELS[product.familia] ?? product.familia;
                  const productName = getProductDisplayName(product);

                  const daysDiff = getExpiryDaysDiff(product.fechaCaducidad);
                  let expiryTag = null;
                  let isExpired = false;
                  let isExpiringSoon = false;

                  if (product.fechaCaducidad && daysDiff !== null) {
                    if (daysDiff < 0) {
                      isExpired = true;
                      expiryTag = (
                        <span className="expiry-tag expired">
                          {t('products.expired')}
                        </span>
                      );
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
                      className={`catalog-card ${isExpired ? 'card-expired' : ''} ${
                        isExpiringSoon ? 'card-warning' : ''
                      }`}
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

                      <strong title={product.descrip}>{productName}</strong>

                      <p>
                        {product.codigo} - {family}
                      </p>

                      <div className="catalog-card-meta-chips">
                        <span className="meta-chip">
                          {product.ubicacion || t('products.noLocation')}
                        </span>

                        {product.lote ? (
                          <span className="meta-chip">🏷️ {product.lote}</span>
                        ) : null}
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

                      <details
                        className="compact-product-details"
                        open={openProductDetailsCode === product.codigo}
                        onToggle={(event) => {
                          const isOpen = event.currentTarget.open;

                          if (isOpen) {
                            setOpenProductDetailsCode(product.codigo);
                            return;
                          }

                          setOpenProductDetailsCode((currentCode) =>
                            currentCode === product.codigo ? null : currentCode,
                          );
                        }}
                      >
                        <summary>{t('inventory.viewDetail')}</summary>

                        <div className="compact-detail-popover">
                          <div className="compact-detail-header">
                            <strong>Detalle del producto</strong>
                            <span>{product.codigo}</span>
                          </div>

                          <div className="compact-detail-grid">
                            <div>
                              <span>Stock mínimo</span>
                              <strong>{product.minStock}</strong>
                            </div>

                            <div>
                              <span>Fecha</span>
                              <strong>{formatDate(product.fecha)}</strong>
                            </div>

                            <div>
                              <span>Precio costo</span>
                              <strong>{currencyFormatter.format(product.prcosto)}</strong>
                            </div>

                            <div>
                              <span>Precio venta</span>
                              <strong>{currencyFormatter.format(product.prventa)}</strong>
                            </div>

                            <div>
                              <span>Ubicación</span>
                              <strong>
                                {product.ubicacion || t('products.noLocation')}
                              </strong>
                            </div>

                            <div>
                              <span>Proveedor</span>
                              <strong>
                                {product.proveedor || t('products.noSupplier')}
                              </strong>
                            </div>

                            <div>
                              <span>Lote</span>
                              <strong>{product.lote || t('products.noBatch')}</strong>
                            </div>

                            <div>
                              <span>Vencimiento</span>
                              <strong>
                                {product.fechaCaducidad
                                  ? formatDate(product.fechaCaducidad)
                                  : t('products.noExpiry')}
                              </strong>
                            </div>
                          </div>

                          <div className="compact-original-name">
                            <span>Nombre original</span>
                            <code>{product.descrip}</code>
                          </div>

                          <div className="compact-detail-actions">
                            <button
                              type="button"
                              className="compact-detail-secondary-button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                locateProduct(product);
                              }}
                            >
                              Ubicar
                            </button>

                            {canManage && (
                              <button
                                type="button"
                                className="compact-detail-edit-button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  openEditProductModal(product);
                                }}
                              >
                                Editar
                              </button>
                            )}
                          </div>
                        </div>
                      </details>
                    </article>
                  );
                })}
              </div>


              <div
                ref={productInfiniteScrollTriggerRef}
                className="catalog-infinite-scroll-trigger"
                aria-hidden={!hasMoreProducts}
              >
                {hasMoreProducts ? (
                  <span>
                    Cargando más productos... Mostrando {visibleProducts.length} de{' '}
                    {filteredProducts.length}
                  </span>
                ) : (
                  <span>
                    Se cargaron todos los productos disponibles ({filteredProducts.length}).
                  </span>
                )}
              </div>
            </>
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

      {canManage && isProductModalOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={closeProductModal}
        >
          <section
            className="modal-panel products-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: '640px', width: '90%', animation: 'fadeIn 0.2s ease-out' }}
          >
            <div className="panel-heading">
              <h2 id="product-modal-title">
                {isEditingProduct
                  ? 'Editar producto'
                  : t('products.newProduct') || 'Añadir Nuevo Producto'}
              </h2>

              <button
                type="button"
                className="ghost-button"
                onClick={closeProductModal}
              >
                {t('products.close')}
              </button>
            </div>

            <form
              className="grid-form products-form"
              onSubmit={(event) => {
                event.preventDefault();

                const formData = new FormData(event.currentTarget);
                const originalName = String(formData.get('descrip')).trim();
                const displayName = toDisplayProductName(originalName);
                const searchName = toSearchProductName(originalName);

                const productData: PendingProduct = {
                  codigo: String(formData.get('codigo')).trim(),
                  descrip: originalName,
                  displayName,
                  searchName,
                  familia: String(formData.get('familia')) as ProductFamily,
                  prcosto: Number(formData.get('prcosto')),
                  prventa: Number(formData.get('prventa')),
                  stock: Number(formData.get('stock')),
                  minStock: Number(formData.get('minStock')),
                  fecha: String(formData.get('fecha')),
                  ubicacion: String(formData.get('ubicacion')).trim() || undefined,
                  proveedor: String(formData.get('proveedor')).trim() || undefined,
                  lote: String(formData.get('lote')).trim() || undefined,
                  fechaCaducidad:
                    String(formData.get('fechaCaducidad')).trim() || undefined,
                };

                setPendingProductSaveOptions({
                  mode: isEditingProduct ? 'update' : 'create',
                  originalCodigo: selectedProductToEdit?.codigo ?? productData.codigo,
                });
                setPendingProduct(productData);
              }}
            >
              <label>
                {t('products.code')}
                <input
                  name="codigo"
                  placeholder={t('products.codePlaceholder')}
                  maxLength={20}
                  required
                  readOnly={isEditingProduct}
                  defaultValue={selectedProductToEdit?.codigo ?? ''}
                />
              </label>

              <label>
                {t('products.description')}
                <input
                  name="descrip"
                  placeholder={t('products.descriptionPlaceholder')}
                  required
                  defaultValue={selectedProductToEdit?.descrip ?? ''}
                />
              </label>

              <label>
                {t('products.category')}
                <div className="select-with-action">
                  <select
                    name="familia"
                    required
                    defaultValue={selectedProductToEdit?.familia ?? ''}
                  >
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
                  defaultValue={selectedProductToEdit?.prcosto ?? ''}
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
                  defaultValue={selectedProductToEdit?.prventa ?? ''}
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
                  defaultValue={selectedProductToEdit?.stock ?? ''}
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
                  defaultValue={selectedProductToEdit?.minStock ?? 5}
                />
              </label>

              <label>
                {t('inventory.fecha')}
                <input
                  name="fecha"
                  type="date"
                  defaultValue={
                    toInputDate(selectedProductToEdit?.fecha) ||
                    new Date().toISOString().split('T')[0]
                  }
                  required
                />
              </label>

              <label>
                {t('products.location')}
                <input
                  name="ubicacion"
                  placeholder={t('products.locationPlaceholder')}
                  defaultValue={selectedProductToEdit?.ubicacion ?? ''}
                />
              </label>

              <label>
                {t('products.supplier')}
                <select
                  name="proveedor"
                  defaultValue={selectedProductToEdit?.proveedor ?? ''}
                >
                  <option value="">{t('products.selectSupplier')}</option>

                  {registeredSuppliers.map((supplier) => (
                    <option key={supplier.name} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t('products.batch')}
                <input
                  name="lote"
                  placeholder={t('products.batchPlaceholder')}
                  defaultValue={selectedProductToEdit?.lote ?? ''}
                />
              </label>

              <label>
                {t('products.expiry')}
                <input
                  name="fechaCaducidad"
                  type="date"
                  defaultValue={toInputDate(selectedProductToEdit?.fechaCaducidad)}
                />
              </label>

              <button
                type="submit"
                className="products-submit-btn"
                style={{ gridColumn: 'span 2', marginTop: '12px' }}
              >
                {isEditingProduct ? 'Guardar cambios' : t('products.addProduct')}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {pendingProduct ? (
        <ConfirmModal
          isOpen={true}
          title="¿Estás seguro?"
          subtitle={isEditingProduct ? 'Se guardarán los cambios del producto.' : 'Se agregará el siguiente producto al catálogo.'}
          confirmLabel={isEditingProduct ? 'Guardar cambios' : 'Agregar producto'}
          cancelLabel="Cancelar"
          details={[
            { label: 'Código', value: pendingProduct.codigo },
            { label: 'Descripción', value: pendingProduct.displayName || pendingProduct.descrip },
            { label: 'Categoría', value: FAMILY_LABELS[pendingProduct.familia as ProductFamily] ?? pendingProduct.familia },
            { label: 'Stock inicial', value: String(pendingProduct.stock) },
            { label: 'Stock mínimo', value: String(pendingProduct.minStock) },
            { label: 'Precio costo', value: currencyFormatter.format(pendingProduct.prcosto) },
            { label: 'Precio venta', value: currencyFormatter.format(pendingProduct.prventa) },
            ...(pendingProduct.proveedor ? [{ label: 'Proveedor', value: pendingProduct.proveedor }] : []),
            ...(pendingProduct.ubicacion ? [{ label: 'Ubicación', value: pendingProduct.ubicacion }] : []),
            ...(pendingProduct.lote ? [{ label: 'Lote', value: pendingProduct.lote }] : []),
          ]}
          onConfirm={confirmProductSave}
          onCancel={() => {
            setPendingProduct(null);
            setPendingProductSaveOptions(null);
          }}
        />
      ) : null}

      {productSaveFeedback ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setProductSaveFeedback(null)}
        >
          <section
            className="modal-panel success-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-save-feedback-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <h2 id="product-save-feedback-title">
                {productSaveFeedback.title}
              </h2>
            </div>

            <p>{productSaveFeedback.message}</p>

            <button
              type="button"
              className={productSaveFeedback.variant === 'success' ? 'primary-button' : 'danger-button'}
              onClick={() => setProductSaveFeedback(null)}
            >
              Entendido
            </button>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default Products;