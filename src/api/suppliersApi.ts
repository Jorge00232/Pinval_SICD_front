import { getAccessToken } from './authApi';
import { formatRutIfPossible, normalizeRutForSubmit } from '../utils/rut';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Supplier = {
  id: string;
  name: string;
  identifier: string | null;
  contactName: string;
  phone: string;
  email: string;
  lastPurchase: string;
  totalPurchases: number;
  isActive: boolean;
  isRestricted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSupplierInput = {
  name: string;
  identifier?: string | null;
  contactName: string;
  phone?: string | null;
  email?: string | null;
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

function normalizeSupplier(value: unknown): Supplier {
  const supplier = value as Partial<Supplier>;
  const identifier =
    supplier.identifier === null || supplier.identifier === undefined
      ? null
      : formatRutIfPossible(String(supplier.identifier).trim());

  return {
    id: String(supplier.id ?? ''),
    name: String(supplier.name ?? '').trim(),
    identifier,
    contactName: String(supplier.contactName ?? 'Sin información').trim(),
    phone: String(supplier.phone ?? 'Sin información').trim(),
    email: String(supplier.email ?? 'Sin información').trim(),
    lastPurchase: String(supplier.lastPurchase ?? 'Sin compras'),
    totalPurchases: toNumber(supplier.totalPurchases),
    isActive: supplier.isActive !== false,
    isRestricted: supplier.isRestricted === true,
    createdAt: supplier.createdAt ? String(supplier.createdAt) : undefined,
    updatedAt: supplier.updatedAt ? String(supplier.updatedAt) : undefined,
  };
}

function normalizeSupplierInput(input: CreateSupplierInput): CreateSupplierInput {
  return {
    name: input.name.trim(),
    identifier: normalizeRutForSubmit(input.identifier),
    contactName: input.contactName.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
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

export async function fetchSuppliers() {
  const response = await fetch(`${apiBaseUrl}/suppliers`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readError(response, 'No se pudieron cargar los proveedores.'),
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de proveedores no tiene el formato esperado.');
  }

  return data.map(normalizeSupplier);
}

export async function createSupplier(input: CreateSupplierInput) {
  const response = await fetch(`${apiBaseUrl}/suppliers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizeSupplierInput(input)),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo crear el proveedor.'));
  }

  return normalizeSupplier(await response.json());
}