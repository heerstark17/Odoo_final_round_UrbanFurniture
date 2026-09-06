import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  ShoppingBag,
  Receipt,
  CreditCard,
  BookOpen,
  ListOrdered,
  BookMarked,
  Percent,
  PieChart,
  Users,
  Package,
  BarChart3,
  LogOut,
  UserCheck,
  Building2,
  ChevronRight,
} from "lucide-react";

export default function AppLayout() {
  const { user, logout, isContact } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Humanize path for breadcrumb
  const currentPath = location.pathname.split("/")[1] || "dashboard";
  const pathTitles = {
    dashboard: "Executive Dashboard",
    contacts: "Contact Master",
    products: "Product Master",
    "chart-of-accounts": "Chart of Accounts Master",
    journals: "Journals Master",
    taxes: "Taxes Master",
    "sales-orders": "Sales Orders",
    invoices: "Customer Invoices",
    "purchase-orders": "Purchase Orders",
    "vendor-bills": "Vendor Bills",
    payments: "Payments & Receipts",
    "journal-entries": "Double-Entry Journal Entries",
    budgets: "Budgets & Analytic Accounts",
    reports: "Financial Reports (P&L, Balance Sheet, Budget)",
    portal: "Customer & Vendor Portal",
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <Building2 size={20} />
          </div>
          <div className="brand-info">
            <h1>Urban Furniture</h1>
            <span>Accounting System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {!isContact ? (
            <>
              <div className="nav-section-title">Overview</div>
              <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <div className="nav-section-title">Sales Flow</div>
              <NavLink to="/sales-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <ShoppingCart size={18} />
                <span>Sales Orders</span>
              </NavLink>
              <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <FileText size={18} />
                <span>Customer Invoices</span>
              </NavLink>

              <div className="nav-section-title">Purchase Flow</div>
              <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <ShoppingBag size={18} />
                <span>Purchase Orders</span>
              </NavLink>
              <NavLink to="/vendor-bills" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Receipt size={18} />
                <span>Vendor Bills</span>
              </NavLink>

              <div className="nav-section-title">Cash & Bank</div>
              <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <CreditCard size={18} />
                <span>Payments</span>
              </NavLink>

              <div className="nav-section-title">Accounting & Ledgers</div>
              <NavLink to="/journal-entries" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <BookOpen size={18} />
                <span>Journal Entries</span>
              </NavLink>
              <NavLink to="/chart-of-accounts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <ListOrdered size={18} />
                <span>Chart of Accounts</span>
              </NavLink>
              <NavLink to="/journals" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <BookMarked size={18} />
                <span>Journals</span>
              </NavLink>
              <NavLink to="/taxes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Percent size={18} />
                <span>Taxes</span>
              </NavLink>

              <div className="nav-section-title">Planning & Analytics</div>
              <NavLink to="/budgets" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <PieChart size={18} />
                <span>Budgets & Analytics</span>
              </NavLink>

              <div className="nav-section-title">Master Data</div>
              <NavLink to="/contacts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Users size={18} />
                <span>Contacts</span>
              </NavLink>
              <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Package size={18} />
                <span>Products</span>
              </NavLink>

              <div className="nav-section-title">Reports</div>
              <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <BarChart3 size={18} />
                <span>Financial Reports</span>
              </NavLink>
            </>
          ) : (
            <>
              <div className="nav-section-title">Contact Portal</div>
              <NavLink to="/portal" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <UserCheck size={18} />
                <span>My Portal</span>
              </NavLink>
              <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <ShoppingBag size={18} />
                <span>My Purchase Orders</span>
              </NavLink>
              <NavLink to="/invoices" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <FileText size={18} />
                <span>My Invoices</span>
              </NavLink>
              <NavLink to="/vendor-bills" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Receipt size={18} />
                <span>My Vendor Bills</span>
              </NavLink>
              <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <CreditCard size={18} />
                <span>My Payments</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-snippet">
            <div className="user-avatar">
              {(user?.full_name || user?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.full_name || user?.login_id}</div>
              <span className="user-role-badge">{user?.role}</span>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--text-secondary)" }}>
            <span style={{ fontWeight: 500 }}>Urban Furniture</span>
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              {pathTitles[currentPath] || currentPath}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
