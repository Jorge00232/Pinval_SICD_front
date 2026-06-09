import type { Product, ProductFamily } from '../data/mockData';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ApiProduct = Partial<{
  codigo: string;
  descrip: string;
  displayName: string;
  searchName: string;
  familia: string;
  stock: number | string;
  stockOriginal: number | string;
  dataIssue: 'STOCK_NEGATIVO' | null;
  prcosto: number | string;
  prventa: number | string;
  minStock: number | string;
  fecha: string | null;
  ubicacion: string | null;
  proveedor: string | null;
  lote: string | null;
  fechaCaducidad: string | null;
}>;

export type ExistenceCardMovement = {
  id: number;
  fecha: string;
  detalle: string;
  entrada: number;
  salida: number;
  stockTotal: number | null;
  precioUnitario: number | null;
  total: number | null;
};

export type ProductExistenceCard = {
  codigo: string;
  descrip: string;
  displayName: string;
  searchName: string;
  familia: string;
  currentStock: number;
  stockOriginal: number;
  dataIssue: 'STOCK_NEGATIVO' | null;
  totalEntradas: number;
  totalSalidas: number;
  prcosto: number;
  prventa: number;
  stockValueBySalePrice: number;
  stockValueByCostPrice: number;
  movements: ExistenceCardMovement[];
};

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
    displayName:
      typeof product.displayName === 'string' && product.displayName.trim()
        ? product.displayName.trim()
        : descrip,
    searchName:
      typeof product.searchName === 'string' && product.searchName.trim()
        ? product.searchName.trim()
        : descrip.toLowerCase(),
    familia: (product.familia || 'NO TIENE') as ProductFamily,
    stock: toNumber(product.stock),
    stockOriginal:
      product.stockOriginal === undefined
        ? toNumber(product.stock)
        : toNumber(product.stockOriginal),
    dataIssue: product.dataIssue === 'STOCK_NEGATIVO' ? 'STOCK_NEGATIVO' : null,
    prcosto: toNumber(product.prcosto),
    prventa: toNumber(product.prventa),
    minStock: toNumber(product.minStock),
    fecha: product.fecha ? String(product.fecha) : undefined,
    ubicacion: product.ubicacion ? String(product.ubicacion).trim() : undefined,
    proveedor: product.proveedor ? String(product.proveedor).trim() : undefined,
    lote: product.lote ? String(product.lote).trim() : undefined,
    fechaCaducidad: product.fechaCaducidad ? String(product.fechaCaducidad).trim() : undefined,
  };
}

function normalizeExistenceCard(data: unknown): ProductExistenceCard {
  const card = data as Partial<ProductExistenceCard>;

  return {
    codigo: String(card.codigo ?? '').trim(),
    descrip: String(card.descrip ?? '').trim(),
    displayName: String(card.displayName ?? card.descrip ?? 'Producto sin nombre').trim(),
    searchName: String(card.searchName ?? '').trim(),
    familia: String(card.familia ?? 'NO TIENE').trim(),
    currentStock: toNumber(card.currentStock),
    stockOriginal: toNumber(card.stockOriginal),
    dataIssue: card.dataIssue === 'STOCK_NEGATIVO' ? 'STOCK_NEGATIVO' : null,
    totalEntradas: toNumber(card.totalEntradas),
    totalSalidas: toNumber(card.totalSalidas),
    prcosto: toNumber(card.prcosto),
    prventa: toNumber(card.prventa),
    stockValueBySalePrice: toNumber(card.stockValueBySalePrice),
    stockValueByCostPrice: toNumber(card.stockValueByCostPrice),
    movements: Array.isArray(card.movements)
      ? card.movements.map((movement) => ({
          id: toNumber(movement.id),
          fecha: String(movement.fecha ?? ''),
          detalle: String(movement.detalle ?? 'Movimiento'),
          entrada: toNumber(movement.entrada),
          salida: toNumber(movement.salida),
          stockTotal:
            movement.stockTotal === null || movement.stockTotal === undefined
              ? null
              : toNumber(movement.stockTotal),
          precioUnitario:
            movement.precioUnitario === null || movement.precioUnitario === undefined
              ? null
              : toNumber(movement.precioUnitario),
          total:
            movement.total === null || movement.total === undefined
              ? null
              : toNumber(movement.total),
        }))
      : [],
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

export async function fetchProductExistenceCard(codigo: string) {
  const cleanCode = codigo.trim();

  if (!cleanCode) {
    throw new Error('Código de producto inválido.');
  }

  const response = await fetch(
    `${apiBaseUrl}/products/${encodeURIComponent(cleanCode)}/existence-card`,
  );

  if (!response.ok) {
    throw new Error('No se pudo cargar la tarjeta de existencia del producto.');
  }

  const data: unknown = await response.json();
  return normalizeExistenceCard(data);
}

export async function createProduct(product: Product) {
  const response = await fetch(`${apiBaseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error('No se pudo guardar el producto en el backend.');
  }

  const data: unknown = await response.json();
  return normalizeApiProduct(data as ApiProduct);
}