import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  currencyFormatter,
  FAMILY_LABELS,
  type ProductFamily,
} from '../data/mockData';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

const BASE_FAMILIES = Object.keys(FAMILY_LABELS) as ProductFamily[];

function Products() {
  const { addProduct, products } = useInventory();
  const { t } = useLanguage();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<ProductFamily[]>([]);
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

  return (
    <AppLayout
      title={t('page.products.title')}
      description={t('page.products.description')}
    >
      <section className="products-layout">
        <article className="panel products-form-panel">
          <div className="panel-heading">
            <h2>{t('products.newProduct')}</h2>
            <span>{products.length} {t('products.records')}</span>
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
            <button type="submit">{t('products.addProduct')}</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('products.catalog')}</h2>
            <span>{products.length} {t('products.productsCount')}</span>
          </div>
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
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>{t('products.noProducts')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {isCategoryModalOpen ? (
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
