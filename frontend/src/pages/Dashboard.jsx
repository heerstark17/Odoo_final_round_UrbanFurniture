import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import StatCard from "../components/common/StatCard";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import EmptyState from "../components/common/EmptyState";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  DollarSign,
  PlusCircle,
  FileText,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Calendar,
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const [dashRes, invRes, billsRes] = await Promise.all([
        api.get("/dashboard", { params }),
        api.get("/invoices"),
        api.get("/vendor-bills"),
      ]);

      setData(dashRes.data);
      setInvoices((invRes.data || []).slice(0, 5));
      setBills((billsRes.data || []).slice(0, 5));
    } catch (err) {
      setError(err.userMessage || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateRange]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  return (
    <div>
      <PageHeader
        title="Accounting Dashboard"
        description="Real-time financial performance, cash flow snapshot, and recent business activities"
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={16} style={{ color: "var(--text-muted)" }} />
              <input
                type="date"
                className="form-input"
                style={{ padding: "6px 10px", fontSize: "12px", width: "auto" }}
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                title="Filter from date"
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: "6px 10px", fontSize: "12px", width: "auto" }}
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                title="Filter to date"
              />
              {(dateRange.from || dateRange.to) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDateRange({ from: "", to: "" })}
                >
                  Clear
                </button>
              )}
            </div>
            <Link to="/sales-orders" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span>New Sale</span>
            </Link>
          </div>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Metrics Grid */}
      <div className="stats-grid">
        <StatCard
          label="Total Sales"
          value={data?.total_sales ?? 0}
          icon={TrendingUp}
          color="primary"
          subtext="Revenue from confirmed invoices"
        />
        <StatCard
          label="Total Purchases"
          value={data?.total_purchases ?? 0}
          icon={TrendingDown}
          color="warning"
          subtext="Vendor bill expenses"
        />
        <StatCard
          label="Accounts Receivable"
          value={data?.total_receivables ?? 0}
          icon={ArrowDownLeft}
          color="info"
          subtext="Uncollected customer balances"
        />
        <StatCard
          label="Accounts Payable"
          value={data?.total_payables ?? 0}
          icon={ArrowUpRight}
          color="danger"
          subtext="Outstanding vendor dues"
        />
        <StatCard
          label="Cash & Bank"
          value={data?.total_cash_bank ?? 0}
          icon={Wallet}
          color="success"
          subtext="Current liquid balance"
        />
        <StatCard
          label="Net Profit"
          value={data?.net_profit ?? 0}
          icon={DollarSign}
          color={Number(data?.net_profit) >= 0 ? "success" : "danger"}
          subtext="Total Income minus Expenses"
        />
      </div>

      {/* Budget Summary Card */}
      {data && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart3 size={18} style={{ color: "var(--primary)" }} />
              <h3 className="card-title">Budget Utilization Overview</h3>
            </div>
            <Link to="/budgets" className="btn btn-secondary btn-sm">
              Manage Budgets
            </Link>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>PLANNED BUDGET</span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {formatCurrency(data.budget_planned)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>COMMITTED (PO/SO)</span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--warning)" }}>
                  {formatCurrency(data.budget_committed)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>ACHIEVED (INVOICES/BILLS)</span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--success)" }}>
                  {formatCurrency(data.budget_achieved)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>REMAINING BUDGET</span>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--primary)" }}>
                  {formatCurrency(Number(data.budget_planned || 0) - Number(data.budget_committed || 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links & Shortcuts Banner */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <Link
          to="/sales-orders"
          className="card"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary-subtle)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={20} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Sales Orders</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Record quotes & orders</div>
          </div>
        </Link>

        <Link
          to="/purchase-orders"
          className="card"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--warning-subtle)",
              color: "var(--warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Purchase Orders</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Orders for raw goods/furniture</div>
          </div>
        </Link>

        <Link
          to="/payments"
          className="card"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--success-subtle)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Wallet size={20} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Record Payments</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Bank & Cash transfers</div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="card"
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--info-subtle)",
              color: "var(--info)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Financial Reports</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>P&L, Balance Sheet, Budgets</div>
          </div>
        </Link>
      </div>

      {/* Two Column Section: Recent Invoices & Recent Vendor Bills */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px" }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} style={{ color: "var(--primary)" }} />
              <h3 className="card-title">Recent Customer Invoices</h3>
            </div>
            <Link to="/invoices" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {invoices.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link to="/invoices" style={{ fontWeight: 600, color: "var(--primary)" }}>
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td>{inv.customer_name}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(inv.grand_total)}</td>
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No customer invoices yet" description="Generate an invoice from confirmed sales orders." />
            )}
          </div>
        </div>

        {/* Recent Vendor Bills */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Receipt size={18} style={{ color: "var(--warning)" }} />
              <h3 className="card-title">Recent Vendor Bills</h3>
            </div>
            <Link to="/vendor-bills" className="btn btn-secondary btn-sm">
              View All
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {bills.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td>
                          <Link to="/vendor-bills" style={{ fontWeight: 600, color: "var(--primary)" }}>
                            {bill.bill_number}
                          </Link>
                        </td>
                        <td>{bill.vendor_name}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(bill.grand_total)}</td>
                        <td>
                          <StatusBadge status={bill.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No vendor bills yet" description="Convert purchase orders to vendor bills." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
