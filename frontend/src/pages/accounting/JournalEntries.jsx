import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { BookOpen, Search, Eye, Scale, ArrowRightLeft } from "lucide-react";

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/journal-entries");
      setEntries(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const openDetailsModal = async (entryId) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);
      const res = await api.get(`/journal-entries/${entryId}`);
      setSelectedEntry(res.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load entry details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const isBalanced = selectedEntry && Number(selectedEntry.total_debit) > 0
    && Number(selectedEntry.total_debit) === Number(selectedEntry.total_credit);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.entry_number?.toLowerCase().includes(search.toLowerCase()) ||
      e.reference?.toLowerCase().includes(search.toLowerCase()) ||
      e.journal_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || e.source_type === sourceFilter;
    return matchesSearch && matchesSource;
  });

  return (
    <div>
      <PageHeader
        title="Journal Entries (General Ledger)"
        description="Double-entry accounting records automatically posted from sales, purchases, and payments"
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by entry # or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="invoice">Customer Invoice</option>
            <option value="bill">Vendor Bill</option>
            <option value="payment">Payment</option>
            <option value="manual">Manual Entry</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "draft", label: "Draft Entries" },
            { key: "posted", label: "Posted Entries" },
          ].map((col) => {
            const colEntries = filteredEntries.filter((e) => (e.status || "posted") === col.key);
            const colTotal = colEntries.reduce((sum, e) => sum + Number(e.total_debit || 0), 0);
            return (
              <div key={col.key} className="kanban-column" style={{ minWidth: "340px" }}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colEntries.length}</span>
                  </div>
                  <div className="kanban-column-total">Debit: {formatCurrency(colTotal)}</div>
                </div>

                <div className="kanban-cards-list">
                  {colEntries.length > 0 ? (
                    colEntries.map((e) => (
                      <div
                        key={e.id}
                        className="kanban-card"
                        onClick={() => openDetailsModal(e.id)}
                      >
                        <div className="kanban-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <BookOpen size={15} style={{ color: "var(--primary)" }} />
                            <span className="kanban-card-title">{e.entry_number}</span>
                          </div>
                          <StatusBadge status={e.status || "posted"} />
                        </div>

                        <div className="kanban-card-body">
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ fontWeight: 500 }}>{e.journal_name}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{String(e.accounting_date).slice(0, 10)}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                            <span className="badge badge-draft" style={{ textTransform: "capitalize" }}>{e.source_type}</span>
                            {e.reference && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ref: {e.reference}</span>}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            <span>Debit: <strong>{formatCurrency(e.total_debit)}</strong></span>
                            <span>Credit: <strong>{formatCurrency(e.total_credit)}</strong></span>
                          </div>
                        </div>

                        <div className="kanban-card-footer">
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{e.id}</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDetailsModal(e.id)}
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
                          </button>
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
          {filteredEntries.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Entry #</th>
                    <th>Date</th>
                    <th>Journal</th>
                    <th>Source Type</th>
                    <th>Reference</th>
                    <th style={{ textAlign: "right" }}>Total Debit</th>
                    <th style={{ textAlign: "right" }}>Total Credit</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <BookOpen size={15} />
                          <span>{e.entry_number}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {String(e.accounting_date).slice(0, 10)}
                      </td>
                      <td style={{ fontWeight: 500 }}>{e.journal_name}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            backgroundColor: "var(--bg-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {e.source_type}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{e.reference || "-"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(e.total_debit)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(e.total_credit)}</td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openDetailsModal(e.id)}
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
              icon={BookOpen}
              title="No journal entries found"
              description="Confirm customer invoices, vendor bills, or payments to generate balanced double-entry accounting records."
            />
          )}
        </div>
      </div>
      )}

      {/* Inspect Journal Entry Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Journal Entry: ${selectedEntry?.entry_number || ""}`}
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
        {loadingDetails ? (
          <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading ledger lines...</p>
        ) : selectedEntry ? (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "12px",
                padding: "16px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>JOURNAL</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{selectedEntry.journal_name}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>ACCOUNTING DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{String(selectedEntry.accounting_date).slice(0, 10)}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>SOURCE</span>
                <div style={{ fontWeight: 600, fontSize: "14px", textTransform: "capitalize" }}>
                  {selectedEntry.source_type} #{selectedEntry.source_id || ""}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>REFERENCE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{selectedEntry.reference || "-"}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Scale size={18} style={{ color: "var(--primary)" }} />
              <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Balanced Double-Entry Lines</h4>
            </div>

            <div className="table-container" style={{ marginBottom: "16px" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Ledger Account</th>
                    <th>Partner</th>
                    <th>Analytic Tag</th>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Debit (₹)</th>
                    <th style={{ textAlign: "right" }}>Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEntry.lines?.map((line) => (
                    <tr key={line.id}>
                      <td style={{ fontWeight: 600 }}>
                        {line.account_name} ({line.account_code})
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{line.partner_name || "-"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{line.analytic_account_name || "-"}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{line.description || "-"}</td>
                      <td style={{ textAlign: "right", fontWeight: Number(line.debit) > 0 ? 600 : 400 }}>
                        {Number(line.debit) > 0 ? formatCurrency(line.debit) : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: Number(line.credit) > 0 ? 600 : 400 }}>
                        {Number(line.credit) > 0 ? formatCurrency(line.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: "var(--bg-subtle)", fontWeight: 700 }}>
                    <td colSpan={4}>Total</td>
                    <td style={{ textAlign: "right", color: "var(--primary)" }}>
                      {formatCurrency(
                        selectedEntry.lines?.reduce((sum, l) => sum + Number(l.debit || 0), 0)
                      )}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--primary)" }}>
                      {formatCurrency(
                        selectedEntry.lines?.reduce((sum, l) => sum + Number(l.credit || 0), 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                backgroundColor: isBalanced ? "var(--success-subtle)" : "var(--danger-subtle)",
                borderRadius: "var(--radius-md)",
                color: isBalanced ? "var(--success-text)" : "var(--danger-text)",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <ArrowRightLeft size={16} />
              <span>
                {isBalanced
                  ? "Balanced Double Entry Verified: Total Debits equal Total Credits."
                  : "Unbalanced Entry: Total Debits must equal Total Credits before posting."}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
