import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import ConfirmModal from '../components/ConfirmModal';
import { canManageData } from '../api/authApi';
import {
  createCustomer,
  fetchCustomers,
  type Customer,
} from '../api/customersApi';
import { useLanguage } from '../language/useLanguage';
import { formatRutIfPossible } from '../utils/rut';

type PendingCustomer = Parameters<typeof createCustomer>[0];

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

function Customers() {
  const { t } = useLanguage();
  const canManage = canManageData();
  const customerFormRef = useRef<HTMLFormElement | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'B2B' | 'B2C'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<PendingCustomer | null>(null);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const totalB2B = customers.filter(
    (customer) => customer.customerType === 'B2B',
  ).length;

  const totalB2C = customers.filter(
    (customer) => customer.customerType === 'B2C',
  ).length;

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.identifier?.toLowerCase().includes(normalizedSearch) ||
        customer.contact?.toLowerCase().includes(normalizedSearch);

      const matchesType =
        selectedType === 'ALL' || customer.customerType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [customers, searchTerm, selectedType]);

  function loadCustomers() {
    setIsLoading(true);
    setMessage(null);

    fetchCustomers()
      .then((data) => {
        setCustomers(data);
      })
      .catch((error) => {
        setCustomers([]);
        setMessage({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los clientes desde el backend.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleConfirmCreateCustomer() {
    if (!pendingCustomer || isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    createCustomer(pendingCustomer)
      .then((createdCustomer) => {
        setCustomers((current) => [createdCustomer, ...current]);
        setMessage({
          type: 'success',
          text: 'Cliente registrado correctamente en el backend.',
        });
        setPendingCustomer(null);
        customerFormRef.current?.reset();
      })
      .catch((error) => {
        setMessage({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'No se pudo registrar el cliente.',
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <AppLayout
      title={t('page.customers.title')}
      description={t('page.customers.description')}
    >
      <section className="stacked-management-layout">
        {canManage ? (
          <details className="form-disclosure" open>
            <summary>
              <span>{t('customers.newCustomer')}</span>
              <strong>Formulario desplegado</strong>
            </summary>

            <article className="panel products-form-panel form-panel">
              <form
                ref={customerFormRef}
                className="grid-form products-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setMessage(null);

                  const formData = new FormData(event.currentTarget);
                  const customer: PendingCustomer = {
                    name: String(formData.get('name')).trim(),
                    customerType: String(formData.get('customerType')) as
                      | 'B2B'
                      | 'B2C',
                    identifier: formatIdentifier(String(formData.get('identifier'))),
                    contact: String(formData.get('contact')).trim(),
                  };

                  setPendingCustomer(customer);
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
                    onChange={handleIdentifierInputChange}
                  />
                </label>

                <label>
                  {t('customers.contact')}
                  <input
                    name="contact"
                    placeholder={t('customers.contactPlaceholder')}
                    maxLength={120}
                  />
                </label>

                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : t('customers.addCustomer')}
                </button>
              </form>
            </article>
          </details>
        ) : null}

        {message ? (
          <p className={`form-message ${message.type}`}>{message.text}</p>
        ) : null}

        <details className="records-disclosure customer-records-disclosure">
          <summary>
            <span>{t('customers.registry')}</span>
            <strong>
              {isLoading
                ? 'Cargando...'
                : `${filteredCustomers.length} ${t('customers.records')}`}
            </strong>
          </summary>

          <article className="panel records-panel">
            <div className="filters-row">
              <label>
                Buscar
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
                  onChange={(event) =>
                    setSelectedType(event.target.value as 'ALL' | 'B2B' | 'B2C')
                  }
                >
                  <option value="ALL">Todos</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </label>

              <div className="summary-pill">
                <strong>{totalB2B}</strong>
                <span>B2B</span>
              </div>

              <div className="summary-pill">
                <strong>{totalB2C}</strong>
                <span>B2C</span>
              </div>
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={6}>Cargando clientes desde el backend...</td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="description-cell">{customer.name}</td>
                        <td>{customer.customerType}</td>
                        <td>{formatIdentifier(customer.identifier) || '-'}</td>
                        <td>{customer.contact || '-'}</td>
                        <td>{customer.lastPurchase || 'Sin compras'}</td>
                        <td className="numeric-cell">{customer.purchases ?? 0}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        {t('customers.noCustomers') || 'Sin clientes registrados'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </details>
      </section>

      {pendingCustomer ? (
        <ConfirmModal
          isOpen={true}
          title="¿Confirmar registro?"
          subtitle="Se registrará el siguiente cliente en el sistema."
          confirmLabel={isSaving ? 'Registrando...' : 'Registrar cliente'}
          cancelLabel="Cancelar"
          details={[
            { label: 'Cliente', value: pendingCustomer.name },
            { label: 'Tipo', value: pendingCustomer.customerType },
            { label: 'Identificador', value: formatIdentifier(pendingCustomer.identifier) || '-' },
            { label: 'Contacto', value: pendingCustomer.contact || '-' },
          ]}
          onConfirm={handleConfirmCreateCustomer}
          onCancel={() => {
            if (!isSaving) {
              setPendingCustomer(null);
            }
          }}
        />
      ) : null}
    </AppLayout>
  );
}

export default Customers;
