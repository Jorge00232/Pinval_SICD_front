/**
 * Categorías de producto tal como aparecen en ventas.csv (columna "familia").
 * Mantener sincronizado con los valores reales de la base de datos.
 */
export type ProductFamily = string;

/** Etiquetas legibles para mostrar en la UI */
export const FAMILY_LABELS: Record<string, string> = {
  SHAMPOO: 'Shampoo / Acond.',
  'LAV_.ROPA': 'Lavado ropa',
  CLORO: 'Cloro',
  LAVALOZA: 'Lavaloza',
  'P.HIG': 'Papel higiénico',
  DENTAL: 'Dental',
  'T._HUMEDAS': 'Toallas húmedas',
  'T._HIGIENICAS': 'Toallas higiénicas',
  VELAS: 'Velas',
  AEROSOL: 'Aerosol',
  PAÑAL: 'Pañal',
  LIMPIA_PISOS: 'Limpia pisos',
  'NO TIENE': 'Sin categoría',
};

/**
 * Producto del catálogo.
 * Campos alineados con stockvalorizado.csv, ventas.csv y respuesta del backend.
 *
 * CSV / Backend → Frontend:
 *   codigo       → codigo
 *   descrip      → descrip
 *   displayName  → nombre limpio para mostrar en pantalla
 *   searchName   → nombre normalizado para búsqueda/chatbot
 *   prcosto      → prcosto
 *   prventa      → prventa
 *   stock        → stock
 *   familia      → familia
 */
export type Product = {
  /** Código interno del producto (= columna "codigo" en stockvalorizado.csv) */
  codigo: string;

  /** Descripción / nombre original del producto (= columna "descrip") */
  descrip: string;

  /**
   * Nombre limpio para mostrar en la UI.
   * Ejemplo:
   * descrip: "CLORO_ROPA_COLOR_ARCADIA_960CC*12"
   * displayName: "Cloro Ropa Color Arcadia 960 cc x12"
   */
  displayName?: string;

  /**
   * Nombre normalizado para búsqueda y chatbot.
   * Ejemplo:
   * searchName: "cloro ropa color arcadia 960 cc x12"
   */
  searchName?: string;

  /** Familia / categoría (= columna "familia" en ventas.csv) */
  familia: ProductFamily;

  /** Precio de costo unitario en CLP (= columna "prcosto") */
  prcosto: number;

  /** Precio de venta unitario en CLP (= columna "prventa") */
  prventa: number;

  /** Stock actual en unidades (= columna "stock") */
  stock: number;

  /** Stock original recibido desde la fuente manual, antes de normalizarlo. */
  stockOriginal?: number;

  /** Marca de calidad cuando el dato de origen requiere revisión operativa. */
  dataIssue?: 'STOCK_NEGATIVO' | null;

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

  /** Fecha de registro o actualización de stock */
  fecha?: string | null;

  /** Ubicación física en el almacén (ej: Bodega A - Estante 2) */
  ubicacion?: string;

  /** Proveedor asociado al producto */
  proveedor?: string;

  /** Número de lote del producto */
  lote?: string;

  /** Fecha de caducidad del producto (en formato YYYY-MM-DD) */
  fechaCaducidad?: string;
};

export type Supplier = {
  id?: string;
  name: string;
  identifier?: string | null;
  contactName: string;
  phone?: string | null;
  email?: string | null;
  lastPurchase: string;
  totalPurchases: number;
  isActive?: boolean;
  isRestricted?: boolean;
};

export type Customer = {
  id?: string;
  name: string;
  contact: string;
  identifier?: string | null;
  customerType: 'B2B' | 'B2C';
  lastPurchase: string;
  purchases: number;
  isActive?: boolean;
  isRestricted?: boolean;
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