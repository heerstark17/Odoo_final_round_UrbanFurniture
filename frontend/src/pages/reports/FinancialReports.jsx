import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import EmptyState from "../../components/common/EmptyState";
import {
  BarChart3,
  Calendar,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  PieChart,
  CheckCircle2,
} from "lucide-react";

function ReportBarChart({ title, items, formatCurrency }) {
  const maxValue = Math.max(...items.map((item) => Math.abs(Number(item.value || 0))), 1);

  return (
    <div className="card report-chart-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          <span className="report-chart-caption">Live values from the selected period</span>
        </div>
        <BarChart3 size={20} style={{ color: "var(--text-muted)" }} />
      </div>
      <div className="card-body report-chart-body">
        {items.map((item) => {
          const value = Number(item.value || 0);
          const width = value === 0 ? 0 : Math.max((Math.abs(value) / maxValue) * 100, 3);

          return (
            <div className="report-chart-row" key={item.label}>
              <span className="report-chart-label-text">{item.label}</span>
              <div className="report-chart-track">
                <div
                  className="report-chart-bar"
                  style={{ width: `${width}%`, backgroundColor: item.color || "var(--primary)" }}
                  role="img"
                  aria-label={`${item.label}: ${formatCurrency(value)}`}
                />
              </div>
              <strong>{formatCurrency(value)}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FinancialReports() {
  const [activeTab, setActiveTab] = useState("pl"); // "pl" | "bs" | "budget"
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [plData, setPlData] = useState(null);
  const [bsData, setBsData] = useState(null);
  const [budgetData, setBudgetData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const [plRes, bsRes, bRes] = await Promise.all([
        api.get("/reports/profit-loss", { params }),
        api.get("/reports/balance-sheet", { params }),
        api.get("/reports/budget", { params }),
      ]);

      setPlData(plRes.data);
      setBsData(bsRes.data);
      setBudgetData(bRes.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load financial reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description="Statutory double-entry reports: Real-time Profit & Loss, Balance Sheet, and Budget Variance"
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
                title="Reporting from date"
              />
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: "6px 10px", fontSize: "12px", width: "auto" }}
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                title="Reporting to date"
              />
              {(dateRange.from || dateRange.to) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDateRange({ from: "", to: "" })}
                >
                  Reset
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              title="Print or Export PDF"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>
          </div>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-button ${activeTab === "pl" ? "active" : ""}`}
          onClick={() => setActiveTab("pl")}
        >
          Profit & Loss Account
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "bs" ? "active" : ""}`}
          onClick={() => setActiveTab("bs")}
        >
          Balance Sheet
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "budget" ? "active" : ""}`}
          onClick={() => setActiveTab("budget")}
        >
          Budget Performance Report
        </button>
      </div>

      {/* 1. PROFIT & LOSS REPORT */}
      {activeTab === "pl" && plData && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <StatCard
              label="Operating Revenue (Sales)"
              value={plData.total_income}
              icon={TrendingUp}
              color="primary"
              subtext="Total invoice income"
            />
            <StatCard
              label="Operating Expenses (Purchases)"
              value={plData.total_expense}
              icon={TrendingDown}
              color="warning"
              subtext="Total vendor expenses"
            />
            <StatCard
              label="Net Profit"
              value={plData.net_profit}
              icon={DollarSign}
              color={Number(plData.net_profit) >= 0 ? "success" : "danger"}
              subtext="Income minus Expenses"
            />
          </div>

          <div className="reports-chart-grid">
            <ReportBarChart
              title="Profit & Loss Overview"
              formatCurrency={formatCurrency}
              items={[
                { label: "Operating revenue", value: plData.total_income, color: "var(--success)" },
                { label: "Operating expenses", value: plData.total_expense, color: "var(--warning)" },
                { label: "Net profit", value: plData.net_profit, color: Number(plData.net_profit) >= 0 ? "var(--primary)" : "var(--danger)" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "20px" }}>
            {/* Income Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color: "var(--success)" }}>
                  Operating Income
                </h3>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--success)" }}>
                  {formatCurrency(plData.total_income)}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plData.income?.length > 0 ? (
                      plData.income.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            {item.account_code || "-"}
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.account_name}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          No income recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color: "var(--danger)" }}>
                  Operating Expenses
                </h3>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--danger)" }}>
                  {formatCurrency(plData.total_expense)}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plData.expenses?.length > 0 ? (
                      plData.expenses.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                            {item.account_code || "-"}
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.account_name}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                          No expenses recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET REPORT */}
      {activeTab === "bs" && bsData && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <StatCard
              label="Total Assets"
              value={bsData.total_assets}
              icon={Scale}
              color="primary"
              subtext="Cash, Bank, Debtors, Tax credits"
            />
            <StatCard
              label="Total Liabilities"
              value={bsData.total_liabilities}
              icon={TrendingDown}
              color="warning"
              subtext="Creditors, Tax payables"
            />
            <StatCard
              label="Capital & Retained Profit"
              value={Number(bsData.total_capital || 0) + Number(bsData.net_profit || 0)}
              icon={TrendingUp}
              color="success"
              subtext="Equity + Period Net Profit"
            />
          </div>

          <div className="reports-chart-grid">
            <ReportBarChart
              title="Balance Sheet Composition"
              formatCurrency={formatCurrency}
              items={[
                { label: "Total assets", value: bsData.total_assets, color: "var(--primary)" },
                { label: "Total liabilities", value: bsData.total_liabilities, color: "var(--warning)" },
                { label: "Capital and retained profit", value: Number(bsData.total_capital || 0) + Number(bsData.net_profit || 0), color: "var(--success)" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: "20px" }}>
            {/* Assets */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Assets</h3>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--primary)" }}>
                  {formatCurrency(bsData.total_assets)}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Asset Account</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bsData.assets?.map((a, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          {a.account_code || "-"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{a.account_name}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "var(--bg-subtle)", fontWeight: 700 }}>
                      <td colSpan={2}>Total Assets</td>
                      <td style={{ textAlign: "right", color: "var(--primary)" }}>
                        {formatCurrency(bsData.total_assets)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Liabilities & Capital */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Liabilities & Capital</h3>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "var(--primary)" }}>
                  {formatCurrency(bsData.total_liabilities_and_capital)}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: "#fafbfc" }}>
                      <td colSpan={3} style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        Liabilities
                      </td>
                    </tr>
                    {bsData.liabilities?.map((l, idx) => (
                      <tr key={`l-${idx}`}>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          {l.account_code || "-"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{l.account_name}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(l.amount)}</td>
                      </tr>
                    ))}

                    <tr style={{ backgroundColor: "#fafbfc" }}>
                      <td colSpan={3} style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase" }}>
                        Capital & Equity
                      </td>
                    </tr>
                    {bsData.capital?.map((c, idx) => (
                      <tr key={`c-${idx}`}>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                          {c.account_code || "-"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.account_name}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(c.amount)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>-</td>
                      <td style={{ fontWeight: 600, color: "var(--success)" }}>Current Period Profit</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--success)" }}>
                        {formatCurrency(bsData.net_profit)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "var(--bg-subtle)", fontWeight: 700 }}>
                      <td colSpan={2}>Total Liabilities & Capital</td>
                      <td style={{ textAlign: "right", color: "var(--primary)" }}>
                        {formatCurrency(bsData.total_liabilities_and_capital)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BUDGET REPORT */}
      {activeTab === "budget" && budgetData && (
        <div>
          <div className="stats-grid" style={{ marginBottom: "20px" }}>
            <StatCard
              label="Total Planned Budget"
              value={budgetData.totals?.planned_amount}
              icon={PieChart}
              color="primary"
              subtext="Defined budget targets"
            />
            <StatCard
              label="Committed Amount (Orders)"
              value={budgetData.totals?.committed_amount}
              icon={TrendingDown}
              color="warning"
              subtext="PO / SO allocations"
            />
            <StatCard
              label="Achieved Amount (Actuals)"
              value={budgetData.totals?.achieved_amount}
              icon={CheckCircle2}
              color="success"
              subtext="Invoiced / Billed spend"
            />
            <StatCard
              label="Remaining Budget"
              value={budgetData.totals?.remaining_amount}
              icon={DollarSign}
              color="info"
              subtext="Planned minus Committed"
            />
          </div>

          <div className="reports-chart-grid">
            <ReportBarChart
              title="Budget Utilization"
              formatCurrency={formatCurrency}
              items={[
                { label: "Planned", value: budgetData.totals?.planned_amount, color: "var(--primary)" },
                { label: "Committed", value: budgetData.totals?.committed_amount, color: "var(--warning)" },
                { label: "Achieved", value: budgetData.totals?.achieved_amount, color: "var(--success)" },
              ]}
            />
          </div>

          {budgetData.budgets?.map((b) => (
            <div className="card" key={b.budget_id} style={{ marginBottom: "24px" }}>
              <div className="card-header">
                <h3 className="card-title">{b.budget_name}</h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Analytic Account</th>
                      <th style={{ textAlign: "right" }}>Planned</th>
                      <th style={{ textAlign: "right" }}>Committed</th>
                      <th style={{ textAlign: "right" }}>Achieved</th>
                      <th style={{ textAlign: "right" }}>Remaining</th>
                      <th style={{ textAlign: "right" }}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.lines?.map((line, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{line.analytic_account_name}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(line.planned_amount)}</td>
                        <td style={{ textAlign: "right", color: "var(--warning)" }}>
                          {formatCurrency(line.committed_amount)}
                        </td>
                        <td style={{ textAlign: "right", color: "var(--success)" }}>
                          {formatCurrency(line.achieved_amount)}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrency(line.remaining_amount)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            color: line.variance >= 0 ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {formatCurrency(line.variance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
