import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Customers() {
  const { addCustomer, customers } = useInventory();
  const { t } = useLanguage();
  const totalB2B = customers.filter(
    (customer) => customer.customerType === 'B2B',
  ).length;
  const totalB2C = customers.filter(
    (customer) => customer.customerType === 'B2C',
  ).length;

  return (
    <AppLayout
      title={t('page.customers.title')}
      description={t('page.customers.description')}
    >
      <section className="products-layout">
        <article className="panel products-form-panel">
          <div className="panel-heading">
            <h2>{t('customers.newCustomer')}</h2>
            <span>{customers.length} {t('customers.records')}</span>
          </div>

          <form
            className="grid-form products-form"
            onSubmit={(event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);

              addCustomer({
                name: String(formData.get('name')).trim(),
                contact: String(formData.get('contact')).trim(),
                identifier: String(formData.get('identifier')).trim(),
                customerType: String(formData.get('customerType')) as 'B2B' | 'B2C',
              });

              event.currentTarget.reset();
            }}
          >
            <label>
              {t('customers.name')}
              <input
                name="name"
                placeholder={t('customers.namePlaceholder')}
                maxLength={120}
                required
              />
            </label>

            <label>
              {t('customers.type')}
              <select name="customerType" defaultValue="B2B" required>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </label>

            <label>
              {t('customers.identifier')}
              <input
                name="identifier"
                placeholder={t('customers.identifierPlaceholder')}
                maxLength={60}
              />
            </label>

            <label>
              {t('customers.contact')}
              <input
                name="contact"
                placeholder={t('customers.contactPlaceholder')}
                maxLength={120}
                required
              />
            </label>

            <button type="submit">{t('customers.addCustomer')}</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('customers.registry')}</h2>
            <span>
              {totalB2B} B2B / {totalB2C} B2C
            </span>
          </div>

          <div className="table-wrap products-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('page.customers.title')}</th>
                  <th>{t('customers.type')}</th>
                  <th>{t('customers.identifier')}</th>
                  <th>{t('customers.contact')}</th>
                  <th>{t('customers.lastPurchase')}</th>
                  <th>{t('customers.purchases')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.name}>
                      <td className="description-cell">{customer.name}</td>
                      <td>
                        <span
                          className={`customer-type-badge ${
                            customer.customerType === 'B2B' ? 'b2b' : 'b2c'
                          }`}
                        >
                          {customer.customerType}
                        </span>
                      </td>
                      <td>{customer.identifier || '-'}</td>
                      <td>{customer.contact}</td>
                      <td>{customer.lastPurchase}</td>
                      <td className="numeric-cell">{customer.purchases}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>{t('customers.noCustomers')}</td>
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

export default Customers;
