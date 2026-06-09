const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type CreateInventoryMovementInput = {
  codigo: string;
  productName?: string;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  quantity: number;
  unitPrice?: number | null;
  totalPrice?: number | null;
  stockAfter?: number | null;
  reason?: string | null;
  createdAt?: string | null;
};

export type BackendInventoryMovement = {
  id: number;
  codigo: string;
  productName: string | null;
  type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  stockAfter: number | null;
  reason: string | null;
  createdAt: string;
};

export async function createInventoryMovements(
  movements: CreateInventoryMovementInput[],
) {
  if (movements.length === 0) {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/inventory-movements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(movements),
  });

  if (!response.ok) {
    throw new Error('No se pudieron sincronizar los movimientos con el backend.');
  }

  return response.json();
}

export async function fetchInventoryMovements() {
  const response = await fetch(`${apiBaseUrl}/inventory-movements`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los movimientos desde el backend.');
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de movimientos no tiene el formato esperado.');
  }

  return data as BackendInventoryMovement[];
}