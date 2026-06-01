import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Movements() {
  const { movements } = useInventory();
  const { t } = useLanguage();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');

  const getMovementTypeLabel = (type: string) => {
    if (type === 'Entrada') {
      return t('movements.entry');
    }

    if (type === 'Salida') {
      return t('movements.exit');
    }

    return t('movements.adjustment');
  };

  // Dynamically collect unique operators who registered movements
  const uniqueUsers = useMemo(() => {
    const users = movements
      .map((m) => m.user)
      .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
    return [...new Set(users)].sort();
  }, [movements]);

  // Reactive Multi-attribute filter
  const filteredMovements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesSearch =
        !query ||
        m.product.toLowerCase().includes(query) ||
        m.detail.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query);

      const matchesType =
        selectedType === 'all' || m.type === selectedType;

      const matchesUser =
        selectedUser === 'all' || m.user === selectedUser;

      return matchesSearch && matchesType && matchesUser;
    });
  }, [movements, searchTerm, selectedType, selectedUser]);

  return (
    <AppLayout
      title={t('page.movements.title')}
      description={t('page.movements.description')}
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('movements.fullHistory')}</h2>
          <span>{filteredMovements.length} {t('home.movements')}</span>
        </div>

        {/* Dynamic Filters Toolbar */}
        <div className="catalog-toolbar" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
          <label>
            {t('products.search')}
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('products.searchPlaceholder') || 'Buscar...'}
            />
          </label>
          <label>
            {t('movements.type')}
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              <option value="Entrada">{t('movements.entry')}</option>
              <option value="Salida">{t('movements.exit')}</option>
              <option value="Ajuste">{t('movements.adjustment')}</option>
            </select>
          </label>
          <label>
            {t('movements.user')}
            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('movements.type')}</th>
                <th>{t('movements.product')}</th>
                <th>{t('movements.quantity')}</th>
                <th>{t('movements.user')}</th>
                <th>{t('movements.date')}</th>
                <th>{t('movements.detail')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <span
                        className={`status ${
                          movement.type === 'Salida' ? 'danger' : 'ok'
                        }`}
                      >
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td>{movement.product}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.user}</td>
                    <td>{movement.date}</td>
                    <td>{movement.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>{t('movements.noMovements')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default Movements;
