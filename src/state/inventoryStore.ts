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

export type ProductSaveOptions = {
  mode?: 'create' | 'update';
  originalCodigo?: string;
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

export type SupplierInput = Pick<
  Supplier,
  'name' | 'identifier' | 'contactName' | 'phone' | 'email'
>;

export type CustomerInput = Pick<
  Customer,
  'name' | 'contact' | 'customerType' | 'identifier'
>;

export type InventoryContextValue = InventoryState & {
  reloadInventoryData: () => Promise<void>;
  addProduct: (product: ProductInput, options?: ProductSaveOptions) => Promise<void>;
  addSupplier: (supplier: SupplierInput) => Promise<void>;
  addCustomer: (customer: CustomerInput) => Promise<void>;
  recordPurchase: (purchase: PurchaseInput) => Promise<void>;
  recordSale: (sale: SaleInput) => Promise<void>;
};

export const InventoryContext = createContext<InventoryContextValue | null>(
  null,
);
