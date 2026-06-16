import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type Customer,
  type InventoryMovement,
  type Product,
  type ProductFamily,
  type Supplier,
} from '../data/mockData';
import {
  InventoryContext,
  type CustomerInput,
  type InventoryContextValue,
  type InventoryState,
  type SupplierInput,
} from './inventoryStore';
import { getAccessToken, subscribeToSessionChanges } from '../api/authApi';
import { fetchProducts, createProduct } from '../api/productsApi';
import {
  fetchInventoryMovements,
  type ApiInventoryMovement,
} from '../api/inventoryMovementsApi';
import { fetchCustomers, createCustomer } from '../api/customersApi';
import { fetchSuppliers, createSupplier } from '../api/suppliersApi';
import { createPurchase } from '../api/purchasesApi';
import { createSale } from '../api/salesApi';

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
      typeof product.stockOriginal === 'number' ? product.stockOriginal : stock,
    dataIssue: product.dataIssue === 'STOCK_NEGATIVO' ? 'STOCK_NEGATIVO' : null,
    minStock: Number(product.minStock ?? 5),
    salesHistory: Array.isArray(product.salesHistory)
      ? product.salesHistory.filter(
          (value): value is number => typeof value === 'number',
        )
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
      typeof product.fechaCaducidad === 'string' &&
      product.fechaCaducidad.trim()
        ? product.fechaCaducidad.trim()
        : undefined,
  };
}

function normalizeBackendProducts(products: Product[]) {
  return products
    .map((product) => normalizeProduct(product))
    .filter((product): product is Product => product !== null);
}

function normalizeMovementDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function normalizeApiMovement(
  movement: ApiInventoryMovement,
): InventoryMovement {
  return {
    id: String(movement.id),
    type:
      movement.type === 'SALIDA'
        ? 'Salida'
        : movement.type === 'AJUSTE'
          ? 'Ajuste'
          : 'Entrada',
    product: movement.productName || movement.codigo,
    quantity: movement.quantity,
    user: movement.user || 'Usuario no identificado',
    date: normalizeMovementDate(movement.createdAt),
    detail: movement.reason || movement.detail || 'Movimiento registrado',
  };
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

function normalizeSupplierForState(supplier: Supplier): Supplier {
  return {
    id: supplier.id,
    name: supplier.name,
    identifier: supplier.identifier ?? null,
    contactName: supplier.contactName || '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    lastPurchase: supplier.lastPurchase || 'Sin compras',
    totalPurchases: Number(supplier.totalPurchases ?? 0),
    isActive: supplier.isActive !== false,
    isRestricted: supplier.isRestricted === true,
  };
}

function normalizeCustomerForState(customer: Customer): Customer {
  return {
    id: customer.id,
    name: customer.name,
    contact: customer.contact || '',
    identifier: customer.identifier ?? null,
    customerType: customer.customerType === 'B2C' ? 'B2C' : 'B2B',
    lastPurchase: customer.lastPurchase || 'Sin compras',
    purchases: Number(customer.purchases ?? 0),
    isActive: customer.isActive !== false,
    isRestricted: customer.isRestricted === true,
  };
}

function hasAccessToken() {
  return Boolean(getAccessToken());
}

function ensureAuthenticated() {
  if (!hasAccessToken()) {
    throw new Error('Debes iniciar sesión para realizar esta acción.');
  }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(emptyState);

  const clearInventoryData = useCallback(() => {
    setState({
      products: [],
      suppliers: [],
      customers: [],
      movements: [],
    });
  }, []);

  const reloadProductsFromBackend = useCallback(async () => {
    if (!hasAccessToken()) {
      setState((current) => ({
        ...current,
        products: [],
      }));

      return;
    }

    const backendProducts = await fetchProducts();

    setState((current) => ({
      ...current,
      products: normalizeBackendProducts(backendProducts),
    }));
  }, []);

  const reloadSuppliersFromBackend = useCallback(async () => {
    if (!hasAccessToken()) {
      setState((current) => ({
        ...current,
        suppliers: [],
      }));

      return;
    }

    const backendSuppliers = await fetchSuppliers();

    setState((current) => ({
      ...current,
      suppliers: backendSuppliers.map(normalizeSupplierForState),
    }));
  }, []);

  const reloadCustomersFromBackend = useCallback(async () => {
    if (!hasAccessToken()) {
      setState((current) => ({
        ...current,
        customers: [],
      }));

      return;
    }

    const backendCustomers = await fetchCustomers();

    setState((current) => ({
      ...current,
      customers: backendCustomers.map(normalizeCustomerForState),
    }));
  }, []);

  const reloadMovementsFromBackend = useCallback(async () => {
    if (!hasAccessToken()) {
      setState((current) => ({
        ...current,
        movements: [],
      }));

      return;
    }

    const backendMovements = await fetchInventoryMovements();

    setState((current) => ({
      ...current,
      movements: backendMovements.map(normalizeApiMovement),
    }));
  }, []);

  const reloadInventoryData = useCallback(async () => {
    if (!hasAccessToken()) {
      clearInventoryData();
      return;
    }

    const [productsResult, suppliersResult, customersResult, movementsResult] =
      await Promise.allSettled([
        fetchProducts(),
        fetchSuppliers(),
        fetchCustomers(),
        fetchInventoryMovements(),
      ]);

    if (!hasAccessToken()) {
      clearInventoryData();
      return;
    }

    setState((current) => ({
      ...current,
      products:
        productsResult.status === 'fulfilled'
          ? normalizeBackendProducts(productsResult.value)
          : [],
      suppliers:
        suppliersResult.status === 'fulfilled'
          ? suppliersResult.value.map(normalizeSupplierForState)
          : [],
      customers:
        customersResult.status === 'fulfilled'
          ? customersResult.value.map(normalizeCustomerForState)
          : [],
      movements:
        movementsResult.status === 'fulfilled'
          ? movementsResult.value.map(normalizeApiMovement)
          : [],
    }));

    if (productsResult.status === 'rejected') {
      console.warn(
        'No se pudieron cargar productos desde el backend. No se usarán datos locales.',
        productsResult.reason,
      );
    }

    if (suppliersResult.status === 'rejected') {
      console.warn(
        'No se pudieron cargar proveedores desde el backend.',
        suppliersResult.reason,
      );
    }

    if (customersResult.status === 'rejected') {
      console.warn(
        'No se pudieron cargar clientes desde el backend.',
        customersResult.reason,
      );
    }

    if (movementsResult.status === 'rejected') {
      console.warn(
        'No se pudieron cargar movimientos desde el backend.',
        movementsResult.reason,
      );
    }
  }, [clearInventoryData]);

  useEffect(() => {
    let isMounted = true;

    const syncData = () => {
      if (!isMounted) {
        return;
      }

      if (hasAccessToken()) {
        void reloadInventoryData();
      } else {
        clearInventoryData();
      }
    };

    syncData();

    const unsubscribe = subscribeToSessionChanges(syncData);
    const intervalId = window.setInterval(syncData, 1000);

    return () => {
      isMounted = false;
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [clearInventoryData, reloadInventoryData]);

  const value = useMemo<InventoryContextValue>(
    () => ({
      ...state,

      reloadInventoryData,

      async addProduct(product) {
        ensureAuthenticated();

        const normalizedProduct = normalizeProduct(product);

        if (!normalizedProduct) {
          return;
        }

        const savedProduct = await createProduct(normalizedProduct);
        const normalizedSavedProduct = normalizeProduct(
          savedProduct ?? normalizedProduct,
        );

        if (!normalizedSavedProduct) {
          await reloadProductsFromBackend();
          return;
        }

        setState((current) => ({
          ...current,
          products: upsertProduct(current.products, normalizedSavedProduct),
        }));
      },

      async addSupplier(supplier: SupplierInput) {
        ensureAuthenticated();

        await createSupplier({
          name: supplier.name,
          identifier: supplier.identifier ?? null,
          contactName: supplier.contactName ?? null,
          phone: supplier.phone ?? null,
          email: supplier.email ?? null,
        });

        await reloadSuppliersFromBackend();
      },

      async addCustomer(customer: CustomerInput) {
        ensureAuthenticated();

        await createCustomer({
          name: customer.name,
          contact: customer.contact,
          identifier: customer.identifier ?? null,
          customerType: customer.customerType,
        });

        await reloadCustomersFromBackend();
      },

      async recordPurchase(purchase) {
        ensureAuthenticated();

        await createPurchase(purchase);

        await Promise.all([
          reloadProductsFromBackend(),
          reloadSuppliersFromBackend(),
          reloadMovementsFromBackend(),
        ]);
      },

      async recordSale(sale) {
        ensureAuthenticated();

        await createSale(sale);

        await Promise.all([
          reloadProductsFromBackend(),
          reloadCustomersFromBackend(),
          reloadMovementsFromBackend(),
        ]);
      },
    }),
    [
      state,
      reloadInventoryData,
      reloadProductsFromBackend,
      reloadSuppliersFromBackend,
      reloadCustomersFromBackend,
      reloadMovementsFromBackend,
    ],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
