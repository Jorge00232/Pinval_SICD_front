import { useState, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Customers() {
  const { addCustomer, customers } = useInventory();
  const { t } = useLanguage();
  const canManage = canManageData();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const totalB2B = customers.filter(
    (customer) => customer.customerType === 'B2B',
  ).length;
  const totalB2C = customers.filter(
    (customer) => customer.customerType === 'B2C',
  ).length;

  // Reactive Multi-attribute filter
  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        (customer.identifier && customer.identifier.toLowerCase().includes(query)) ||
        customer.contact.toLowerCase().includes(query);

      const matchesType =
        selectedType === 'all' || customer.customerType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, selectedType]);

  return (
    <AppLayout
      title={t('page.customers.title')}
      description={t('page.customers.description')}
    >
      <section className="stacked-management-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>{t('customers.registry')}</h2>
            <span>
              {totalB2B} B2B / {totalB2C} B2C
            </span>
          </div>

          {/* Dynamic Filters Toolbar */}
          <div className="catalog-toolbar" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
            <label>
              {t('products.search')}
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('customers.namePlaceholder') || 'Buscar cliente...'}
              />
            </label>
            <label>
              {t('customers.type')}
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                <option value="all">{t('reports.all')}</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </label>
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
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
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
                    <td colSpan={6}>{t('customers.noCustomers') || 'Sin clientes registrados'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {canManage ? (
          <details className="form-disclosure">
            <summary>
              <span>{t('customers.newCustomer')}</span>
              <strong>
                {customers.length} {t('customers.records')}
              </strong>
            </summary>

            <article className="panel products-form-panel form-panel">
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
          </details>
        ) : null}
      </section>
    </AppLayout>
  );
}

export default Customers;
