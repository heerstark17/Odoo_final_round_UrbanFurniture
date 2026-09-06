import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { Plus, Edit2, Trash2, Percent } from "lucide-react";

export default function Taxes() {
  const [taxes, setTaxes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    sales_tax_account_id: "",
    purchase_tax_account_id: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [tRes, aRes] = await Promise.all([
        api.get("/taxes"),
        api.get("/chart-of-accounts"),
      ]);
      setTaxes(tRes.data || []);
      setAccounts(aRes.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTax(null);
    setFormData({
      name: "",
      rate: "18.00",
      sales_tax_account_id: accounts.find((a) => a.account_name.includes("Tax Payable"))?.id || accounts[0]?.id || "",
      purchase_tax_account_id: accounts.find((a) => a.account_name.includes("Tax Receivable"))?.id || accounts[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tax) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name || "",
      rate: tax.rate || "",
      sales_tax_account_id: tax.sales_tax_account_id || "",
      purchase_tax_account_id: tax.purchase_tax_account_id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        name: formData.name.trim(),
        rate: parseFloat(formData.rate) || 0,
        sales_tax_account_id: parseInt(formData.sales_tax_account_id),
        purchase_tax_account_id: parseInt(formData.purchase_tax_account_id),
      };

      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, payload);
      } else {
        await api.post("/taxes", payload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Failed to save tax");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete tax rate "${name}"?`)) return;
    try {
      setError("");
      await api.delete(`/taxes/${id}`);
      await fetchData();
    } catch (err) {
      setError(err.userMessage || "Cannot delete tax rate: linked to order lines");
    }
  };

  return (
    <div>
      <PageHeader
        title="Taxes Master"
        description="Configure GST and sales tax rates with mapped sales and purchase ledger accounts"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Tax Rate</span>
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
      </div>


      
      {viewMode === "kanban" ? (
        <div className="kanban-grid">
          {taxes.map((t) => (
            <div key={t.id} className="kanban-card">
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
                    <Percent size={18} />
                  </div>
                  <div>
                    <span className="kanban-card-title">{t.name}</span>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      GST / Tax Rate
                    </div>
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "14px", color: "var(--primary)", background: "var(--primary-subtle)", padding: "3px 8px", borderRadius: "var(--radius-sm)" }}>
                  {Number(t.rate)}%
                </span>
              </div>

              <div className="kanban-card-body" style={{ marginTop: "6px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>SALES TAX ACCOUNT:</span>
                  <span style={{ fontWeight: 500 }}>
                    {t.sales_account_name ? `${t.sales_account_name} (${t.sales_account_code || ""})` : "None"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>PURCHASE TAX ACCOUNT:</span>
                  <span style={{ fontWeight: 500 }}>
                    {t.purchase_account_name ? `${t.purchase_account_name} (${t.purchase_account_code || ""})` : "None"}
                  </span>
                </div>
              </div>

              <div className="kanban-card-footer">
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{t.id}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEditModal(t)}
                    title="Edit Tax Rate"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDelete(t.id, t.name)}
                    title="Delete Tax Rate"
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
          {taxes.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tax Name</th>
                    <th>Rate (%)</th>
                    <th>Sales Tax Account (Liability)</th>
                    <th>Purchase Tax Account (Asset)</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: "var(--primary)",
                            backgroundColor: "var(--primary-subtle)",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          {Number(t.rate).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {t.sales_tax_account_name || t.sales_tax_account_id}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {t.purchase_tax_account_name || t.purchase_tax_account_id}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openEditModal(t)}
                            title="Edit Tax"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDelete(t.id, t.name)}
                            title="Delete Tax"
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
              icon={Percent}
              title="No taxes configured"
              description="Configure sales tax and GST rates for customer invoices and vendor bills."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>Create Tax Rate</span>
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
        title={editingTax ? "Edit Tax Rate" : "Add Tax Rate"}
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
              disabled={saving || !formData.name.trim() || !formData.rate}
            >
              {saving ? "Saving..." : editingTax ? "Update Tax" : "Create Tax"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="taxName">Tax Name *</label>
              <input
                id="taxName"
                type="text"
                className="form-input"
                placeholder="e.g. GST 18%"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="taxRate">Rate (%) *</label>
              <input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="form-input"
                placeholder="18.00"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="salesTaxAccount">Sales Tax Account (Liability - Payable) *</label>
            <select
              id="salesTaxAccount"
              className="form-select"
              value={formData.sales_tax_account_id}
              onChange={(e) => setFormData({ ...formData, sales_tax_account_id: e.target.value })}
              required
            >
              <option value="">Select account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.account_code}) - {a.account_type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="purchaseTaxAccount">Purchase Tax Account (Asset - Receivable) *</label>
            <select
              id="purchaseTaxAccount"
              className="form-select"
              value={formData.purchase_tax_account_id}
              onChange={(e) => setFormData({ ...formData, purchase_tax_account_id: e.target.value })}
              required
            >
              <option value="">Select account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.account_code}) - {a.account_type}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
