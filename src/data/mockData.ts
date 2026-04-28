/**
 * Categorías de producto tal como aparecen en ventas.csv (columna "familia").
 * Mantener sincronizado con los valores reales de la base de datos.
 */
export type ProductFamily = string;

/** Etiquetas legibles para mostrar en la UI */
export const FAMILY_LABELS: Record<string, string> = {
  'SHAMPOO': 'Shampoo / Acond.',
  'LAV_.ROPA': 'Lavado ropa',
  'CLORO': 'Cloro',
  'LAVALOZA': 'Lavaloza',
  'P.HIG': 'Papel higiénico',
  'DENTAL': 'Dental',
  'T._HUMEDAS': 'Toallas húmedas',
  'T._HIGIENICAS': 'Toallas higiénicas',
  'VELAS': 'Velas',
  'AEROSOL': 'Aerosol',
  'PAÑAL': 'Pañal',
  'LIMPIA_PISOS': 'Limpia pisos',
  'NO TIENE': 'Sin categoría',
};

/**
 * Producto del catálogo.
 * Campos alineados con stockvalorizado.csv y ventas.csv.
 *
 * CSV → Frontend:
 *   codigo   → codigo
 *   descrip  → descrip
 *   prcosto  → prcosto
 *   prventa  → prventa
 *   stock    → stock
 *   familia  → familia
 */
export type Product = {
  /** Código interno del producto (= columna "codigo" en stockvalorizado.csv) */
  codigo: string;
  /** Descripción / nombre del producto (= columna "descrip") */
  descrip: string;
  /** Familia / categoría (= columna "familia" en ventas.csv) */
  familia: ProductFamily;
  /** Precio de costo unitario en CLP (= columna "prcosto") */
  prcosto: number;
  /** Precio de venta unitario en CLP (= columna "prventa") */
  prventa: number;
  /** Stock actual en unidades (= columna "stock") */
  stock: number;
  /**
   * Stock mínimo antes de alertar quiebre.
   * Campo de gestión interna — no tiene equivalente en los CSV,
   * pero se guardará en la BD propia del sistema.
   */
  minStock: number;
  /**
   * Historial de ventas por período (= columnas ventas01..ventas13).
   * Opcional hasta que el backend esté disponible.
   */
  salesHistory?: number[];
};

export type Supplier = {
  name: string;
  identifier?: string;
  contactName: string;
  phone?: string;
  email?: string;
  lastPurchase: string;
  totalPurchases: number;
};

export type Customer = {
  name: string;
  contact: string;
  identifier?: string;
  customerType: 'B2B' | 'B2C';
  lastPurchase: string;
  purchases: number;
};

export type InventoryMovement = {
  id: string;
  type: 'Entrada' | 'Salida' | 'Ajuste';
  product: string;
  quantity: number;
  user: string;
  date: string;
  detail: string;
};

export const products: Product[] = [];

export const suppliers: Supplier[] = [];

export const customers: Customer[] = [];

export const movements: InventoryMovement[] = [];

export const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
