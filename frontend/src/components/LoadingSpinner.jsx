function LoadingSpinner({ message = "Loading...", fullPage = false }) {
  return (
    <div
      className={
        "d-flex flex-column align-items-center justify-content-center text-center" +
        (fullPage ? " w-100" : " py-4")
      }
      style={fullPage ? { minHeight: "100%" } : undefined}
    >
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      <p className="text-muted small mt-2 mb-0">{message}</p>
    </div>
  );
}

export default LoadingSpinner;