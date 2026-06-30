import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function normalizeMovementType(type: string) {
  return String(type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function getMovementTone(type: string) {
  const normalizedType = normalizeMovementType(type);

  if (normalizedType.includes('SALIDA') || normalizedType.includes('VENTA')) {
    return 'danger';
  }

  if (
    normalizedType.includes('CLIENTE') ||
    normalizedType.includes('PROVEEDOR') ||
    normalizedType.includes('USUARIO')
  ) {
    return 'warning';
  }

  return 'ok';
}

function getMovementCategory(type: string) {
  const normalizedType = normalizeMovementType(type);

  if (
    normalizedType.includes('CLIENTE') ||
    normalizedType.includes('PROVEEDOR')
  ) {
    return 'Gestión';
  }

  if (normalizedType.includes('USUARIO')) {
    return 'Seguridad';
  }

  return 'Inventario';
}

function Movements() {
  const { movements } = useInventory();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getMovementTypeLabel = (type: string) => {
    const normalizedType = normalizeMovementType(type);

    if (normalizedType === 'ENTRADA') {
      return t('movements.entry');
    }

    if (normalizedType === 'SALIDA') {
      return t('movements.exit');
    }

    if (normalizedType === 'AJUSTE') {
      return t('movements.adjustment');
    }

    if (normalizedType === 'CLIENTE_CREADO') {
      return 'Cliente creado';
    }

    if (normalizedType === 'PROVEEDOR_CREADO') {
      return 'Proveedor creado';
    }

    if (normalizedType === 'USUARIO_CREADO') {
      return 'Usuario creado';
    }

    if (normalizedType === 'USUARIO_ACTUALIZADO') {
      return 'Usuario actualizado';
    }

    return String(type || 'Movimiento');
  };

  const uniqueUsers = useMemo(() => {
    const users = movements
      .map((movement) => movement.user)
      .filter((user): user is string => typeof user === 'string' && user.trim().length > 0);

    return [...new Set(users)].sort();
  }, [movements]);

  const uniqueTypes = useMemo(() => {
    const typePriority: string[] = ['Entrada', 'Salida', 'Ajuste'];
    const types = movements
      .map((movement) => String(movement.type ?? '').trim())
      .filter((type) => type.length > 0);

    return [...new Set([...typePriority, ...types])];
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return movements.filter((movement) => {
      const category = getMovementCategory(movement.type);
      const product = String(movement.product ?? '');
      const detail = String(movement.detail ?? '');
      const id = String(movement.id ?? '');
      const user = String(movement.user ?? '');

      const matchesSearch =
        !query ||
        product.toLowerCase().includes(query) ||
        detail.toLowerCase().includes(query) ||
        id.toLowerCase().includes(query) ||
        user.toLowerCase().includes(query) ||
        getMovementTypeLabel(movement.type).toLowerCase().includes(query);

      const matchesType = selectedType === 'all' || movement.type === selectedType;
      const matchesUser = selectedUser === 'all' || movement.user === selectedUser;
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

      return matchesSearch && matchesType && matchesUser && matchesCategory;
    });
  }, [movements, searchTerm, selectedType, selectedUser, selectedCategory]);

  return (
    <AppLayout
      title={t('page.movements.title')}
      description={t('page.movements.description')}
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('movements.fullHistory')}</h2>
          <span>
            {filteredMovements.length} {t('home.movements')}
          </span>
        </div>

        <div
          className="catalog-toolbar"
          style={{
            borderBottom: '1px dashed #e2e8f0',
            paddingBottom: '14px',
            marginBottom: '16px',
          }}
        >
          <label>
            {t('products.search')}
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('products.searchPlaceholder') || 'Buscar...'}
            />
          </label>

          <label>
            Categoría
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              <option value="Inventario">Inventario</option>
              <option value="Gestión">Gestión</option>
              <option value="Seguridad">Seguridad</option>
            </select>
          </label>

          <label>
            {t('movements.type')}
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              <option value="all">{t('reports.all')}</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {getMovementTypeLabel(type)}
                </option>
              ))}
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
                <th>Categoría</th>
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
                    <td>{getMovementCategory(movement.type)}</td>
                    <td>
                      <span className={`status ${getMovementTone(movement.type)}`}>
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td>{movement.product || '-'}</td>
                    <td>{movement.quantity ?? '-'}</td>
                    <td>{movement.user || '-'}</td>
                    <td>{movement.date || '-'}</td>
                    <td>{movement.detail || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>{t('movements.noMovements')}</td>
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
