import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';

function Movements() {
  const { movements } = useInventory();

  return (
    <AppLayout
      title="Movimientos de inventario"
      description="Trazabilidad completa de entradas, salidas, ajustes, usuarios y fechas."
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>Historial completo</h2>
          <span>{movements.length} movimientos</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {movements.length > 0 ? (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <span
                        className={`status ${
                          movement.type === 'Salida' ? 'danger' : 'ok'
                        }`}
                      >
                        {movement.type}
                      </span>
                    </td>
                    <td>{movement.product}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.user}</td>
                    <td>{movement.date}</td>
                    <td>{movement.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No hay movimientos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

export default Movements;
