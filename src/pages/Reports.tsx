import { useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { FAMILY_LABELS, currencyFormatter } from '../data/mockData';
import { useInventory } from '../state/useInventory';

type ReportType = 'general' | 'sales' | 'purchases' | 'inventory' | 'customers';
type StockFilter = 'all' | 'low' | 'out';
type CustomerFilter = 'all' | 'B2B' | 'B2C';

type ParsedSale = {
  documentType: string;
  documentNumber: string;
  customerName: string;
  customerType: 'B2B' | 'B2C';
  identifier: string;
};

type ParsedPurchase = {
  documentNumber: string;
  supplierName: string;
};

function parseSaleDetail(detail: string): ParsedSale {
  const [documentSection = '', customerSection = '', typeSection = '', identifierSection = ''] =
    detail.split('|').map((part) => part.trim());
  const documentTokens = documentSection.split(' ').filter(Boolean);
  const documentType = documentTokens[0] ?? 'Documento';
  const documentNumber = documentTokens.slice(1).join(' ') || 'Sin numero';
  const customerName = customerSection.split(' - ').slice(1).join(' - ') || 'Sin cliente';
  const customerTypeText = typeSection.replace('Tipo:', '').trim();
  const identifier = identifierSection.replace('Id:', '').trim();

  return {
    documentType,
    documentNumber,
    customerName,
    customerType: customerTypeText === 'B2C' ? 'B2C' : 'B2B',
    identifier,
  };
}

function parsePurchaseDetail(detail: string): ParsedPurchase {
  const purchaseText = detail.replace('Factura', '').trim();
  const [documentNumber = 'Sin numero', supplierName = 'Sin proveedor'] =
    purchaseText.split(' - ');

  return {
    documentNumber: documentNumber.trim() || 'Sin numero',
    supplierName: supplierName.trim() || 'Sin proveedor',
  };
}

function Reports() {
  const { movements, products, customers, suppliers } = useInventory();
  const [reportType, setReportType] = useState<ReportType>('general');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>('all');

  const saleMovements = useMemo(
    () => movements.filter((movement) => movement.type === 'Salida'),
    [movements],
  );
  const purchaseMovements = useMemo(
    () => movements.filter((movement) => movement.type === 'Entrada'),
    [movements],
  );
  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= product.minStock),
    [products],
  );

  const salesRows = useMemo(
    () =>
      saleMovements.map((movement) => {
        const detail = parseSaleDetail(movement.detail);

        return {
          ...movement,
          ...detail,
        };
      }),
    [saleMovements],
  );

  const purchaseRows = useMemo(
    () =>
      purchaseMovements.map((movement) => {
        const detail = parsePurchaseDetail(movement.detail);

        return {
          ...movement,
          ...detail,
        };
      }),
    [purchaseMovements],
  );

  const filteredSalesRows = useMemo(() => {
    if (customerFilter === 'all') {
      return salesRows;
    }

    return salesRows.filter((row) => row.customerType === customerFilter);
  }, [customerFilter, salesRows]);

  const filteredInventoryRows = useMemo(() => {
    if (stockFilter === 'low') {
      return products.filter(
        (product) => product.stock > 0 && product.stock <= product.minStock,
      );
    }

    if (stockFilter === 'out') {
      return products.filter((product) => product.stock === 0);
    }

    return products;
  }, [products, stockFilter]);

  const totalStockCost = products.reduce(
    (total, product) => total + product.stock * product.prcosto,
    0,
  );
  const totalStockSale = products.reduce(
    (total, product) => total + product.stock * product.prventa,
    0,
  );
  const totalUnitsSold = filteredSalesRows.reduce(
    (total, movement) => total + movement.quantity,
    0,
  );
  const totalUnitsPurchased = purchaseRows.reduce(
    (total, movement) => total + movement.quantity,
    0,
  );
  const uniqueSaleCustomers = new Set(
    filteredSalesRows.map((movement) => movement.customerName),
  ).size;
  const uniqueSuppliers = new Set(
    purchaseRows.map((movement) => movement.supplierName),
  ).size;
  const reportLabel =
    {
      general: 'Resumen general',
      sales: 'Ventas',
      purchases: 'Compras',
      inventory: 'Inventario',
      customers: 'Clientes',
    }[reportType] ?? 'Resumen general';

  return (
    <AppLayout
      title="Reportes"
      description="Consulta el tipo de reporte que necesitas y revisa su detalle."
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>Configuracion del reporte</h2>
          <span>{reportLabel}</span>
        </div>

        <div className="grid-form reports-filter-grid">
          <label>
            Tipo de reporte
            <select
              value={reportType}
              onChange={(event) => setReportType(event.target.value as ReportType)}
            >
              <option value="general">Resumen general</option>
              <option value="sales">Ventas</option>
              <option value="purchases">Compras</option>
              <option value="inventory">Inventario</option>
              <option value="customers">Clientes</option>
            </select>
          </label>

          {reportType === 'inventory' ? (
            <label>
              Estado de stock
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockFilter)}
              >
                <option value="all">Todo el inventario</option>
                <option value="low">Solo por reponer</option>
                <option value="out">Solo sin stock</option>
              </select>
            </label>
          ) : null}

          {reportType === 'sales' || reportType === 'customers' ? (
            <label>
              Tipo de cliente
              <select
                value={customerFilter}
                onChange={(event) => setCustomerFilter(event.target.value as CustomerFilter)}
              >
                <option value="all">Todos</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
            </label>
          ) : null}
        </div>
      </section>

      {reportType === 'general' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>Productos registrados</span>
              <strong>{products.length || 'Sin datos'}</strong>
              <p>Total de productos creados en el sistema.</p>
            </article>
            <article className="metric-card accent">
              <span>Ventas registradas</span>
              <strong>{saleMovements.length || 'Sin datos'}</strong>
              <p>Total de ventas guardadas hasta ahora.</p>
            </article>
            <article className="metric-card warning">
              <span>Compras registradas</span>
              <strong>{purchaseMovements.length || 'Sin datos'}</strong>
              <p>Total de compras registradas en el sistema.</p>
            </article>
            <article className="metric-card">
              <span>Alertas activas</span>
              <strong>{lowStockProducts.length || 'Sin datos'}</strong>
              <p>Productos que requieren revision de stock.</p>
            </article>
          </section>

          <section className="two-column">
            <article className="panel">
              <div className="panel-heading">
                <h2>Resumen del inventario</h2>
                <span>{products.length} productos</span>
              </div>
              <div className="reports-kpi-list">
                <div>
                  <strong>{currencyFormatter.format(totalStockCost)}</strong>
                  <span>Costo total del stock</span>
                </div>
                <div>
                  <strong>{currencyFormatter.format(totalStockSale)}</strong>
                  <span>Valor aproximado de venta</span>
                </div>
                <div>
                  <strong>{lowStockProducts.length}</strong>
                  <span>Productos por revisar</span>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-heading">
                <h2>Actividad registrada</h2>
                <span>{movements.length} movimientos</span>
              </div>
              <div className="reports-kpi-list">
                <div>
                  <strong>{totalUnitsPurchased}</strong>
                  <span>Unidades ingresadas</span>
                </div>
                <div>
                  <strong>{totalUnitsSold}</strong>
                  <span>Unidades vendidas</span>
                </div>
                <div>
                  <strong>{customers.length}</strong>
                  <span>Clientes registrados</span>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}

      {reportType === 'sales' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>Ventas registradas</span>
              <strong>{filteredSalesRows.length || 'Sin datos'}</strong>
              <p>Ventas encontradas con el filtro aplicado.</p>
            </article>
            <article className="metric-card accent">
              <span>Unidades vendidas</span>
              <strong>{totalUnitsSold || 'Sin datos'}</strong>
              <p>Total de unidades vendidas en este reporte.</p>
            </article>
            <article className="metric-card">
              <span>Clientes atendidos</span>
              <strong>{uniqueSaleCustomers || 'Sin datos'}</strong>
              <p>Cantidad de clientes distintos en las ventas.</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Detalle de ventas</h2>
              <span>{filteredSalesRows.length} registros</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {filteredSalesRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>Documento</th>
                      <th>RUT / Id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesRows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td className="reports-primary-cell">{movement.product}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.customerName}</td>
                        <td>{movement.customerType}</td>
                        <td>{`${movement.documentType} ${movement.documentNumber}`}</td>
                        <td>{movement.identifier || 'Sin dato'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  No hay ventas registradas para el filtro actual.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'purchases' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card warning">
              <span>Compras registradas</span>
              <strong>{purchaseRows.length || 'Sin datos'}</strong>
              <p>Compras encontradas en el sistema.</p>
            </article>
            <article className="metric-card success">
              <span>Unidades ingresadas</span>
              <strong>{totalUnitsPurchased || 'Sin datos'}</strong>
              <p>Total de unidades ingresadas por compras.</p>
            </article>
            <article className="metric-card">
              <span>Proveedores usados</span>
              <strong>{uniqueSuppliers || 'Sin datos'}</strong>
              <p>Proveedores distintos usados en las compras.</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Detalle de compras</h2>
              <span>{purchaseRows.length} registros</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {purchaseRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Proveedor</th>
                      <th>Factura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.date}</td>
                        <td className="reports-primary-cell">{movement.product}</td>
                        <td>{movement.quantity}</td>
                        <td>{movement.supplierName}</td>
                        <td>{movement.documentNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  No hay compras registradas todavia.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'inventory' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card">
              <span>Productos mostrados</span>
              <strong>{filteredInventoryRows.length || 'Sin datos'}</strong>
              <p>Productos que coinciden con el filtro actual.</p>
            </article>
            <article className="metric-card warning">
              <span>Por reponer</span>
              <strong>{lowStockProducts.filter((product) => product.stock > 0).length || 'Sin datos'}</strong>
              <p>Productos con poco stock, pero aun disponibles.</p>
            </article>
            <article className="metric-card accent">
              <span>Sin stock</span>
              <strong>{lowStockProducts.filter((product) => product.stock === 0).length || 'Sin datos'}</strong>
              <p>Productos que ya no tienen unidades disponibles.</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Detalle de inventario</h2>
              <span>{filteredInventoryRows.length} productos</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {filteredInventoryRows.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Codigo</th>
                      <th>Descripcion</th>
                      <th>Familia</th>
                      <th>Stock</th>
                      <th>Minimo</th>
                      <th>Precio costo</th>
                      <th>Precio venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventoryRows.map((product) => (
                      <tr key={product.codigo}>
                        <td className="code-cell">{product.codigo}</td>
                        <td className="reports-primary-cell">{product.descrip}</td>
                        <td>{FAMILY_LABELS[product.familia] ?? product.familia}</td>
                        <td>{product.stock}</td>
                        <td>{product.minStock}</td>
                        <td>{currencyFormatter.format(product.prcosto)}</td>
                        <td>{currencyFormatter.format(product.prventa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  No hay productos que coincidan con el filtro seleccionado.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {reportType === 'customers' ? (
        <>
          <section className="metric-grid compact">
            <article className="metric-card success">
              <span>Clientes registrados</span>
              <strong>{customers.length || 'Sin datos'}</strong>
              <p>Total de clientes guardados en el sistema.</p>
            </article>
            <article className="metric-card">
              <span>Clientes B2B</span>
              <strong>{customers.filter((customer) => customer.customerType === 'B2B').length || 'Sin datos'}</strong>
              <p>Clientes empresa registrados actualmente.</p>
            </article>
            <article className="metric-card accent">
              <span>Clientes B2C</span>
              <strong>{customers.filter((customer) => customer.customerType === 'B2C').length || 'Sin datos'}</strong>
              <p>Clientes finales registrados actualmente.</p>
            </article>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>Detalle de clientes</h2>
              <span>{customers.length} clientes</span>
            </div>

            <div className="table-wrap reports-table-wrap">
              {customers.filter((customer) =>
                customerFilter === 'all'
                  ? true
                  : customer.customerType === customerFilter,
              ).length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Tipo</th>
                      <th>RUT / Id</th>
                      <th>Contacto</th>
                      <th>Ultima compra</th>
                      <th>Compras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers
                      .filter((customer) =>
                        customerFilter === 'all'
                          ? true
                          : customer.customerType === customerFilter,
                      )
                      .map((customer) => (
                        <tr key={customer.name}>
                          <td className="reports-primary-cell">{customer.name}</td>
                          <td>{customer.customerType}</td>
                          <td>{customer.identifier || 'Sin dato'}</td>
                          <td>{customer.contact || 'Sin dato'}</td>
                          <td>{customer.lastPurchase}</td>
                          <td>{customer.purchases}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  No hay clientes para el filtro seleccionado.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>Estado de base actual</h2>
          <span>Datos disponibles</span>
        </div>
        <ul className="check-list">
          <li>Productos: {products.length}</li>
          <li>Proveedores: {suppliers.length}</li>
          <li>Clientes: {customers.length}</li>
          <li>Movimientos: {movements.length}</li>
        </ul>
      </section>
    </AppLayout>
  );
}

export default Reports;
