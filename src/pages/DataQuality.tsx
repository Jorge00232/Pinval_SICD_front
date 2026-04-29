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
            <h2>{t('dataQuality.uploadFile')}</h2>
            <span>{t('dataQuality.currentExcel')}</span>
          </div>
          <form className="grid-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              {t('dataQuality.sourceType')}
              <select name="sourceType">
                <option>{t('nav.inventory')}</option>
                <option>{t('nav.products')}</option>
                <option>{t('nav.sales')}</option>
              </select>
            </label>
            <label>
              {t('dataQuality.file')}
              <input name="file" type="file" accept=".xlsx,.xls,.csv" />
            </label>
            <button type="submit">{t('dataQuality.validateFile')}</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>{t('dataQuality.requiredValidations')}</h2>
            <span>{t('dataQuality.governance')}</span>
          </div>
          <ul className="check-list">
            <li>{t('dataQuality.validation1')}</li>
            <li>{t('dataQuality.validation2')}</li>
            <li>{t('dataQuality.validation3')}</li>
            <li>{t('dataQuality.validation4')}</li>
          </ul>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>{t('dataQuality.validationResult')}</h2>
          <span>{t('dataQuality.noLoadedFile')}</span>
        </div>
        <div className="empty-state">{t('dataQuality.emptyState')}</div>
      </section>
    </AppLayout>
  );
}

export default DataQuality;
