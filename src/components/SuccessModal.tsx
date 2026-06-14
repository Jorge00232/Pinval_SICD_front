import { useEffect } from 'react';

type SuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  autoCloseTime?: number; // optional auto-close time in ms
};

function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  autoCloseTime = 4000,
}: SuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Auto close after timeout
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseTime);

    // Escape key listener to close modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, autoCloseTime]);

  if (!isOpen) return null;

  return (
    <div
      className="success-modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="success-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-modal-icon-wrapper">
          <svg
            className="success-modal-icon"
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              className="success-modal-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="success-modal-check"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        <h2 className="success-modal-title">{title}</h2>
        <p className="success-modal-message">{message}</p>

        <button
          type="button"
          className="success-modal-button"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;
