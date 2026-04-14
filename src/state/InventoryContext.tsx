import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { InventoryMovement } from '../data/mockData';
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

function getInitialState() {
  const savedState = window.localStorage.getItem(storageKey);

  if (!savedState) {
    return emptyState;
  }

  try {
    return JSON.parse(savedState) as InventoryState;
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
            (item) => item.sku.toLowerCase() === product.sku.toLowerCase(),
          );

          if (exists) {
            return {
              ...current,
              products: current.products.map((item) =>
                item.sku.toLowerCase() === product.sku.toLowerCase()
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
          const product = current.products.find(
            (item) => item.sku === purchase.sku,
          );

          if (!product) {
            return current;
          }

          const movement: InventoryMovement = {
            id: getMovementId(),
            type: 'Entrada',
            product: product.name,
            quantity: purchase.quantity,
            user: 'Usuario local',
            date: getDateTimeLabel(),
            detail: `Compra registrada para ${purchase.supplierName}`,
          };

          return {
            ...current,
            products: current.products.map((item) =>
              item.sku === purchase.sku
                ? { ...item, stock: item.stock + purchase.quantity }
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
            movements: [movement, ...current.movements],
          };
        });
      },
      recordSale(sale) {
        setState((current) => {
          const product = current.products.find((item) => item.sku === sale.sku);

          if (!product || product.stock < sale.quantity) {
            return current;
          }

          const movement: InventoryMovement = {
            id: getMovementId(),
            type: 'Salida',
            product: product.name,
            quantity: sale.quantity,
            user: 'Usuario local',
            date: getDateTimeLabel(),
            detail: `${sale.documentType} registrada para ${sale.customerName}`,
          };

          return {
            ...current,
            products: current.products.map((item) =>
              item.sku === sale.sku
                ? { ...item, stock: item.stock - sale.quantity }
                : item,
            ),
            customers: current.customers.map((customer) =>
              customer.name === sale.customerName
                ? {
                    ...customer,
                    lastPurchase: getDateTimeLabel(),
                    purchases: customer.purchases + 1,
                  }
                : customer,
            ),
            movements: [movement, ...current.movements],
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
