import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  FAMILY_LABELS,
  type Customer,
  type InventoryMovement,
  type Product,
  type ProductFamily,
} from '../data/mockData';
import {
  InventoryContext,
  type InventoryContextValue,
  type InventoryState,
} from './inventoryStore';

const storageKey = 'sicd-inventory-state-v1';

const emptyState: InventoryState = {
  products: [],
  suppliers: [],
  customers: [],
  movements: [],
};

type LegacyProduct = Partial<{
  sku: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  codigo: string;
  descrip: string;
  familia: string;
  prcosto: number;
  prventa: number;
  salesHistory: number[];
}>;

type LegacyCustomer = Partial<{
  name: string;
  contact: string;
  customerType: 'B2B' | 'B2C';
  lastPurchase: string;
  purchases: number;
}>;

function normalizeFamily(value: unknown): ProductFamily {
  if (typeof value === 'string' && value in FAMILY_LABELS) {
    return value as ProductFamily;
  }

  return 'NO TIENE';
}

function normalizeProduct(product: LegacyProduct): Product | null {
  const codigo =
    typeof product.codigo === 'string'
      ? product.codigo.trim()
      : typeof product.sku === 'string'
        ? product.sku.trim()
        : '';
  const descrip =
    typeof product.descrip === 'string'
      ? product.descrip.trim()
      : typeof product.name === 'string'
        ? product.name.trim()
        : '';

  if (!codigo || !descrip) {
    return null;
  }

  return {
    codigo,
    descrip,
    familia: normalizeFamily(product.familia ?? product.category),
    prcosto:
      typeof product.prcosto === 'number'
        ? product.prcosto
        : Number(product.purchasePrice ?? 0),
    prventa:
      typeof product.prventa === 'number'
        ? product.prventa
        : Number(product.salePrice ?? 0),
    stock: Number(product.stock ?? 0),
    minStock: Number(product.minStock ?? 0),
    salesHistory: Array.isArray(product.salesHistory)
      ? product.salesHistory.filter((value): value is number => typeof value === 'number')
      : undefined,
  };
}

function normalizeCustomer(customer: LegacyCustomer): Customer | null {
  const name = typeof customer.name === 'string' ? customer.name.trim() : '';
  const contact =
    typeof customer.contact === 'string' ? customer.contact.trim() : '';

  if (!name) {
    return null;
  }

  return {
    name,
    contact,
    customerType: customer.customerType === 'B2C' ? 'B2C' : 'B2B',
    lastPurchase:
      typeof customer.lastPurchase === 'string'
        ? customer.lastPurchase
        : 'Sin compras',
    purchases: Number(customer.purchases ?? 0),
  };
}

function normalizeState(state: unknown): InventoryState {
  if (!state || typeof state !== 'object') {
    return emptyState;
  }

  const candidate = state as Partial<InventoryState> & {
    products?: LegacyProduct[];
    customers?: LegacyCustomer[];
  };

  return {
    products: Array.isArray(candidate.products)
      ? candidate.products
          .map((product) => normalizeProduct(product))
          .filter((product): product is Product => product !== null)
      : [],
    suppliers: Array.isArray(candidate.suppliers) ? candidate.suppliers : [],
    customers: Array.isArray(candidate.customers)
      ? candidate.customers
          .map((customer) => normalizeCustomer(customer))
          .filter((customer): customer is Customer => customer !== null)
      : [],
    movements: Array.isArray(candidate.movements) ? candidate.movements : [],
  };
}

function getInitialState() {
  const savedState = window.localStorage.getItem(storageKey);

  if (!savedState) {
    return emptyState;
  }

  try {
    return normalizeState(JSON.parse(savedState));
  } catch {
    return emptyState;
  }
}

function getDateTimeLabel() {
  return new Date().toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getMovementId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(getInitialState);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,
      addProduct(product) {
        setState((current) => {
          const exists = current.products.some(
            (item) => item.codigo.toLowerCase() === product.codigo.toLowerCase(),
          );

          if (exists) {
            return {
              ...current,
              products: current.products.map((item) =>
                item.codigo.toLowerCase() === product.codigo.toLowerCase()
                  ? product
                  : item,
              ),
            };
          }

          return {
            ...current,
            products: [...current.products, product],
          };
        });
      },
      addSupplier(supplier) {
        setState((current) => ({
          ...current,
          suppliers: [
            ...current.suppliers,
            {
              ...supplier,
              lastPurchase: 'Sin compras',
              totalPurchases: 0,
            },
          ],
        }));
      },
      addCustomer(customer) {
        setState((current) => ({
          ...current,
          customers: [
            ...current.customers,
            {
              ...customer,
              lastPurchase: 'Sin compras',
              purchases: 0,
            },
          ],
        }));
      },
      recordPurchase(purchase) {
        setState((current) => {
          const validItems = purchase.items.filter(
            (item) => item.codigo && item.quantity > 0,
          );

          if (validItems.length === 0) {
            return current;
          }

          const quantityByCode = new Map<string, number>();

          for (const item of validItems) {
            const currentQuantity = quantityByCode.get(item.codigo) ?? 0;
            quantityByCode.set(item.codigo, currentQuantity + item.quantity);
          }

          const existingProducts = new Set(current.products.map((item) => item.codigo));
          const filteredEntries = [...quantityByCode.entries()].filter(([codigo]) =>
            existingProducts.has(codigo),
          );

          if (filteredEntries.length === 0) {
            return current;
          }

          const movements: InventoryMovement[] = filteredEntries.map(
            ([codigo, quantity]) => {
              const product = current.products.find((item) => item.codigo === codigo)!;

              return {
                id: getMovementId(),
                type: 'Entrada',
                product: product.descrip,
                quantity,
                user: 'Usuario local',
                date: getDateTimeLabel(),
                detail: `Factura ${purchase.documentNumber} - ${purchase.supplierName}`,
              };
            },
          );

          return {
            ...current,
            products: current.products.map((item) =>
              quantityByCode.has(item.codigo)
                ? {
                    ...item,
                    stock: item.stock + (quantityByCode.get(item.codigo) ?? 0),
                  }
                : item,
            ),
            suppliers: current.suppliers.map((supplier) =>
              supplier.name === purchase.supplierName
                ? {
                    ...supplier,
                    lastPurchase: purchase.date || getDateTimeLabel(),
                    totalPurchases: supplier.totalPurchases + 1,
                  }
                : supplier,
            ),
            movements: [...movements, ...current.movements],
          };
        });
      },
      recordSale(sale) {
        setState((current) => {
          const validItems = sale.items.filter(
            (item) => item.codigo && item.quantity > 0,
          );

          if (validItems.length === 0) {
            return current;
          }

          const quantityByCode = new Map<string, number>();

          for (const item of validItems) {
            const currentQuantity = quantityByCode.get(item.codigo) ?? 0;
            quantityByCode.set(item.codigo, currentQuantity + item.quantity);
          }

          const existingProducts = new Map(
            current.products.map((item) => [item.codigo, item] as const),
          );
          const filteredEntries = [...quantityByCode.entries()].filter(([codigo]) =>
            existingProducts.has(codigo),
          );

          if (filteredEntries.length === 0) {
            return current;
          }

          const hasInsufficientStock = filteredEntries.some(([codigo, quantity]) => {
            const product = existingProducts.get(codigo)!;
            return product.stock < quantity;
          });

          if (hasInsufficientStock) {
            return current;
          }

          const movementDate = getDateTimeLabel();
          const movements: InventoryMovement[] = filteredEntries.map(
            ([codigo, quantity]) => {
              const product = existingProducts.get(codigo)!;
              const customerDetail = sale.customerName || 'Cliente sin nombre';
              const identifierDetail = sale.customerIdentifier?.trim()
                ? ` | Id: ${sale.customerIdentifier.trim()}`
                : '';

              return {
                id: getMovementId(),
                type: 'Salida',
                product: product.descrip,
                quantity,
                user: 'Usuario local',
                date: movementDate,
                detail:
                  `${sale.documentType} ${sale.documentNumber} - ` +
                  `${customerDetail} | Tipo: ${sale.customerType}${identifierDetail}`,
              };
            },
          );

          return {
            ...current,
            products: current.products.map((item) =>
              quantityByCode.has(item.codigo)
                ? { ...item, stock: item.stock - (quantityByCode.get(item.codigo) ?? 0) }
                : item,
            ),
            customers: current.customers.map((customer) =>
              customer.name === sale.customerName
                ? {
                    ...customer,
                    lastPurchase: movementDate,
                    purchases: customer.purchases + 1,
                  }
                : customer,
            ),
            movements: [...movements, ...current.movements],
          };
        });
      },
    }),
    [state],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
