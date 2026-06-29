import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import { canManageData } from '../api/authApi';
import {
  createSupplier,
  fetchSuppliers,
  type Supplier,
} from '../api/suppliersApi';
import { useLanguage } from '../language/useLanguage';
import { formatRutIfPossible } from '../utils/rut';

type PendingSupplier = Parameters<typeof createSupplier>[0];

function formatIdentifier(value: string | null | undefined) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return '';
  }

  return formatRutIfPossible(rawValue) ?? rawValue;
}

function handleIdentifierInputChange(event: ChangeEvent<HTMLInputElement>) {
  const rawValue = event.currentTarget.value;
  event.currentTarget.value = formatRutIfPossible(rawValue) ?? rawValue;
}

function Suppliers() {
  const { t } = useLanguage();
  const canManage = canManageData();
  const supplierFormRef = useRef<HTMLFormElement | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSupplier, setPendingSupplier] = useState<PendingSupplier | null>(null);
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

  function handleConfirmCreateSupplier() {
    if (!pendingSupplier || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    createSupplier(pendingSupplier)
      .then((createdSupplier) => {
        setSuppliers((current) => [createdSupplier, ...current]);
        setMessage({
          type: 'success',
          text: 'Proveedor registrado correctamente en el backend.',
        });
        setPendingSupplier(null);
        supplierFormRef.current?.reset();
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
        {canManage ? (
          <details className="form-disclosure" open>
            <summary>
              <span>{t('suppliers.newSupplier')}</span>
              <strong>Formulario desplegado</strong>
            </summary>

            <article className="panel products-form-panel form-panel">
              <form
                ref={supplierFormRef}
                className="grid-form products-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setMessage(null);

                  const formData = new FormData(event.currentTarget);
                  const supplier: PendingSupplier = {
                    name: String(formData.get('name')).trim(),
                    identifier: formatIdentifier(String(formData.get('identifier'))),
                    contactName: String(formData.get('contactName')).trim(),
                    phone: String(formData.get('phone')).trim(),
                    email: String(formData.get('email')).trim(),
                  };

                  setPendingSupplier(supplier);
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
                    onChange={handleIdentifierInputChange}
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

        {message ? (
          <p className={`form-message ${message.type}`}>{message.text}</p>
        ) : null}

        <details className="records-disclosure supplier-records-disclosure">
          <summary>
            <span>{t('suppliers.list')}</span>
            <strong>
              {isLoading
                ? 'Cargando...'
                : `${suppliers.length} ${t('suppliers.active')}`}
            </strong>
          </summary>

          <article className="panel records-panel">
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
                        <td>{formatIdentifier(supplier.identifier) || '-'}</td>
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
        </details>
      </section>

      {pendingSupplier ? (
        <ConfirmModal
          isOpen={true}
          title="¿Confirmar registro?"
          subtitle="Se registrará el siguiente proveedor en el sistema."
          confirmLabel={isSaving ? 'Registrando...' : 'Registrar proveedor'}
          cancelLabel="Cancelar"
          details={[
            { label: 'Proveedor', value: pendingSupplier.name },
            { label: 'Identificador', value: formatIdentifier(pendingSupplier.identifier) || '-' },
            { label: 'Contacto', value: pendingSupplier.contactName },
            { label: 'Teléfono', value: pendingSupplier.phone || '-' },
            { label: 'Correo', value: pendingSupplier.email || '-' },
          ]}
          onConfirm={handleConfirmCreateSupplier}
          onCancel={() => {
            if (!isSaving) {
              setPendingSupplier(null);
            }
          }}
        />
      ) : null}
    </AppLayout>
  );
}

export default Suppliers;
