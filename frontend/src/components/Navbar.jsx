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

          {/* Notification */}
          <div className="position-relative d-flex align-items-center justify-content-center">
            <span
              className="fs-5"
              role="img"
              aria-label="Notifications"
            >
              🔔
            </span>

            <span
              className="position-absolute top-0 start-100 translate-middle bg-danger border border-dark rounded-circle"
              style={{ width: "8px", height: "8px" }}
            >
              <span className="visually-hidden">
                New notifications
              </span>
            </span>
          </div>

          {/* Divider */}
          <div
            className="vr bg-secondary d-none d-sm-block"
            style={{ height: "24px" }}
          ></div>

          {/* User */}
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-secondary"
              style={{ width: "36px", height: "36px" }}
            >
              <span className="fw-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="d-none d-sm-flex flex-column lh-sm">
              <span className="fw-semibold text-white small">
                {userName}
              </span>

              <span
                className="text-secondary"
                style={{ fontSize: "0.75rem" }}
              >
                {userRole}
              </span>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;