export type Product = {
  sku: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
};

export type Supplier = {
  name: string;
  contact: string;
  lastPurchase: string;
  totalPurchases: number;
};

export type Customer = {
  name: string;
  contact: string;
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
