import { useEffect } from 'react';

type ConfirmDetail = {
  label: string;
  value: string;
};

type ConfirmModalProps = {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  details: ConfirmDetail[];
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmModal({
  isOpen,
  title = '¿Estás seguro?',
  subtitle,
  details,
  confirmLabel = 'Agregar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={onCancel}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="confirm-modal-icon-wrapper">
          <svg
            className="confirm-modal-icon"
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            fill="none"
          >
            <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" />
            <path
              d="M26 15v13"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="26" cy="35" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>

        {subtitle && (
          <p className="confirm-modal-subtitle">{subtitle}</p>
        )}

        {details.length > 0 && (
          <div className="confirm-modal-details">
            <p className="confirm-modal-details-heading">Resumen de lo que se va a registrar:</p>
            <ul className="confirm-modal-detail-list">
              {details.map((detail) => (
                <li key={detail.label} className="confirm-modal-detail-item">
                  <span className="confirm-modal-detail-label">{detail.label}</span>
                  <span className="confirm-modal-detail-value">{detail.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-cancel-btn"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-modal-confirm-btn"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
