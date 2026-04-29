import type { Product, ProductFamily } from '../data/mockData';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiProduct = Partial<{
  codigo: string;
  descrip: string;
  familia: string;
  stock: number | string;
  prcosto: number | string;
  prventa: number | string;
  minStock: number | string;
}>;

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeApiProduct(product: ApiProduct): Product | null {
  const codigo = typeof product.codigo === 'string' ? product.codigo.trim() : '';
  const descrip = typeof product.descrip === 'string' ? product.descrip.trim() : '';

  if (!codigo || !descrip) {
    return null;
  }

  return {
    codigo,
    descrip,
    familia: (product.familia || 'NO TIENE') as ProductFamily,
    stock: toNumber(product.stock),
    prcosto: toNumber(product.prcosto),
    prventa: toNumber(product.prventa),
    minStock: toNumber(product.minStock),
  };
}

export async function fetchProducts() {
  const response = await fetch(`${apiBaseUrl}/products`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar los productos desde el backend.');
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('La respuesta de productos no tiene el formato esperado.');
  }

  return data
    .map((product) => normalizeApiProduct(product as ApiProduct))
    .filter((product): product is Product => product !== null);
}
