import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { Plus, Edit2, Trash2, BookMarked } from "lucide-react";

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [formData, setFormData] = useState({
    journal_name: "",
    journal_type: "sales",
    default_account_id: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [jRes, aRes] = await Promise.all([
        api.get("/journals"),
        api.get("/chart-of-accounts"),
      ]);
      setJournals(jRes.data || []);
      setAccounts(aRes.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load journals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingJournal(null);
    setFormData({
      journal_name: "",
      journal_type: "sales",
      default_account_id: accounts[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (journal) => {
    setEditingJournal(journal);
    setFormData({
      journal_name: journal.journal_name || "",
      journal_type: journal.journal_type || "sales",
      default_account_id: journal.default_account_id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        journal_name: formData.journal_name.trim(),
        journal_type: formData.journal_type,
        default_account_id: parseInt(formData.default_account_id),
      };

      if (editingJournal) {
        await api.put(`/journals/${editingJournal.id}`, payload);
      } else {
        await api.post("/journals", payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Failed to save journal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete journal "${name}"?`)) return;
    try {
      setError("");
      await api.delete(`/journals/${id}`);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Cannot delete journal: contains journal entries");
    }
  };

  return (
    <div>
      <PageHeader
        title="Journals Master"
        description="Records and books used to group and organize transactions (Sales, Purchases, Bank, Cash)"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Journal</span>
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
      </div>


      
      {viewMode === "kanban" ? (
        <div className="kanban-grid">
          {journals.map((j) => (
            <div key={j.id} className="kanban-card">
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
                    <BookMarked size={18} />
                  </div>
                  <div>
                    <span className="kanban-card-title">{j.journal_name}</span>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {j.journal_type} Journal
                    </div>
                  </div>
                </div>
                <StatusBadge status={j.journal_type} />
              </div>

              <div className="kanban-card-body" style={{ marginTop: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>DEFAULT ACCOUNT:</span>
                <span style={{ fontWeight: 500 }}>
                  {j.default_account_name ? `${j.default_account_name} (${j.default_account_code || ""})` : j.default_account_id || "None"}
                </span>
              </div>

              <div className="kanban-card-footer">
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{j.id}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(j)}
                    title="Edit Journal"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDelete(j.id, j.journal_name)}
                    title="Delete Journal"
                  >
                    <Trash2 size={12} style={{ color: "var(--danger)" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {journals.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Journal Name</th>
                    <th>Type</th>
                    <th>Default Ledger Account</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {journals.map((j) => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: 600 }}>{j.journal_name}</td>
                      <td>
                        <StatusBadge status={j.journal_type} />
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {j.default_account_name
                          ? `${j.default_account_name} (${j.default_account_code || ""})`
                          : j.default_account_id}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openEditModal(j)}
                            title="Edit Journal"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDelete(j.id, j.journal_name)}
                            title="Delete Journal"
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
              icon={BookMarked}
              title="No journals configured"
              description="Configure sales, purchase, bank, and cash journals."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>Create Journal</span>
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
        title={editingJournal ? "Edit Journal" : "Add New Journal"}
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
              disabled={saving || !formData.journal_name.trim() || !formData.default_account_id}
            >
              {saving ? "Saving..." : editingJournal ? "Update Journal" : "Create Journal"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="jName">Journal Name *</label>
            <input
              id="jName"
              type="text"
              className="form-input"
              placeholder="e.g. Sales Journal or Bank Journal"
              value={formData.journal_name}
              onChange={(e) => setFormData({ ...formData, journal_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="jType">Type *</label>
              <select
                id="jType"
                className="form-select"
                value={formData.journal_type}
                onChange={(e) => setFormData({ ...formData, journal_type: e.target.value })}
              >
                <option value="sales">Sales (Customer Invoices)</option>
                <option value="purchase">Purchase (Vendor Bills)</option>
                <option value="bank">Bank (Bank Receipts/Transfers)</option>
                <option value="cash">Cash (Cash Drawer)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="jAccount">Default Account *</label>
              <select
                id="jAccount"
                className="form-select"
                value={formData.default_account_id}
                onChange={(e) => setFormData({ ...formData, default_account_id: e.target.value })}
                required
              >
                <option value="">Select ledger account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.account_code}) - {a.account_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
