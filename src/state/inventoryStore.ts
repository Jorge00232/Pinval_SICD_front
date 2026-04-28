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

export type InventoryContextValue = InventoryState & {
  addProduct: (product: Product) => void;
  addSupplier: (supplier: Pick<Supplier, 'name' | 'contact'>) => void;
  addCustomer: (
    customer: Pick<Customer, 'name' | 'contact' | 'customerType'>,
  ) => void;
  recordPurchase: (purchase: PurchaseInput) => void;
  recordSale: (sale: SaleInput) => void;
};

export const InventoryContext = createContext<InventoryContextValue | null>(
  null,
);
