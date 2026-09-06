import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import {
  PieChart,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  CheckCircle2,
  PlusCircle,
  Eye,
} from "lucide-react";

export default function BudgetsList() {
  const [activeTab, setActiveTab] = useState("budgets"); // "budgets" | "analytics"

  // Budgets state
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");

  // Create Budget Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    budget_name: "",
    start_date: "2026-04-01",
    end_date: "2027-03-31",
  });
  const [savingBudget, setSavingBudget] = useState(false);

  // Budget Lines / Details Modal
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [budgetLines, setBudgetLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);

  // Add Line Modal
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [lineForm, setLineForm] = useState({
    analytic_account_id: "",
    planned_amount: "",
  });
  const [savingLine, setSavingLine] = useState(false);

  // Create Analytic Account Modal
  const [isAnalyticModalOpen, setIsAnalyticModalOpen] = useState(false);
  const [analyticForm, setAnalyticForm] = useState({
    name: "",
    analytic_type: "expense",
  });
  const [savingAnalytic, setSavingAnalytic] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [bRes, aRes] = await Promise.all([
        api.get("/budgets"),
        api.get("/analytic-accounts"),
      ]);
      setBudgets(bRes.data || []);
      setAnalytics(aRes.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load budget and analytic records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openBudgetDetails = async (budget) => {
    setSelectedBudget(budget);
    setIsDetailsModalOpen(true);
    try {
      setLoadingLines(true);
      const res = await api.get(`/budgets/${budget.id}/lines`);
      setBudgetLines(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load budget lines");
    } finally {
      setLoadingLines(false);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      setSavingBudget(true);
      setError("");
      await api.post("/budgets", {
        budget_name: budgetForm.budget_name.trim(),
        start_date: budgetForm.start_date,
        end_date: budgetForm.end_date,
      });
      setIsBudgetModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Failed to create budget");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleAddBudgetLine = async (e) => {
    e.preventDefault();
    if (!selectedBudget) return;
    try {
      setSavingLine(true);
      setError("");
      await api.post(`/budgets/${selectedBudget.id}/lines`, {
        analytic_account_id: parseInt(lineForm.analytic_account_id),
        planned_amount: parseFloat(lineForm.planned_amount) || 0,
      });
      setIsAddLineModalOpen(false);
      const res = await api.get(`/budgets/${selectedBudget.id}/lines`);
      setBudgetLines(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to add budget line");
    } finally {
      setSavingLine(false);
    }
  };

  const handleDeleteBudgetLine = async (lineId) => {
    if (!selectedBudget) return;
    try {
      await api.delete(`/budgets/${selectedBudget.id}/lines/${lineId}`);
      const res = await api.get(`/budgets/${selectedBudget.id}/lines`);
      setBudgetLines(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to delete budget line");
    }
  };

  const handleCreateAnalytic = async (e) => {
    e.preventDefault();
    try {
      setSavingAnalytic(true);
      setError("");
      await api.post("/analytic-accounts", {
        name: analyticForm.name.trim(),
        analytic_type: analyticForm.analytic_type,
      });
      setIsAnalyticModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Failed to create analytic account");
    } finally {
      setSavingAnalytic(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  return (
    <div>
      <PageHeader
        title="Budgets & Cost Centers"
        description="Monitor departmental expenses, project budgets, and planned vs actual variance"
        actions={
          activeTab === "budgets" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setBudgetForm({
                  budget_name: `FY ${new Date().getFullYear()}-${new Date().getFullYear() + 1} Budget`,
                  start_date: `${new Date().getFullYear()}-04-01`,
                  end_date: `${new Date().getFullYear() + 1}-03-31`,
                });
                setIsBudgetModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Create Budget</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setAnalyticForm({ name: "", analytic_type: "expense" });
                setIsAnalyticModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Create Analytic Account</span>
            </button>
          )
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-button ${activeTab === "budgets" ? "active" : ""}`}
          onClick={() => setActiveTab("budgets")}
        >
          Budgets ({budgets.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytic Accounts ({analytics.length})
        </button>
        <div style={{ marginLeft: "auto", paddingBottom: "8px" }}>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        activeTab === "budgets" ? (
          <div className="kanban-grid">
            {budgets.map((b) => (
              <div key={b.id} className="kanban-card">
                <div className="kanban-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--primary-subtle)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <PieChart size={18} />
                    </div>
                    <div>
                      <span className="kanban-card-title">{b.budget_name}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Responsible: {b.responsible_user_name || "Admin"}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="kanban-card-body" style={{ marginTop: "6px" }}>
                  <div className="kanban-card-sub">
                    <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                    <span>{String(b.start_date).slice(0, 10)} to {String(b.end_date).slice(0, 10)}</span>
                  </div>
                </div>

                <div className="kanban-card-footer">
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{b.id}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openBudgetDetails(b)}
                  >
                    <Eye size={12} />
                    <span>Inspect Lines</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="kanban-grid">
            {analytics.map((a) => (
              <div key={a.id} className="kanban-card">
                <div className="kanban-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-md)",
                        backgroundColor: "var(--primary-subtle)",
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <span className="kanban-card-title">{a.name}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                        {a.analytic_type} Account
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={a.is_active ? "active" : "inactive"} />
                </div>

                <div className="kanban-card-footer" style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{a.id}</span>
                  <StatusBadge status={a.analytic_type} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === "budgets" ? (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {budgets.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Budget Name</th>
                      <th>Period (Start - End)</th>
                      <th>Responsible</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>{b.budget_name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {String(b.start_date).slice(0, 10)} to {String(b.end_date).slice(0, 10)}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {b.responsible_user_name || "Admin"}
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openBudgetDetails(b)}
                          >
                            <Eye size={13} />
                            <span>Inspect Lines</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={PieChart}
                title="No budgets configured"
                description="Set up annual or project budgets to track against actual procurement."
              />
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {analytics.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Analytic Account Name</th>
                      <th>Classification Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.name}</td>
                        <td>
                          <StatusBadge status={a.analytic_type} />
                        </td>
                        <td>
                          <StatusBadge status={a.is_active ? "active" : "inactive"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="No analytic accounts found"
                description="Create analytic cost centers (e.g. Showroom Operations, Projects)."
              />
            )}
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Create New Budget"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsBudgetModalOpen(false)}
              disabled={savingBudget}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateBudget}
              disabled={savingBudget || !budgetForm.budget_name.trim()}
            >
              {savingBudget ? "Creating..." : "Save Budget"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateBudget}>
          <div className="form-group">
            <label className="form-label" htmlFor="bName">Budget Name *</label>
            <input
              id="bName"
              type="text"
              className="form-input"
              placeholder="e.g. FY 2026-27 Furniture Budget"
              value={budgetForm.budget_name}
              onChange={(e) => setBudgetForm({ ...budgetForm, budget_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="bStart">Start Date *</label>
              <input
                id="bStart"
                type="date"
                className="form-input"
                value={budgetForm.start_date}
                onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bEnd">End Date *</label>
              <input
                id="bEnd"
                type="date"
                className="form-input"
                value={budgetForm.end_date}
                onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Budget Details & Lines Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Budget: ${selectedBudget?.budget_name || ""}`}
        size="lg"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsDetailsModalOpen(false)}
          >
            Close
          </button>
        }
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Period: <strong>{String(selectedBudget?.start_date).slice(0, 10)}</strong> to <strong>{String(selectedBudget?.end_date).slice(0, 10)}</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setLineForm({
                  analytic_account_id: analytics[0]?.id || "",
                  planned_amount: "100000",
                });
                setIsAddLineModalOpen(true);
              }}
            >
              <PlusCircle size={14} />
              <span>Add Budget Line</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Analytic Account (Department / Marker)</th>
                  <th style={{ textAlign: "right" }}>Planned Amount</th>
                  <th style={{ width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {budgetLines.length > 0 ? (
                  budgetLines.map((line) => (
                    <tr key={line.id}>
                      <td style={{ fontWeight: 600 }}>{line.analytic_account_name}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--primary)" }}>
                        {formatCurrency(line.planned_amount)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteBudgetLine(line.id)}
                          title="Delete line"
                        >
                          <Trash2 size={13} style={{ color: "var(--danger)" }} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      No budget lines added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Add Line Modal */}
      <Modal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        title="Add Analytic Budget Allocation"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddLineModalOpen(false)}
              disabled={savingLine}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddBudgetLine}
              disabled={savingLine || !lineForm.analytic_account_id || lineForm.planned_amount <= 0}
            >
              {savingLine ? "Adding..." : "Add Line"}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddBudgetLine}>
          <div className="form-group">
            <label className="form-label" htmlFor="bAnalytic">Analytic Account *</label>
            <select
              id="bAnalytic"
              className="form-select"
              value={lineForm.analytic_account_id}
              onChange={(e) => setLineForm({ ...lineForm, analytic_account_id: e.target.value })}
              required
            >
              <option value="">Select analytic account...</option>
              {analytics.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.analytic_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bPlanned">Planned Amount (₹) *</label>
            <input
              id="bPlanned"
              type="number"
              step="1000"
              min="1"
              className="form-input"
              value={lineForm.planned_amount}
              onChange={(e) => setLineForm({ ...lineForm, planned_amount: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Create Analytic Account Modal */}
      <Modal
        isOpen={isAnalyticModalOpen}
        onClose={() => setIsAnalyticModalOpen(false)}
        title="Create Analytic Account"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAnalyticModalOpen(false)}
              disabled={savingAnalytic}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateAnalytic}
              disabled={savingAnalytic || !analyticForm.name.trim()}
            >
              {savingAnalytic ? "Saving..." : "Create Account"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateAnalytic}>
          <div className="form-group">
            <label className="form-label" htmlFor="anName">Analytic Account Name *</label>
            <input
              id="anName"
              type="text"
              className="form-input"
              placeholder="e.g. Showroom Operations, Projects, Marketing"
              value={analyticForm.name}
              onChange={(e) => setAnalyticForm({ ...analyticForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="anType">Type *</label>
            <select
              id="anType"
              className="form-select"
              value={analyticForm.analytic_type}
              onChange={(e) => setAnalyticForm({ ...analyticForm, analytic_type: e.target.value })}
            >
              <option value="expense">Expense (Cost Center)</option>
              <option value="income">Income (Revenue Center)</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
