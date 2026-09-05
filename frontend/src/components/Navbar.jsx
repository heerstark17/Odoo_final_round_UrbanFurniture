function Navbar({ userName = "User", userRole = "Accountant" }) {
  return (
    <nav className="navbar px-3 py-2 border-bottom border-secondary bg-dark text-white">
      <div className="container-fluid px-0">

        {/* Brand */}
        <div className="d-flex align-items-baseline gap-2">
          <span className="fs-5 fw-semibold text-white">
            Urban Furniture
          </span>

          <span className="d-none d-md-inline text-secondary small">
            Accounting System
          </span>
        </div>

        {/* Right side */}
        <div className="d-flex align-items-center gap-3 ms-auto">


          {/* Divider */}
          <div
            className="vr bg-secondary d-none d-sm-block"
            style={{ height: "24px" }}
          ></div>

          <div className="d-flex align-items-center gap-2">
  <div
    className="rounded-circle d-flex align-items-center justify-content-center"
    style={{
      width: "36px",
      height: "36px",
      backgroundColor: "#6c757d",
      color: "#fff",
    }}
  >
    U
  </div>

  <div className="d-flex flex-column">
    <span className="fw-semibold">User</span>
    <small className="text-muted">Accountant</small>
  </div>
</div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;