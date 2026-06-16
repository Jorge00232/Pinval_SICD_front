import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import {
  createSupplier,
  fetchSuppliers,
  type Supplier,
} from '../api/suppliersApi';
import { useLanguage } from '../language/useLanguage';

function Suppliers() {
  const { t } = useLanguage();
  const canManage = canManageData();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null,
  );

  function loadSuppliers() {
    setIsLoading(true);
    setMessage(null);

    fetchSuppliers()
      .then((data) => {
        setSuppliers(data);
      })
      .catch((error) => {
        setSuppliers([]);
        setMessage({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los proveedores desde el backend.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  return (
    <AppLayout
      title={t('page.suppliers.title')}
      description={t('page.suppliers.description')}
    >
      <section className="stacked-management-layout">
        <article className="panel">
          <div className="panel-heading">
            <h2>{t('suppliers.list')}</h2>
            <span>
              {isLoading
                ? 'Cargando...'
                : `${suppliers.length} ${t('suppliers.active')}`}
            </span>
          </div>

          {message ? (
            <p className={`form-message ${message.type}`}>{message.text}</p>
          ) : null}

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
                {isLoading ? (
                  <tr>
                    <td colSpan={7}>Cargando proveedores desde el backend...</td>
                  </tr>
                ) : suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="description-cell">{supplier.name}</td>
                      <td>{supplier.identifier || '-'}</td>
                      <td>{supplier.contactName}</td>
                      <td>{supplier.phone}</td>
                      <td>{supplier.email}</td>
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

        {canManage ? (
          <details className="form-disclosure">
            <summary>
              <span>{t('suppliers.newSupplier')}</span>
              <strong>
                {suppliers.length} {t('suppliers.records')}
              </strong>
            </summary>

            <article className="panel products-form-panel form-panel">
              <form
                className="grid-form products-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setIsSaving(true);
                  setMessage(null);

                  const form = event.currentTarget;
                  const formData = new FormData(form);

                  createSupplier({
                    name: String(formData.get('name')).trim(),
                    identifier: String(formData.get('identifier')).trim(),
                    contactName: String(formData.get('contactName')).trim(),
                    phone: String(formData.get('phone')).trim(),
                    email: String(formData.get('email')).trim(),
                  })
                    .then((createdSupplier) => {
                      setSuppliers((current) => [createdSupplier, ...current]);
                      setMessage({
                        type: 'success',
                        text: 'Proveedor registrado correctamente en el backend.',
                      });
                      form.reset();
                    })
                    .catch((error) => {
                      setMessage({
                        type: 'error',
                        text:
                          error instanceof Error
                            ? error.message
                            : 'No se pudo registrar el proveedor.',
                      });
                    })
                    .finally(() => {
                      setIsSaving(false);
                    });
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

                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : t('suppliers.addSupplier')}
                </button>
              </form>
            </article>
          </details>
        ) : null}
      </section>
    </AppLayout>
  );
}

export default Suppliers;
