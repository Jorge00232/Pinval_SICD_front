import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function normalizeMovementType(type: unknown) {
  return String(type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

function getEffectiveMovementType(type: unknown, detail?: unknown) {
  const normalizedType = normalizeMovementType(type);
  const normalizedDetail = normalizeMovementType(detail);

  const candidates = [normalizedType, normalizedDetail];

  if (candidates.some((value) => value.includes('CARGA_MASIVA_PRODUCTOS'))) {
    return 'CARGA_MASIVA_PRODUCTOS';
  }

  if (candidates.some((value) => value.includes('CARGA_MASIVA_CLIENTES'))) {
    return 'CARGA_MASIVA_CLIENTES';
  }

  if (candidates.some((value) => value.includes('CARGA_MASIVA_PROVEEDORES'))) {
    return 'CARGA_MASIVA_PROVEEDORES';
  }

  if (candidates.some((value) => value.includes('CLIENTE_ACTUALIZADO'))) {
    return 'CLIENTE_ACTUALIZADO';
  }

  if (candidates.some((value) => value.includes('CLIENTE_CREADO'))) {
    return 'CLIENTE_CREADO';
  }

  if (candidates.some((value) => value.includes('PROVEEDOR_ACTUALIZADO'))) {
    return 'PROVEEDOR_ACTUALIZADO';
  }

  if (candidates.some((value) => value.includes('PROVEEDOR_CREADO'))) {
    return 'PROVEEDOR_CREADO';
  }

  if (candidates.some((value) => value.includes('USUARIO_ACTUALIZADO'))) {
    return 'USUARIO_ACTUALIZADO';
  }

  if (candidates.some((value) => value.includes('USUARIO_CREADO'))) {
    return 'USUARIO_CREADO';
  }

  if (
    candidates.some(
      (value) =>
        value.includes('USUARIO_2FA_RESETEADO') ||
        value.includes('2FA_RESETEADO') ||
        value.includes('RESET_DE_2FA'),
    )
  ) {
    return 'USUARIO_2FA_RESETEADO';
  }

  if (candidates.some((value) => value.includes('PRODUCTO_ACTUALIZADO'))) {
    return 'PRODUCTO_ACTUALIZADO';
  }

  if (candidates.some((value) => value.includes('PRODUCTO_CREADO'))) {
    return 'PRODUCTO_CREADO';
  }

  return normalizedType || 'MOVIMIENTO';
}

function getMovementTone(type: unknown, detail?: unknown) {
  const effectiveType = getEffectiveMovementType(type, detail);

  if (effectiveType.includes('SALIDA') || effectiveType.includes('VENTA')) {
    return 'danger';
  }

  if (
    effectiveType.includes('CLIENTE') ||
    effectiveType.includes('PROVEEDOR') ||
    effectiveType.includes('USUARIO') ||
    effectiveType.includes('PRODUCTO') ||
    effectiveType.includes('CARGA_MASIVA')
  ) {
    return 'warning';
  }

  return 'ok';
}

function getMovementCategory(type: unknown, detail?: unknown) {
  const effectiveType = getEffectiveMovementType(type, detail);

  if (
    effectiveType.includes('CLIENTE') ||
    effectiveType.includes('PROVEEDOR') ||
    effectiveType.includes('PRODUCTO') ||
    effectiveType.includes('CARGA_MASIVA')
  ) {
    return 'Gestión';
  }

  if (effectiveType.includes('USUARIO')) {
    return 'Seguridad';
  }

  return 'Inventario';
}

function parseMovementDateTime(dateLabel: unknown) {
  const text = String(dateLabel ?? '').trim();

  if (!text) {
    return 0;
  }

  const directDate = new Date(text);

  if (!Number.isNaN(directDate.getTime())) {
    return directDate.getTime();
  }

  const [datePart, rawTimePart = ''] = text.split(',').map((part) => part.trim());
  const dateMatch = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);

  if (!dateMatch) {
    return 0;
  }

  const [, dayText, monthText, yearText] = dateMatch;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);

  let hours = 0;
  let minutes = 0;

  const normalizedTime = rawTimePart
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/a\.\s*m\./g, 'am')
    .replace(/p\.\s*m\./g, 'pm')
    .replace(/a\.m\./g, 'am')
    .replace(/p\.m\./g, 'pm');

  const timeMatch = normalizedTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);

  if (timeMatch) {
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2] ?? 0);

    if (timeMatch[3] === 'pm' && hours < 12) {
      hours += 12;
    }

    if (timeMatch[3] === 'am' && hours === 12) {
      hours = 0;
    }
  }

  const parsedDate = new Date(year, month - 1, day, hours, minutes);

  return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
}

function getMovementIdValue(id: unknown) {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Movements() {
  const { movements } = useInventory();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getMovementTypeLabel = (type: unknown, detail?: unknown) => {
    const effectiveType = getEffectiveMovementType(type, detail);

    if (effectiveType === 'ENTRADA') {
      return t('movements.entry');
    }

    if (effectiveType === 'SALIDA') {
      return t('movements.exit');
    }

    if (effectiveType === 'AJUSTE') {
      return t('movements.adjustment');
    }

    if (effectiveType === 'CARGA_MASIVA_PRODUCTOS') {
      return 'Carga masiva de productos';
    }

    if (effectiveType === 'CARGA_MASIVA_CLIENTES') {
      return 'Carga masiva de clientes';
    }

    if (effectiveType === 'CARGA_MASIVA_PROVEEDORES') {
      return 'Carga masiva de proveedores';
    }

    if (effectiveType === 'CLIENTE_CREADO') {
      return 'Cliente creado';
    }

    if (effectiveType === 'CLIENTE_ACTUALIZADO') {
      return 'Cliente actualizado';
    }

    if (effectiveType === 'PROVEEDOR_CREADO') {
      return 'Proveedor creado';
    }

    if (effectiveType === 'PROVEEDOR_ACTUALIZADO') {
      return 'Proveedor actualizado';
    }

    if (effectiveType === 'USUARIO_CREADO') {
      return 'Usuario creado';
    }

    if (effectiveType === 'USUARIO_ACTUALIZADO') {
      return 'Usuario actualizado';
    }

    if (effectiveType === 'USUARIO_2FA_RESETEADO') {
      return 'Reset de 2FA';
    }

    if (effectiveType === 'PRODUCTO_CREADO') {
      return 'Producto creado';
    }

    if (effectiveType === 'PRODUCTO_ACTUALIZADO') {
      return 'Producto actualizado';
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
    const typePriority: string[] = [
      'ENTRADA',
      'SALIDA',
      'AJUSTE',
      'CARGA_MASIVA_PRODUCTOS',
      'CARGA_MASIVA_CLIENTES',
      'CARGA_MASIVA_PROVEEDORES',
    ];
    const types = movements
      .map((movement) => getEffectiveMovementType(movement.type, movement.detail))
      .filter((type) => type.length > 0);

    return [...new Set([...typePriority, ...types])];
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return movements
      .filter((movement) => {
        const effectiveType = getEffectiveMovementType(movement.type, movement.detail);
        const category = getMovementCategory(movement.type, movement.detail);
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
          getMovementTypeLabel(movement.type, movement.detail).toLowerCase().includes(query);

        const matchesType = selectedType === 'all' || effectiveType === selectedType;
        const matchesUser = selectedUser === 'all' || movement.user === selectedUser;
        const matchesCategory = selectedCategory === 'all' || category === selectedCategory;

        return matchesSearch && matchesType && matchesUser && matchesCategory;
      })
      .sort((firstMovement, secondMovement) => {
        const firstDate = parseMovementDateTime(firstMovement.date);
        const secondDate = parseMovementDateTime(secondMovement.date);

        if (secondDate !== firstDate) {
          return secondDate - firstDate;
        }

        return getMovementIdValue(secondMovement.id) - getMovementIdValue(firstMovement.id);
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
                    <td>{getMovementCategory(movement.type, movement.detail)}</td>
                    <td>
                      <span className={`status ${getMovementTone(movement.type, movement.detail)}`}>
                        {getMovementTypeLabel(movement.type, movement.detail)}
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
