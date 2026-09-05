import { useId } from "react";

function ConfirmModal({
  show,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "danger",
}) {
  const baseId = useId();
  const titleId = `confirmModalTitle-${baseId}`;
  const messageId = `confirmModalMessage-${baseId}`;

  if (!show) {
    return null;
  }

  const handleConfirmClick = () => {
    if (loading) {
      return;
    }
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  };

  return (
    <>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id={titleId}>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              <p id={messageId} className="mb-0">
                {message}
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                {cancelText}
              </button>
              <button
                type="button"
                className={`btn btn-${variant}`}
                onClick={handleConfirmClick}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {confirmText}
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </>
  );
}

export default ConfirmModal;