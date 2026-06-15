import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type InventoryMovement,
  type Product,
  type ProductFamily,
} from '../data/mockData';
import {
  InventoryContext,
  type CustomerInput,
  type InventoryContextValue,
  type InventoryState,
  type SupplierInput,
} from './inventoryStore';
import { fetchProducts, createProduct } from '../api/productsApi';
import { createInventoryMovements } from '../api/inventoryMovementsApi';
import { getCurrentUserAuditInfo } from '../api/authApi';

function toDisplayProductName(rawName?: string | null) {
  if (!rawName) {
    return '';
  }

  const cleaned = rawName
    .replace(/_/g, ' ')
    .replace(/\*/g, ' x')
    .replace(/\//g, ' / ')
    .replace(/\./g, ' ')
    .replace(/\b(\d+)\s*CC\b/gi, '$1 cc')
    .replace(/\b(\d+)\s*ML\b/gi, '$1 ml')
    .replace(/\b(\d+)\s*LT\b/gi, '$1 L')
    .replace(/\b(\d+)\s*LTS\b/gi, '$1 L')
    .replace(/\b(\d+)\s*L\b/gi, '$1 L')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bCc\b/g, 'cc')
    .replace(/\bMl\b/g, 'ml')
    .replace(/\bL\b/g, 'L')
    .replace(/\bX\s*(\d+)/g, 'x$1')
    .replace(/\s+\/\s+/g, ' / ');
}

function toSearchProductName(rawName?: string | null) {
  return toDisplayProductName(rawName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProductDisplayName(product: Product) {
  return product.displayName?.trim() || product.descrip?.trim() || 'Producto sin nombre';
}

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
  displayName: string;
  searchName: string;
  familia: string;
  prcosto: number;
  prventa: number;
  stockOriginal: number;
  dataIssue: 'STOCK_NEGATIVO' | null;
  salesHistory: number[];
  fecha: string | null;
  ubicacion: string;
  proveedor: string;
  lote: string;
  fechaCaducidad: string;
}>;

function normalizeFamily(value: unknown): ProductFamily {
  if (typeof value === 'string' && value.trim()) {
    return value.trim() as ProductFamily;
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

  const displayName =
    typeof product.displayName === 'string' && product.displayName.trim()
      ? product.displayName.trim()
      : toDisplayProductName(descrip);

  const searchName =
    typeof product.searchName === 'string' && product.searchName.trim()
      ? product.searchName.trim()
      : toSearchProductName(displayName || descrip);

  const stock = Number(product.stock ?? 0);

  return {
    codigo,
    descrip,
    displayName,
    searchName,
    familia: normalizeFamily(product.familia ?? product.category),
    prcosto:
      typeof product.prcosto === 'number'
        ? product.prcosto
        : Number(product.purchasePrice ?? 0),
    prventa:
      typeof product.prventa === 'number'
        ? product.prventa
        : Number(product.salePrice ?? 0),
    stock,
    stockOriginal:
      typeof product.stockOriginal === 'number'
        ? product.stockOriginal
        : stock,
    dataIssue: product.dataIssue === 'STOCK_NEGATIVO' ? 'STOCK_NEGATIVO' : null,
    minStock: Number(product.minStock ?? 5),
    salesHistory: Array.isArray(product.salesHistory)
      ? product.salesHistory.filter((value): value is number => typeof value === 'number')
      : undefined,
    fecha:
      typeof product.fecha === 'string'
        ? product.fecha
        : product.fecha === null
          ? null
          : undefined,
    ubicacion:
      typeof product.ubicacion === 'string' && product.ubicacion.trim()
        ? product.ubicacion.trim()
        : undefined,
    proveedor:
      typeof product.proveedor === 'string' && product.proveedor.trim()
        ? product.proveedor.trim()
        : undefined,
    lote:
      typeof product.lote === 'string' && product.lote.trim()
        ? product.lote.trim()
        : undefined,
    fechaCaducidad:
      typeof product.fechaCaducidad === 'string' && product.fechaCaducidad.trim()
        ? product.fechaCaducidad.trim()
        : undefined,
  };
}

function normalizeBackendProducts(products: Product[]) {
  return products
    .map((product) => normalizeProduct(product))
    .filter((product): product is Product => product !== null);
}

function getDateTimeLabel() {
  return new Date().toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function isValidDateInput(value?: string | null) {
  if (!value) {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

function isFutureDate(value?: string | null) {
  if (!isValidDateInput(value)) {
    return false;
  }

  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return selectedDate > today;
}

function getMovementDateLabel(date?: string | null) {
  if (!isValidDateInput(date)) {
    return getDateTimeLabel();
  }

  return new Date(`${date}T12:00:00`).toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function getMovementCreatedAt(date?: string | null) {
  if (!isValidDateInput(date)) {
    return new Date().toISOString();
  }

  return new Date(`${date}T12:00:00`).toISOString();
}

function getMovementId() {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

function upsertProduct(products: Product[], product: Product) {
  const exists = products.some(
    (item) => item.codigo.toLowerCase() === product.codigo.toLowerCase(),
  );

  if (!exists) {
    return [...products, product];
  }

  return products.map((item) =>
    item.codigo.toLowerCase() === product.codigo.toLowerCase() ? product : item,
  );
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(emptyState);

  function reloadProductsFromBackend() {
    return fetchProducts().then((backendProducts) => {
      setState((current) => ({
        ...current,
        products: normalizeBackendProducts(backendProducts),
      }));
    });
  }

  useEffect(() => {
    let isActive = true;

    fetchProducts()
      .then((backendProducts) => {
        if (!isActive) {
          return;
        }

        setState((current) => ({
          ...current,
          products: normalizeBackendProducts(backendProducts),
        }));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        console.warn(
          'No se pudieron cargar productos desde el backend. No se usarán datos locales.',
          error,
        );

        setState((current) => ({
          ...current,
          products: [],
        }));
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,

      addProduct(product) {
        const normalizedProduct = normalizeProduct(product);

        if (!normalizedProduct) {
          return;
        }

        createProduct(normalizedProduct)
          .then((savedProduct) => {
            if (!savedProduct) {
              return reloadProductsFromBackend();
            }

            const normalizedSavedProduct = normalizeProduct(savedProduct);

            if (!normalizedSavedProduct) {
              return reloadProductsFromBackend();
            }

            setState((current) => ({
              ...current,
              products: upsertProduct(current.products, normalizedSavedProduct),
            }));

            return undefined;
          })
          .catch((error) => {
            console.warn(
              'No se pudo guardar el producto en el backend. No se agregará localmente.',
              error,
            );
          });
      },

      addSupplier(supplier: SupplierInput) {
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

      addCustomer(customer: CustomerInput) {
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
        const validItems = purchase.items.filter(
          (item) => item.codigo && item.quantity > 0,
        );

        if (validItems.length === 0) {
          return;
        }

        if (isFutureDate(purchase.date)) {
          return;
        }

        const quantityByCode = new Map<string, number>();

        for (const item of validItems) {
          const currentQuantity = quantityByCode.get(item.codigo) ?? 0;
          quantityByCode.set(item.codigo, currentQuantity + item.quantity);
        }

        const existingProducts = new Map(
          state.products.map((item) => [item.codigo, item] as const),
        );

        const filteredEntries = [...quantityByCode.entries()].filter(([codigo]) =>
          existingProducts.has(codigo),
        );

        if (filteredEntries.length === 0) {
          return;
        }

        const movementDate = getMovementDateLabel(purchase.date);
        const movementCreatedAt = getMovementCreatedAt(purchase.date);
        const auditInfo = getCurrentUserAuditInfo();
        const movementUser = auditInfo.user;
        const movementRole = auditInfo.detail;

        const movements: InventoryMovement[] = filteredEntries.map(
          ([codigo, quantity]) => {
            const product = existingProducts.get(codigo)!;

            return {
              id: getMovementId(),
              type: 'Entrada',
              product: getProductDisplayName(product),
              quantity,
              user: movementUser,
              date: movementDate,
              detail: `Factura ${purchase.documentNumber} - ${purchase.supplierName}`,
            };
          },
        );

        const backendMovements = filteredEntries.map(([codigo, quantity]) => {
          const product = existingProducts.get(codigo)!;

          return {
            codigo,
            productName: getProductDisplayName(product),
            type: 'ENTRADA' as const,
            quantity,
            unitPrice: product.prcosto,
            totalPrice: quantity * product.prcosto,
            reason: `Factura ${purchase.documentNumber} - ${purchase.supplierName}`,
            user: movementUser,
            detail: movementRole,
            createdAt: movementCreatedAt,
          };
        });

        createInventoryMovements(backendMovements)
          .then(() => reloadProductsFromBackend())
          .then(() => {
            setState((current) => ({
              ...current,
              suppliers: current.suppliers.map((supplier) =>
                supplier.name === purchase.supplierName
                  ? {
                      ...supplier,
                      lastPurchase: purchase.date || movementDate,
                      totalPurchases: supplier.totalPurchases + 1,
                    }
                  : supplier,
              ),
              movements: [...movements, ...current.movements],
            }));
          })
          .catch((error) => {
            console.warn(
              'No se pudieron registrar las entradas en el backend. No se actualizará el estado local.',
              error,
            );
          });
      },

      recordSale(sale) {
        const validItems = sale.items.filter(
          (item) => item.codigo && item.quantity > 0,
        );

        if (validItems.length === 0) {
          return;
        }

        if (isFutureDate(sale.date)) {
          return;
        }

        const quantityByCode = new Map<string, number>();

        for (const item of validItems) {
          const currentQuantity = quantityByCode.get(item.codigo) ?? 0;
          quantityByCode.set(item.codigo, currentQuantity + item.quantity);
        }

        const existingProducts = new Map(
          state.products.map((item) => [item.codigo, item] as const),
        );

        const filteredEntries = [...quantityByCode.entries()].filter(([codigo]) =>
          existingProducts.has(codigo),
        );

        if (filteredEntries.length === 0) {
          return;
        }

        const hasInsufficientStock = filteredEntries.some(([codigo, quantity]) => {
          const product = existingProducts.get(codigo)!;
          return product.stock < quantity;
        });

        if (hasInsufficientStock) {
          return;
        }

        const movementDate = getMovementDateLabel(sale.date);
        const movementCreatedAt = getMovementCreatedAt(sale.date);
        const auditInfo = getCurrentUserAuditInfo();
        const movementUser = auditInfo.user;
        const movementRole = auditInfo.detail;

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
              product: getProductDisplayName(product),
              quantity,
              user: movementUser,
              date: movementDate,
              detail:
                `${sale.documentType} ${sale.documentNumber} - ` +
                `${customerDetail} | Tipo: ${sale.customerType}${identifierDetail}`,
            };
          },
        );

        const backendMovements = filteredEntries.map(([codigo, quantity]) => {
          const product = existingProducts.get(codigo)!;
          const customerDetail = sale.customerName || 'Cliente sin nombre';
          const identifierDetail = sale.customerIdentifier?.trim()
            ? ` | Id: ${sale.customerIdentifier.trim()}`
            : '';

          return {
            codigo,
            productName: getProductDisplayName(product),
            type: 'SALIDA' as const,
            quantity,
            unitPrice: product.prventa,
            totalPrice: quantity * product.prventa,
            reason:
              `${sale.documentType} ${sale.documentNumber} - ` +
              `${customerDetail} | Tipo: ${sale.customerType}${identifierDetail}`,
            user: movementUser,
            detail: movementRole,
            createdAt: movementCreatedAt,
          };
        });

        createInventoryMovements(backendMovements)
          .then(() => reloadProductsFromBackend())
          .then(() => {
            setState((current) => ({
              ...current,
              customers: current.customers.map((customer) =>
                customer.name === sale.customerName
                  ? {
                      ...customer,
                      lastPurchase: sale.date || movementDate,
                      purchases: customer.purchases + 1,
                    }
                  : customer,
              ),
              movements: [...movements, ...current.movements],
            }));
          })
          .catch((error) => {
            console.warn(
              'No se pudieron registrar las salidas en el backend. No se actualizará el estado local.',
              error,
            );
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