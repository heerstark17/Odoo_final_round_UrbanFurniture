function FormModal({
  show,
  title,
  children,
  onClose,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
}) {
  if (!show) {
    return null;
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit(e);
    }
  };

  return (
    <>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="formModalTitle"
      >
        <div
          className="modal-dialog modal-dialog-centered"
          role="document"
          style={{
            maxWidth: "700px",
            width: "calc(100% - 2rem)",
            margin: "1.75rem auto",
          }}
        >
          <div className="modal-content">
            <form onSubmit={handleFormSubmit}>
              <div className="modal-header">
                <h5 className="modal-title" id="formModalTitle">
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
                {children}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  {cancelText}
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      {submitText}
                    </>
                  ) : (
                    submitText
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show"></div>
    </>
  );
}

export default FormModal;