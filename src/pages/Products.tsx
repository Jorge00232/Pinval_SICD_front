import { useMemo, useState } from 'react';
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

function Products() {
  const { addProduct, products } = useInventory();
  const { t } = useLanguage();
  const canManage = canManageData();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<ProductFamily[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
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
  const productsToReview = products.filter(
    (product) => product.dataIssue === 'STOCK_NEGATIVO' || product.stock <= product.minStock,
  );
  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.codigo.toLowerCase().includes(normalizedSearch) ||
        product.descrip.toLowerCase().includes(normalizedSearch);
      const matchesFamily =
        selectedFamily === 'all' || product.familia === selectedFamily;

      return matchesSearch && matchesFamily;
    });
  }, [products, searchTerm, selectedFamily]);

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
            <span>{products.length} {t('products.productsCount')}</span>
          </div>
<<<<<<< Updated upstream
          <div className="table-wrap products-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('products.code')}</th>
                  <th>{t('products.description')}</th>
                  <th>{t('inventory.family')}</th>
                  <th>{t('products.stock')}</th>
                  <th>{t('products.costPrice')}</th>
                  <th>{t('products.salePrice')}</th>
                  <th>{t('products.costValue')}</th>
                  <th>{t('products.saleValue')}</th>
                  <th>{t('products.minimumStock')}</th>
                  <th>{t('inventory.fecha')}</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => {
                    const sbtot = product.stock * product.prcosto;
                    const sbtotal = product.stock * product.prventa;

                    return (
                      <tr key={product.codigo}>
                        <td className="code-cell">{product.codigo}</td>
                        <td className="description-cell">{product.descrip}</td>
                        <td>{FAMILY_LABELS[product.familia] ?? product.familia}</td>
                        <td className="numeric-cell">
                          {product.stock.toLocaleString('es-CL')}
                        </td>
                        <td className="numeric-cell">
                          {currencyFormatter.format(product.prcosto)}
                        </td>
                        <td className="numeric-cell">
                          {currencyFormatter.format(product.prventa)}
                        </td>
                        <td className="numeric-cell">
                          {currencyFormatter.format(sbtot)}
                        </td>
                        <td className="numeric-cell">
                          {currencyFormatter.format(sbtotal)}
                        </td>
                        <td className="numeric-cell">{product.minStock}</td>
                        <td>{formatDate(product.fecha)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10}>{t('products.noProducts')}</td>
                  </tr>
                )}
              </tbody>
            </table>
=======
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
>>>>>>> Stashed changes
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

                return (
                  <article className="catalog-card" key={product.codigo}>
                    <div className="catalog-card-head">
                      <span className="catalog-icon">
                        {family.slice(0, 2).toUpperCase()}
                      </span>
                      <span className={`status ${needsReview ? 'danger' : 'ok'}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <strong>{product.descrip}</strong>
                    <p>{product.codigo} · {family}</p>
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
                      <div>
                        <span>{t('products.costPrice')}: {currencyFormatter.format(product.prcosto)}</span>
                        <span>{t('products.minimumStock')}: {product.minStock}</span>
                        <span>{t('products.category')}: {family}</span>
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

        {canManage ? (
          <details className="form-disclosure">
            <summary>
              <span>{t('products.newProduct')}</span>
              <strong>
                {products.length} {t('products.records')}
              </strong>
            </summary>

            <article className="panel products-form-panel form-panel">
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
                  });

                  event.currentTarget.reset();
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
                <button type="submit">{t('products.addProduct')}</button>
              </form>
            </article>
          </details>
        ) : null}
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
    </AppLayout>
  );
}

export default Products;
