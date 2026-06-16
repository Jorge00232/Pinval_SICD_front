import { getAccessToken } from './authApi';
import { formatRutIfPossible, normalizeRutForSubmit } from '../utils/rut';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type Customer = {
  id: string;
  name: string;
  contact: string;
  identifier: string | null;
  customerType: 'B2B' | 'B2C';
  lastPurchase: string;
  purchases: number;
  isActive: boolean;
  isRestricted: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCustomerInput = {
  name: string;
  contact: string;
  identifier?: string | null;
  customerType: 'B2B' | 'B2C';
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

function normalizeCustomer(value: unknown): Customer {
  const customer = value as Partial<Customer>;
  const identifier =
    customer.identifier === null || customer.identifier === undefined
      ? null
      : formatRutIfPossible(String(customer.identifier).trim());

  return {
    id: String(customer.id ?? ''),
    name: String(customer.name ?? '').trim(),
    contact: String(customer.contact ?? 'Sin información').trim(),
    identifier,
    customerType: customer.customerType === 'B2C' ? 'B2C' : 'B2B',
    lastPurchase: String(customer.lastPurchase ?? 'Sin compras'),
    purchases: toNumber(customer.purchases),
    isActive: customer.isActive !== false,
    isRestricted: customer.isRestricted === true,
    createdAt: customer.createdAt ? String(customer.createdAt) : undefined,
    updatedAt: customer.updatedAt ? String(customer.updatedAt) : undefined,
  };
}

function normalizeCustomerInput(input: CreateCustomerInput): CreateCustomerInput {
  return {
    name: input.name.trim(),
    contact: input.contact.trim(),
    identifier: normalizeRutForSubmit(input.identifier),
    customerType: input.customerType === 'B2C' ? 'B2C' : 'B2B',
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

export async function fetchCustomers() {
  const response = await fetch(`${apiBaseUrl}/customers`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readError(response, 'No se pudieron cargar los clientes.'),
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de clientes no tiene el formato esperado.');
  }

  return data.map(normalizeCustomer);
}

export async function createCustomer(input: CreateCustomerInput) {
  const response = await fetch(`${apiBaseUrl}/customers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizeCustomerInput(input)),
  });

  if (!response.ok) {
    throw new Error(await readError(response, 'No se pudo crear el cliente.'));
  }

  return normalizeCustomer(await response.json());
}