import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type Customer,
  type InventoryMovement,
  type Product,
  type ProductFamily,
  type Supplier,
} from '../data/mockData';
import {
  InventoryContext,
  type InventoryContextValue,
  type InventoryState,
} from './inventoryStore';
import { fetchProducts, createProduct } from '../api/productsApi';
import { createInventoryMovements } from '../api/inventoryMovementsApi';
import { getCurrentUserAuditInfo } from '../api/authApi';

const storageKey = 'sicd-inventory-state-v1';

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
  products: [
    {
      codigo: '001101',
      descrip: 'Shampoo Neutro Hidratante 400ml',
      displayName: 'Shampoo Neutro Hidratante 400 ml',
      searchName: 'shampoo neutro hidratante 400 ml',
      familia: 'SHAMPOO',
      prcosto: 1800,
      prventa: 3200,
      stock: 45,
      minStock: 10,
      fecha: '2026-05-15',
      ubicacion: 'Bodega 1 - Estante A2',
      proveedor: 'Distribuidora Central',
      lote: 'SH-9921',
      fechaCaducidad: '2027-08-20',
    },
    {
      codigo: '001102',
      descrip: 'Detergente Liquido Lavado Ropa 3L',
      displayName: 'Detergente Liquido Lavado Ropa 3 L',
      searchName: 'detergente liquido lavado ropa 3 l',
      familia: 'LAV_.ROPA',
      prcosto: 3500,
      prventa: 6490,
      stock: 8,
      minStock: 15,
      fecha: '2026-05-18',
      ubicacion: 'Bodega 1 - Estante B5',
      proveedor: 'Distribuidora Central',
      lote: 'DET-4402',
      fechaCaducidad: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    },
    {
      codigo: '001103',
      descrip: 'Cloro Tradicional Concentrado 2L',
      displayName: 'Cloro Tradicional Concentrado 2 L',
      searchName: 'cloro tradicional concentrado 2 l',
      familia: 'CLORO',
      prcosto: 850,
      prventa: 1500,
      stock: 2,
      minStock: 5,
      fecha: '2026-05-20',
      ubicacion: 'Bodega 2 - Pasillo D',
      proveedor: 'Quimica del Norte',
      lote: 'CL-0018',
      fechaCaducidad: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    },
    {
      codigo: '001104',
      descrip: 'Lavaloza Activo Limon 750ml',
      displayName: 'Lavaloza Activo Limon 750 ml',
      searchName: 'lavaloza activo limon 750 ml',
      familia: 'LAVALOZA',
      prcosto: 1100,
      prventa: 1990,
      stock: 60,
      minStock: 12,
      fecha: '2026-05-22',
      ubicacion: 'Bodega 2 - Pasillo E',
      proveedor: 'Quimica del Norte',
      lote: 'LV-8871',
      fechaCaducidad: '2028-02-10',
    },
    {
      codigo: '001105',
      descrip: 'Pasta Dental Triple Accion 150g',
      displayName: 'Pasta Dental Triple Accion 150g',
      searchName: 'pasta dental triple accion 150g',
      familia: 'DENTAL',
      prcosto: 980,
      prventa: 1890,
      stock: 24,
      minStock: 8,
      fecha: '2026-05-25',
      ubicacion: 'Bodega 1 - Estante C1',
      proveedor: 'Distribuidora Central',
      lote: 'DEN-1102',
      fechaCaducidad: '2027-11-05',
    },
  ],
  suppliers: [
    {
      name: 'Distribuidora Central',
      identifier: '76.452.122-3',
      contactName: 'Carlos Gomez',
      phone: '+56 9 7711 2233',
      email: 'carlos@distribuidoracentral.cl',
      lastPurchase: '2026-05-18',
      totalPurchases: 2,
    },
    {
      name: 'Quimica del Norte',
      identifier: '77.892.110-K',
      contactName: 'Patricia Tapia',
      phone: '+56 9 8833 4455',
      email: 'ventas@quimicadelnorte.cl',
      lastPurchase: '2026-05-20',
      totalPurchases: 1,
    },
  ],
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

type LegacyCustomer = Partial<{
  name: string;
  contact: string;
  identifier: string;
  customerType: 'B2B' | 'B2C';
  lastPurchase: string;
  purchases: number;
}>;

type LegacySupplier = Partial<{
  name: string;
  contact: string;
  identifier: string;
  contactName: string;
  phone: string;
  email: string;
  lastPurchase: string;
  totalPurchases: number;
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
    identifier:
      typeof customer.identifier === 'string' ? customer.identifier.trim() : '',
    customerType: customer.customerType === 'B2C' ? 'B2C' : 'B2B',
    lastPurchase:
      typeof customer.lastPurchase === 'string'
        ? customer.lastPurchase
        : 'Sin compras',
    purchases: Number(customer.purchases ?? 0),
  };
}

function normalizeSupplier(supplier: LegacySupplier): Supplier | null {
  const name = typeof supplier.name === 'string' ? supplier.name.trim() : '';

  if (!name) {
    return null;
  }

  const legacyContact =
    typeof supplier.contact === 'string' ? supplier.contact.trim() : '';

  return {
    name,
    identifier:
      typeof supplier.identifier === 'string' ? supplier.identifier.trim() : '',
    contactName:
      typeof supplier.contactName === 'string'
        ? supplier.contactName.trim()
        : legacyContact,
    phone: typeof supplier.phone === 'string' ? supplier.phone.trim() : '',
    email: typeof supplier.email === 'string' ? supplier.email.trim() : '',
    lastPurchase:
      typeof supplier.lastPurchase === 'string'
        ? supplier.lastPurchase
        : 'Sin compras',
    totalPurchases: Number(supplier.totalPurchases ?? 0),
  };
}

function normalizeState(state: unknown): InventoryState {
  if (!state || typeof state !== 'object') {
    return emptyState;
  }

  const candidate = state as Partial<InventoryState> & {
    products?: LegacyProduct[];
    customers?: LegacyCustomer[];
    suppliers?: LegacySupplier[];
  };

  return {
    products: Array.isArray(candidate.products)
      ? candidate.products
          .map((product) => normalizeProduct(product))
          .filter((product): product is Product => product !== null)
      : [],
    suppliers: Array.isArray(candidate.suppliers)
      ? candidate.suppliers
          .map((supplier) => normalizeSupplier(supplier))
          .filter((supplier): supplier is Supplier => supplier !== null)
      : [],
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
    const parsed = normalizeState(JSON.parse(savedState));

    if (parsed.products.length === 0) {
      return emptyState;
    }

    return parsed;
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

function mergeProducts(currentProducts: Product[], backendProducts: Product[]) {
  const normalizedBackendProducts = backendProducts
    .map((product) => normalizeProduct(product))
    .filter((product): product is Product => product !== null);

  const backendCodes = new Set(
    normalizedBackendProducts.map((product) => product.codigo.toLowerCase()),
  );

  return [
    ...normalizedBackendProducts,
    ...currentProducts.filter(
      (product) => !backendCodes.has(product.codigo.toLowerCase()),
    ),
  ];
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(getInitialState);

  useEffect(() => {
    let isActive = true;

    fetchProducts()
      .then((backendProducts) => {
        if (!isActive || backendProducts.length === 0) {
          return;
        }

        setState((current) => ({
          ...current,
          products: mergeProducts(current.products, backendProducts),
        }));
      })
      .catch(() => {
        // El frontend puede seguir operando con datos locales si la API no está levantada.
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,

      addProduct(product) {
        const normalizedProduct = normalizeProduct(product);

        if (!normalizedProduct) {
          return;
        }

        setState((current) => {
          const exists = current.products.some(
            (item) =>
              item.codigo.toLowerCase() === normalizedProduct.codigo.toLowerCase(),
          );

          if (exists) {
            return {
              ...current,
              products: current.products.map((item) =>
                item.codigo.toLowerCase() === normalizedProduct.codigo.toLowerCase()
                  ? normalizedProduct
                  : item,
              ),
            };
          }

          return {
            ...current,
            products: [...current.products, normalizedProduct],
          };
        });

        createProduct(normalizedProduct).catch((err) => {
          console.warn(
            'No se pudo sincronizar el nuevo producto con el backend:',
            err,
          );
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
        const validItems = purchase.items.filter(
          (item) => item.codigo && item.quantity > 0,
        );

        if (validItems.length === 0) {
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

        if (isFutureDate(purchase.date)) {
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

        setState((current) => ({
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
                  lastPurchase: purchase.date || movementDate,
                  totalPurchases: supplier.totalPurchases + 1,
                }
              : supplier,
          ),
          movements: [...movements, ...current.movements],
        }));

        createInventoryMovements(backendMovements).catch((error) => {
          console.warn(
            'No se pudieron sincronizar las entradas con el backend:',
            error,
          );
        });
      },

      recordSale(sale) {
        const saleWithDate = sale as typeof sale & { date?: string | null };

        const validItems = sale.items.filter(
          (item) => item.codigo && item.quantity > 0,
        );

        if (validItems.length === 0) {
          return;
        }

        if (isFutureDate(saleWithDate.date)) {
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

        const movementDate = getMovementDateLabel(saleWithDate.date);
        const movementCreatedAt = getMovementCreatedAt(saleWithDate.date);
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

        setState((current) => ({
          ...current,
          products: current.products.map((item) =>
            quantityByCode.has(item.codigo)
              ? {
                  ...item,
                  stock: item.stock - (quantityByCode.get(item.codigo) ?? 0),
                }
              : item,
          ),
          customers: current.customers.map((customer) =>
            customer.name === sale.customerName
              ? {
                  ...customer,
                  lastPurchase: saleWithDate.date || movementDate,
                  purchases: customer.purchases + 1,
                }
              : customer,
          ),
          movements: [...movements, ...current.movements],
        }));

        createInventoryMovements(backendMovements).catch((error) => {
          console.warn(
            'No se pudieron sincronizar las salidas con el backend:',
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