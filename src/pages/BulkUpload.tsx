import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import AppLayout from '../components/AppLayout';
import { canManageData } from '../api/authApi';
import {
  uploadBulkExcel,
  type BulkUploadImportType,
  type BulkUploadSummary,
} from '../api/importsApi';
import { useLanguage } from '../language/useLanguage';

type ImportOption = {
  type: BulkUploadImportType;
  titleKey: string;
  descriptionKey: string;
  columnsKey: string;
};

const importOptions: ImportOption[] = [
  {
    type: 'products',
    titleKey: 'bulkUpload.productsTitle',
    descriptionKey: 'bulkUpload.productsDescription',
    columnsKey: 'bulkUpload.productsColumns',
  },
  {
    type: 'customers',
    titleKey: 'bulkUpload.customersTitle',
    descriptionKey: 'bulkUpload.customersDescription',
    columnsKey: 'bulkUpload.customersColumns',
  },
  {
    type: 'suppliers',
    titleKey: 'bulkUpload.suppliersTitle',
    descriptionKey: 'bulkUpload.suppliersDescription',
    columnsKey: 'bulkUpload.suppliersColumns',
  },
];

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 KB';
  }

  const sizeInKb = size / 1024;

  if (sizeInKb < 1024) {
    return `${sizeInKb.toFixed(1)} KB`;
  }

  return `${(sizeInKb / 1024).toFixed(2)} MB`;
}

function BulkUpload() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canManage = canManageData();

  const [selectedType, setSelectedType] = useState<BulkUploadImportType>('products');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<BulkUploadSummary | null>(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | ''>('');

  const selectedOption = useMemo(
    () => importOptions.find((option) => option.type === selectedType) ?? importOptions[0],
    [selectedType],
  );

  const hasErrors = Boolean(summary?.errors.length);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSummary(null);
    setMessage('');
    setMessageTone('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage(t('bulkUpload.selectFileRequired'));
      setMessageTone('error');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setMessageTone('');
    setSummary(null);

    try {
      const result = await uploadBulkExcel(selectedType, selectedFile);
      setSummary(result);
      setMessage(t('bulkUpload.uploadSuccess'));
      setMessageTone('success');
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('bulkUpload.uploadError'));
      setMessageTone('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout
      title={t('page.bulkUpload.title')}
      description={t('page.bulkUpload.description')}
    >
      <section className="bulk-upload-layout">
        {!canManage ? (
          <article className="panel bulk-upload-access-panel">
            <div className="panel-heading">
              <h2>{t('bulkUpload.restrictedTitle')}</h2>
              <span>VIEWER</span>
            </div>
            <p className="panel-note">{t('bulkUpload.restrictedDescription')}</p>
          </article>
        ) : (
          <>
            <article className="panel bulk-upload-intro-panel">
              <div className="panel-heading">
                <h2>{t('bulkUpload.sectionTitle')}</h2>
                <span>{t('bulkUpload.allowedFormats')}</span>
              </div>

              <p className="panel-note">{t('bulkUpload.transitionNote')}</p>

              <div className="bulk-upload-type-grid">
                {importOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    className={`bulk-upload-type-card ${selectedType === option.type ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedType(option.type);
                      setSummary(null);
                      setMessage('');
                      setMessageTone('');
                    }}
                  >
                    <span>{t(option.titleKey)}</span>
                    <strong>{t(option.descriptionKey)}</strong>
                    <small>{t(option.columnsKey)}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel bulk-upload-card">
              <div className="panel-heading">
                <h2>{t(selectedOption.titleKey)}</h2>
                <span>{t('bulkUpload.backendValidation')}</span>
              </div>

              <form className="bulk-upload-form" onSubmit={handleSubmit}>
                <label className="bulk-upload-zone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />

                  <span className="bulk-upload-zone-icon">XLS</span>
                  <strong>{t('bulkUpload.selectExcel')}</strong>
                  <small>{t('bulkUpload.dragHelp')}</small>
                </label>

                {selectedFile ? (
                  <div className="bulk-upload-file-card">
                    <div>
                      <strong>{selectedFile.name}</strong>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => {
                        setSelectedFile(null);

                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      disabled={isUploading}
                    >
                      {t('bulkUpload.removeFile')}
                    </button>
                  </div>
                ) : null}

                {message ? (
                  <p className={`form-message ${messageTone === 'error' ? 'error' : 'success'}`}>
                    {message}
                  </p>
                ) : null}

                <div className="bulk-upload-actions">
                  <button type="submit" disabled={isUploading || !selectedFile}>
                    {isUploading ? t('bulkUpload.uploading') : t('bulkUpload.uploadButton')}
                  </button>
                </div>
              </form>
            </article>

            {summary ? (
              <article className="panel bulk-upload-result-panel">
                <div className="panel-heading">
                  <h2>{t('bulkUpload.resultTitle')}</h2>
                  <span>{summary.fileName || t(selectedOption.titleKey)}</span>
                </div>

                <div className="bulk-upload-summary-grid">
                  <div>
                    <span>{t('bulkUpload.totalRows')}</span>
                    <strong>{summary.totalRows}</strong>
                  </div>
                  <div>
                    <span>{t('bulkUpload.processedRows')}</span>
                    <strong>{summary.processedRows}</strong>
                  </div>
                  <div>
                    <span>{t('bulkUpload.created')}</span>
                    <strong>{summary.created}</strong>
                  </div>
                  <div>
                    <span>{t('bulkUpload.updated')}</span>
                    <strong>{summary.updated}</strong>
                  </div>
                  <div>
                    <span>{t('bulkUpload.skipped')}</span>
                    <strong>{summary.skipped}</strong>
                  </div>
                  <div className={hasErrors ? 'danger' : 'success'}>
                    <span>{t('bulkUpload.errors')}</span>
                    <strong>{summary.errors.length}</strong>
                  </div>
                </div>

                {hasErrors ? (
                  <div className="bulk-upload-errors">
                    <h3>{t('bulkUpload.errorsTitle')}</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>{t('bulkUpload.row')}</th>
                            <th>{t('bulkUpload.reason')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.errors.map((error, index) => (
                            <tr key={`${error.row}-${index}`}>
                              <td className="numeric-cell">{error.row}</td>
                              <td>{error.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="panel-note">{t('bulkUpload.errorsLimit')}</p>
                  </div>
                ) : (
                  <p className="bulk-upload-success-note">{t('bulkUpload.noErrors')}</p>
                )}
              </article>
            ) : null}
          </>
        )}
      </section>
    </AppLayout>
  );
}

export default BulkUpload;
