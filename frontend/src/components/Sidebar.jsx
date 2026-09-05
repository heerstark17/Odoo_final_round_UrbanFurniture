import { NavLink } from "react-router-dom";

// Centralized nav definition — easy to extend/modify later.
const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", path: "/dashboard", icon: "▤" }],
  },
  {
    label: "MASTER DATA",
    items: [
      { label: "Contacts", path: "/master-data/contacts", icon: "👥" },
      { label: "Products", path: "/master-data/products", icon: "📦" },
      {
        label: "Chart of Accounts",
        path: "/master-data/chart-of-accounts",
        icon: "📒",
      },
      { label: "Journals", path: "/master-data/journals", icon: "📓" },
      {
        label: "Analytic Accounts",
        path: "/master-data/analytic-accounts",
        icon: "📊",
      },
    ],
  },
  {
    label: "SALES",
    items: [
      { label: "Sales Orders", path: "/sales/orders", icon: "🧾" },
      { label: "Customer Invoices", path: "/sales/invoices", icon: "💵" },
      { label: "Invoice Payments", path: "/sales/payments", icon: "💳" },
    ],
  },
  {
    label: "PURCHASE",
    items: [
      { label: "Purchase Orders", path: "/purchase/orders", icon: "🧾" },
      { label: "Vendor Bills", path: "/purchase/bills", icon: "📄" },
      { label: "Bill Payments", path: "/purchase/payments", icon: "💳" },
    ],
  },
  {
    label: "ACCOUNTING",
    items: [
      {
        label: "Journal Entries",
        path: "/accounting/journal-entries",
        icon: "📘",
      },
    ],
  },
  {
    label: "BUDGETS",
    items: [
      { label: "Budgets", path: "/budgets", icon: "📈", end: true },
      { label: "Budget Report", path: "/budgets/report", icon: "📉" },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { label: "Profit & Loss", path: "/reports/profit-loss", icon: "📑" },
      { label: "Balance Sheet", path: "/reports/balance-sheet", icon: "📋" },
    ],
  },
];

function Sidebar() {
  return (
    <div
      className="d-flex flex-column bg-dark text-light border-end vh-100 overflow-auto"
      style={{ width: "270px", minWidth: "270px" }}
    >
      {/* Brand */}
      <div className="px-3 py-3 border-bottom border-secondary">
        <span className="fw-semibold fs-6">Urban Furniture</span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className="px-3 mb-1 text-uppercase text-secondary"
              style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}
            >
              {section.label}
            </div>
            <ul className="nav flex-column">
              {section.items.map((item) => (
                <li className="nav-item" key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end || false}
                    className={({ isActive }) =>
                      "nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-0 " +
                      (isActive
                        ? "bg-primary text-white"
                        : "text-light-emphasis text-opacity-75")
                    }
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="small">{item.label}</span>
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