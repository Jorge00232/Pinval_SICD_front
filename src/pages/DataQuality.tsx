import AppLayout from '../components/AppLayout';
import { useLanguage } from '../language/useLanguage';

function DataQuality() {
  const { t } = useLanguage();

  return (
    <AppLayout
      title={t('page.dataQuality.title')}
      description={t('page.dataQuality.description')}
    >
      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <h2>Cargar archivo</h2>
            <span>Excel actual</span>
          </div>
          <form className="grid-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Tipo de informacion
              <select name="sourceType">
                <option>Inventario</option>
                <option>Productos</option>
                <option>Ventas</option>
              </select>
            </label>
            <label>
              Archivo
              <input name="file" type="file" accept=".xlsx,.xls,.csv" />
            </label>
            <button type="submit">Validar archivo</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Validaciones requeridas</h2>
            <span>Gobernanza</span>
          </div>
          <ul className="check-list">
            <li>Detectar productos duplicados.</li>
            <li>Validar campos obligatorios como SKU, nombre y stock.</li>
            <li>Revisar valores vacios o inconsistentes.</li>
            <li>Registrar fecha, usuario y origen de la carga.</li>
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Resultado de validacion</h2>
          <span>Sin archivo cargado</span>
        </div>
        <div className="empty-state">
          Aun no se ha cargado un archivo real de Pinval para validar.
        </div>
      </section>
    </AppLayout>
  );
}

export default DataQuality;
