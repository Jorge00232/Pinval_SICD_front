import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Suppliers() {
  const { addSupplier, suppliers } = useInventory();
  const { t } = useLanguage();

  return (
    <AppLayout
      title={t('page.suppliers.title')}
      description={t('page.suppliers.description')}
    >
      <section className="products-layout">
        <article className="panel products-form-panel">
          <div className="panel-heading">
            <h2>{t('suppliers.newSupplier')}</h2>
            <span>{suppliers.length} {t('suppliers.records')}</span>
          </div>

          <form
            className="grid-form products-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addSupplier({
                name: String(formData.get('name')).trim(),
                identifier: String(formData.get('identifier')).trim(),
                contactName: String(formData.get('contactName')).trim(),
                phone: String(formData.get('phone')).trim(),
                email: String(formData.get('email')).trim(),
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              {t('suppliers.name')}
              <input
                name="name"
                placeholder={t('suppliers.namePlaceholder')}
                maxLength={120}
                required
              />
            </label>

            <label>
              {t('suppliers.identifier')}
              <input
                name="identifier"
                placeholder={t('suppliers.identifierPlaceholder')}
                maxLength={60}
              />
            </label>

            <label>
              {t('suppliers.contactPerson')}
              <input
                name="contactName"
                placeholder={t('suppliers.contactPersonPlaceholder')}
                maxLength={120}
                required
              />
            </label>

            <label>
              {t('suppliers.phone')}
              <input
                name="phone"
                placeholder={t('suppliers.phonePlaceholder')}
                maxLength={40}
              />
            </label>

            <label>
              {t('suppliers.email')}
              <input
                name="email"
                type="email"
                placeholder={t('suppliers.emailPlaceholder')}
                maxLength={120}
              />
            </label>

            <button type="submit">{t('suppliers.addSupplier')}</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('suppliers.list')}</h2>
            <span>{suppliers.length} {t('suppliers.active')}</span>
          </div>

          <div className="table-wrap products-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('page.suppliers.title')}</th>
                  <th>{t('suppliers.identifier')}</th>
                  <th>{t('suppliers.contactPerson')}</th>
                  <th>{t('suppliers.phone')}</th>
                  <th>{t('suppliers.email')}</th>
                  <th>{t('suppliers.lastPurchase')}</th>
                  <th>{t('suppliers.purchases')}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <tr key={supplier.name}>
                      <td className="description-cell">{supplier.name}</td>
                      <td>{supplier.identifier || '-'}</td>
                      <td>{supplier.contactName}</td>
                      <td>{supplier.phone || '-'}</td>
                      <td>{supplier.email || '-'}</td>
                      <td>{supplier.lastPurchase}</td>
                      <td className="numeric-cell">{supplier.totalPurchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>{t('suppliers.noSuppliers')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AppLayout>
  );
}

export default Suppliers;
