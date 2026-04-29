import AppLayout from '../components/AppLayout';
import { useInventory } from '../state/useInventory';
import { useLanguage } from '../language/useLanguage';

function Movements() {
  const { movements } = useInventory();
  const { t } = useLanguage();

  const getMovementTypeLabel = (type: string) => {
    if (type === 'Entrada') {
      return t('movements.entry');
    }

    if (type === 'Salida') {
      return t('movements.exit');
    }

    return t('movements.adjustment');
  };

  return (
    <AppLayout
      title={t('page.movements.title')}
      description={t('page.movements.description')}
    >
      <section className="panel">
        <div className="panel-heading">
          <h2>{t('movements.fullHistory')}</h2>
          <span>{movements.length} {t('home.movements')}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('movements.type')}</th>
                <th>{t('movements.product')}</th>
                <th>{t('movements.quantity')}</th>
                <th>{t('movements.user')}</th>
                <th>{t('movements.date')}</th>
                <th>{t('movements.detail')}</th>
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
                        {getMovementTypeLabel(movement.type)}
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
                  <td colSpan={6}>{t('movements.noMovements')}</td>
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
