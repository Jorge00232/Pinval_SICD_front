const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ApiInventoryMovementInput = {
  codigo: string;
  productName?: string | null;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  stockAfter?: number | null;
  reason?: string | null;
  user?: string | null;
  detail?: string | null;
  createdAt?: string | null;
};

export type ApiInventoryMovement = {
  id: number;
  codigo: string;
  productName: string | null;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  stockAfter: number | null;
  reason: string | null;
  user: string | null;
  detail: string | null;
  createdAt: string;
};

export type BackendInventoryMovement = ApiInventoryMovement;

function normalizeType(value: unknown): 'ENTRADA' | 'SALIDA' | 'AJUSTE' {
  const type = String(value ?? '').toUpperCase();

  if (type === 'SALIDA') {
    return 'SALIDA';
  }

  if (type === 'AJUSTE') {
    return 'AJUSTE';
  }

  return 'ENTRADA';
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMovement(value: unknown): ApiInventoryMovement {
  const movement = value as Partial<ApiInventoryMovement>;

  return {
    id: toNumber(movement.id),
    codigo: String(movement.codigo ?? ''),
    productName:
      movement.productName === null || movement.productName === undefined
        ? null
        : String(movement.productName),
    type: normalizeType(movement.type),
    quantity: toNumber(movement.quantity),
    unitPrice: toNullableNumber(movement.unitPrice),
    totalPrice: toNullableNumber(movement.totalPrice),
    stockAfter: toNullableNumber(movement.stockAfter),
    reason:
      movement.reason === null || movement.reason === undefined
        ? null
        : String(movement.reason),
    user:
      movement.user === null || movement.user === undefined
        ? null
        : String(movement.user),
    detail:
      movement.detail === null || movement.detail === undefined
        ? null
        : String(movement.detail),
    createdAt: String(movement.createdAt ?? ''),
  };
}

export async function fetchInventoryMovements(codigo?: string) {
  const params = codigo ? `?codigo=${encodeURIComponent(codigo)}` : '';
  const response = await fetch(`${apiBaseUrl}/inventory-movements${params}`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los movimientos desde el backend.');
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de movimientos no tiene el formato esperado.');
  }

  return data.map(normalizeMovement);
}

export async function createInventoryMovements(
  movements: ApiInventoryMovementInput | ApiInventoryMovementInput[],
) {
  const response = await fetch(`${apiBaseUrl}/inventory-movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movements),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.message ?? 'No se pudieron registrar los movimientos.',
    );
  }

  return response.json();
}