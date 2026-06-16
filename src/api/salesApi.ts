import { getAccessToken } from './authApi';
import { formatRutIfPossible, normalizeRutForSubmit } from '../utils/rut';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type SaleItem = {
  id: string;
  codigo: string;
  productName: string | null;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  stockAfter: number | null;
};

export type Sale = {
  id: string;
  date: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  customerIdentifier: string | null;
  documentType: string;
  documentNumber: string;
  createdBy: string | null;
  createdByRole: string | null;
  createdAt: string;
  isRestricted: boolean;
  items: SaleItem[];
};

export type CreateSaleInput = {
  date: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  customerIdentifier?: string | null;
  documentType: string;
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

function normalizeSale(value: unknown): Sale {
  const sale = value as Partial<Sale>;

  return {
    id: String(sale.id ?? ''),
    date: String(sale.date ?? ''),
    customerName: String(sale.customerName ?? '').trim(),
    customerType: sale.customerType === 'B2C' ? 'B2C' : 'B2B',
    customerIdentifier:
      sale.customerIdentifier === null || sale.customerIdentifier === undefined
        ? null
        : formatRutIfPossible(String(sale.customerIdentifier).trim()),
    documentType: String(sale.documentType ?? '').trim(),
    documentNumber: String(sale.documentNumber ?? '').trim(),
    createdBy:
      sale.createdBy === null || sale.createdBy === undefined
        ? null
        : String(sale.createdBy),
    createdByRole:
      sale.createdByRole === null || sale.createdByRole === undefined
        ? null
        : String(sale.createdByRole),
    createdAt: String(sale.createdAt ?? ''),
    isRestricted: sale.isRestricted === true,
    items: Array.isArray(sale.items)
      ? sale.items.map((item) => ({
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

function normalizeSaleInput(input: CreateSaleInput): CreateSaleInput {
  return {
    date: input.date,
    customerName: input.customerName.trim(),
    customerType: input.customerType === 'B2C' ? 'B2C' : 'B2B',
    customerIdentifier: normalizeRutForSubmit(input.customerIdentifier),
    documentType: input.documentType.trim(),
    documentNumber: input.documentNumber.trim(),
    items: input.items.map((item) => ({
      codigo: item.codigo.trim(),
      quantity: Number(item.quantity),
    })),
  };
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  const message = body?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

export async function fetchSales() {
  const response = await fetch(`${apiBaseUrl}/sales`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudieron cargar las ventas.'));
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de ventas no tiene el formato esperado.');
  }

  return data.map(normalizeSale);
}

export async function createSale(input: CreateSaleInput) {
  const response = await fetch(`${apiBaseUrl}/sales`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizeSaleInput(input)),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo registrar la venta.'));
  }

  return normalizeSale(await response.json());
}
