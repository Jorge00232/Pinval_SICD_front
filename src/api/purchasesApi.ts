import { getAccessToken } from './authApi';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type PurchaseItem = {
  id: string;
  codigo: string;
  productName: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  stockAfter: number | null;
};

export type Purchase = {
  id: string;
  date: string;
  supplierName: string;
  documentNumber: string;
  createdBy: string | null;
  createdByRole: string | null;
  createdAt: string;
  items: PurchaseItem[];
};

export type CreatePurchaseInput = {
  date: string;
  supplierName: string;
  documentNumber: string;
  items: Array<{
    codigo: string;
    quantity: number;
  }>;
};

function getAuthHeaders() {
  const accessToken = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
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

function normalizePurchase(value: unknown): Purchase {
  const purchase = value as Partial<Purchase>;

  return {
    id: String(purchase.id ?? ''),
    date: String(purchase.date ?? ''),
    supplierName: String(purchase.supplierName ?? ''),
    documentNumber: String(purchase.documentNumber ?? ''),
    createdBy:
      purchase.createdBy === null || purchase.createdBy === undefined
        ? null
        : String(purchase.createdBy),
    createdByRole:
      purchase.createdByRole === null || purchase.createdByRole === undefined
        ? null
        : String(purchase.createdByRole),
    createdAt: String(purchase.createdAt ?? ''),
    items: Array.isArray(purchase.items)
      ? purchase.items.map((item) => ({
          id: String(item.id ?? ''),
          codigo: String(item.codigo ?? ''),
          productName:
            item.productName === null || item.productName === undefined
              ? null
              : String(item.productName),
          quantity: toNumber(item.quantity),
          unitPrice: toNullableNumber(item.unitPrice),
          totalPrice: toNullableNumber(item.totalPrice),
          stockAfter: toNullableNumber(item.stockAfter),
        }))
      : [],
  };
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  return body?.message ?? fallback;
}

export async function fetchPurchases() {
  const response = await fetch(`${apiBaseUrl}/purchases`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudieron cargar las compras.'));
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de compras no tiene el formato esperado.');
  }

  return data.map(normalizePurchase);
}

export async function createPurchase(input: CreatePurchaseInput) {
  const response = await fetch(`${apiBaseUrl}/purchases`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo registrar la compra.'));
  }

  return normalizePurchase(await response.json());
}
