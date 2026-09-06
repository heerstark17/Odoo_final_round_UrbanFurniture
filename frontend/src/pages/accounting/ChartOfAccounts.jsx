import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { Plus, Search, Edit2, Trash2, ListOrdered, FolderTree } from "lucide-react";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "asset",
    account_subtype: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/chart-of-accounts");
      setAccounts(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load Chart of Accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "asset",
      account_subtype: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setFormData({
      account_code: acc.account_code || "",
      account_name: acc.account_name || "",
      account_type: acc.account_type || "asset",
      account_subtype: acc.account_subtype || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        account_code: formData.account_code.trim() || null,
        account_name: formData.account_name.trim(),
        account_type: formData.account_type,
        account_subtype: formData.account_subtype.trim() || null,
      };

      if (editingAccount) {
        await api.put(`/chart-of-accounts/${editingAccount.id}`, payload);
      } else {
        await api.post("/chart-of-accounts", payload);
      }
      setIsModalOpen(false);
      await fetchAccounts();
    } catch (err) {
      setError(err.userMessage || "Failed to save ledger account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ledger account "${name}"?`)) return;
    try {
      setError("");
      await api.delete(`/chart-of-accounts/${id}`);
      await fetchAccounts();
    } catch (err) {
      setError(err.userMessage || "Cannot delete account: linked to journals, taxes, or entries");
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.account_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.account_code?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.account_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <PageHeader
        title="Chart of Accounts Master"
        description="Master list of all ledger accounts used to classify every financial transaction"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="asset">Assets (Cash, Bank, Debtors)</option>
            <option value="liability">Liabilities (Creditors, Taxes)</option>
            <option value="income">Income (Sales Income)</option>
            <option value="expense">Expenses (Purchases, Operating)</option>
            <option value="capital">Capital (Equity, Retained Earnings)</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "asset", label: "Assets" },
            { key: "liability", label: "Liabilities" },
            { key: "capital", label: "Capital / Equity" },
            { key: "income", label: "Income" },
            { key: "expense", label: "Expenses" },
          ].map((col) => {
            const colAccounts = filteredAccounts.filter((a) => a.account_type === col.key || (col.key === "capital" && a.account_type === "equity"));
            return (
              <div key={col.key} className="kanban-column" style={{ minWidth: "260px" }}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colAccounts.length}</span>
                  </div>
                </div>

                <div className="kanban-cards-list">
                  {colAccounts.length > 0 ? (
                    colAccounts.map((acc) => (
                      <div key={acc.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary)", fontSize: "12px", background: "var(--primary-subtle)", padding: "2px 6px", borderRadius: "4px" }}>
                            {acc.account_code || "N/A"}
                          </span>
                          <StatusBadge status={acc.account_type} />
                        </div>

                        <div className="kanban-card-body" style={{ marginTop: "4px" }}>
                          <span className="kanban-card-title">{acc.account_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                            {acc.account_subtype || "Standard account"}
                          </span>
                        </div>

                        <div className="kanban-card-footer">
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{acc.id}</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(acc)}
                              title="Edit Account"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDelete(acc.id, acc.account_name)}
                              title="Delete Account"
                            >
                              <Trash2 size={12} style={{ color: "var(--danger)" }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="kanban-empty-col">No {col.label.toLowerCase()}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredAccounts.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>Code</th>
                    <th>Account Name</th>
                    <th>Classification Type</th>
                    <th>Subtype</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--primary)" }}>
                        {acc.account_code || "-"}
                      </td>
                      <td style={{ fontWeight: 600 }}>{acc.account_name}</td>
                      <td>
                        <StatusBadge status={acc.account_type} />
                      </td>
                      <td style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>
                        {acc.account_subtype || "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openEditModal(acc)}
                            title="Edit Account"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDelete(acc.id, acc.account_name)}
                            title="Delete Account"
                          >
                            <Trash2 size={14} style={{ color: "var(--danger)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={ListOrdered}
              title="No ledger accounts found"
              description="Configure your chart of accounts for double-entry bookkeeping."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>Create Account</span>
                </button>
              }
            />
          )}
        </div>
      </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? "Edit Ledger Account" : "Add Ledger Account"}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !formData.account_name.trim()}
            >
              {saving ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="accCode">Account Code</label>
              <input
                id="accCode"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. 1000, 4000"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accType">Account Type *</label>
              <select
                id="accType"
                className="form-select"
                value={formData.account_type}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="capital">Capital</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="accName">Account Name *</label>
            <input
              id="accName"
              type="text"
              className="form-input"
              placeholder="e.g. Cash, Accounts Receivable, Sales Income"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="accSubtype">Subtype (Optional)</label>
            <input
              id="accSubtype"
              type="text"
              className="form-input"
              placeholder="e.g. cash, bank, receivable, payable"
              value={formData.account_subtype}
              onChange={(e) => setFormData({ ...formData, account_subtype: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
