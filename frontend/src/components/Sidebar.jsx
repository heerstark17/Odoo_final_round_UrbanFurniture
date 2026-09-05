import { NavLink } from "react-router-dom";


const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", path: "/dashboard", icon: "bi-grid-1x2" }],
  },
  {
    label: "MASTER DATA",
    items: [
      { label: "Contacts", path: "/master-data/contacts", icon: "bi-people" },
      { label: "Products", path: "/master-data/products", icon: "bi-box-seam" },
      {
        label: "Chart of Accounts",
        path: "/master-data/chart-of-accounts",
        icon: "bi-journal-bookmark",
      },
      { label: "Journals", path: "/master-data/journals", icon: "bi-journal-text" },
      {
        label: "Analytic Accounts",
        path: "/master-data/analytic-accounts",
        icon: "bi-bar-chart",
      },
    ],
  },
  {
    label: "SALES",
    items: [
      { label: "Sales Orders", path: "/sales/orders", icon: "bi-receipt" },
      { label: "Customer Invoices", path: "/sales/invoices", icon: "bi-file-earmark-text" },
      { label: "Invoice Payments", path: "/sales/payments", icon: "bi-credit-card" },
    ],
  },
  {
    label: "PURCHASE",
    items: [
      { label: "Purchase Orders", path: "/purchase/orders", icon: "bi-receipt-cutoff" },
      { label: "Vendor Bills", path: "/purchase/bills", icon: "bi-file-earmark" },
      { label: "Bill Payments", path: "/purchase/payments", icon: "bi-credit-card-2-front" },
    ],
  },
  {
    label: "ACCOUNTING",
    items: [
      {
        label: "Journal Entries",
        path: "/accounting/journal-entries",
        icon: "bi-journal-check",
      },
    ],
  },
  {
    label: "BUDGETS",
    items: [
      { label: "Budgets", path: "/budgets", icon: "bi-graph-up-arrow", end: true },
      { label: "Budget Report", path: "/budgets/report", icon: "bi-graph-down-arrow" },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { label: "Profit & Loss", path: "/reports/profit-loss", icon: "bi-file-earmark-bar-graph" },
      { label: "Balance Sheet", path: "/reports/balance-sheet", icon: "bi-clipboard-data" },
    ],
  },
];


const COLORS = {
  sidebarBg: "#1f2327",
  activeBg: "#343a40",
  hoverBg: "#2a2f34",
  inactiveText: "#d0d3d6", 
  activeText: "#ffffff",
  inactiveIcon: "#9aa0a6", 
  activeIcon: "#ffffff",
  sectionLabel: "#7a8085",
  accentBorder: "#5a6268",
  border: "#2f3438",
};

function Sidebar() {
  return (
    <div
      className="d-flex flex-column vh-100 overflow-auto border-end"
      style={{
        width: "270px",
        minWidth: "270px",
        backgroundColor: COLORS.sidebarBg,
        borderColor: COLORS.border,
      }}
    >
      {/* Brand */}
      <div
        className="px-3 py-3 border-bottom"
        style={{ borderColor: COLORS.border }}
      >
        <span className="fw-semibold fs-6" style={{ color: COLORS.activeText }}>
          Urban Furniture
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className="px-3 mb-1 text-uppercase"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
                color: COLORS.sectionLabel,
              }}
            >
              {section.label}
            </div>
            <ul className="nav flex-column">
              {section.items.map((item) => (
                <li className="nav-item" key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end || false}
                    className="sidebar-nav-link"
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      textDecoration: "none",
                      borderLeft: isActive
                        ? `3px solid ${COLORS.accentBorder}`
                        : "3px solid transparent",
                      backgroundColor: isActive ? COLORS.activeBg : "transparent",
                      color: isActive ? COLORS.activeText : COLORS.inactiveText,
                    })}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.classList.contains("active-link")) {
                        e.currentTarget.style.backgroundColor = COLORS.hoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      const isActive = e.currentTarget.getAttribute("aria-current") === "page";
                      e.currentTarget.style.backgroundColor = isActive
                        ? COLORS.activeBg
                        : "transparent";
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <i
                          className={`bi ${item.icon}`}
                          style={{
                            width: "1.1rem",
                            textAlign: "center",
                            fontSize: "0.95rem",
                            color: isActive ? COLORS.activeIcon : COLORS.inactiveIcon,
                          }}
                          aria-hidden="true"
                        ></i>
                        <span className="small">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;