import { createContext } from 'react';
import type {
  Customer,
  InventoryMovement,
  Product,
  Supplier,
} from '../data/mockData';

export type InventoryState = {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  movements: InventoryMovement[];
};

export type ProductInput = Product;

export type PurchaseInput = {
  date: string;
  supplierName: string;
  documentNumber: string;
  items: Array<{
    codigo: string;
    quantity: number;
  }>;
};

export type SaleInput = {
  date?: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  customerIdentifier?: string;
  documentType: string;
  documentNumber: string;
  items: Array<{
    codigo: string;
    quantity: number;
  }>;
};

export type SupplierInput = Pick<
  Supplier,
  'name' | 'identifier' | 'contactName' | 'phone' | 'email'
>;

export type CustomerInput = Pick<
  Customer,
  'name' | 'contact' | 'customerType' | 'identifier'
>;

export type InventoryContextValue = InventoryState & {
  addProduct: (product: ProductInput) => void;
  addSupplier: (supplier: SupplierInput) => void;
  addCustomer: (customer: CustomerInput) => void;
  recordPurchase: (purchase: PurchaseInput) => void;
  recordSale: (sale: SaleInput) => void;
};

export const InventoryContext = createContext<InventoryContextValue | null>(
  null,
);