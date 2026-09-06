import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import {
  FileText,
  Search,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Calendar,
  User,
  ArrowDownLeft,
  DollarSign,
  PlusCircle,
  FileCheck,
} from "lucide-react";

export default function CustomerInvoices() {
  const { isContact } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // View Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Register Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentNumber: "",
    amount: 0,
    method: "bank",
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/invoices");
      setInvoices(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load customer invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openDetailsModal = async (invoiceId) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);
      setError("");
      setSuccessMsg("");
      const res = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(res.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load invoice details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmInvoice = async () => {
    if (!selectedInvoice) return;
    try {
      setError("");
      await api.put(`/invoices/${selectedInvoice.id}`, {
        invoiceNumber: selectedInvoice.invoice_number,
        customerId: selectedInvoice.customer_id,
        invoiceDate: String(selectedInvoice.invoice_date).slice(0, 10),
        status: "confirmed",
      });
      setSuccessMsg("Invoice confirmed and posted to Accounting General Ledger!");
      const res = await api.get(`/invoices/${selectedInvoice.id}`);
      setSelectedInvoice(res.data);
      await fetchInvoices();
    } catch (err) {
      setError(err.userMessage || "Failed to confirm invoice");
    }
  };

  const openPaymentModal = (inv) => {
    const outstanding = Number(inv.grand_total || 0) - Number(inv.paid_amount || 0);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setPaymentForm({
      paymentNumber: `PAY-REC-${randNum}`,
      amount: outstanding > 0 ? outstanding : 0,
      method: "bank",
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: `Receipt for ${inv.invoice_number}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setSavingPayment(true);
      setError("");
      await api.post("/payments", {
        paymentNumber: paymentForm.paymentNumber.trim(),
        direction: "in",
        customerId: selectedInvoice.customer_id,
        invoiceId: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        paymentDate: paymentForm.paymentDate,
        reference: paymentForm.reference.trim() || null,
        status: "posted",
      });
      setIsPaymentModalOpen(false);
      setSuccessMsg("Payment received and posted to Cash/Bank ledger!");
      const res = await api.get(`/invoices/${selectedInvoice.id}`);
      setSelectedInvoice(res.data);
      await fetchInvoices();
    } catch (err) {
      setError(err.userMessage || "Failed to register payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF invoice");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title={isContact ? "My Invoices" : "Customer Invoices"}
        description="Official billing records with double-entry general ledger posting and payment tracking"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "draft", label: "Draft" },
            { key: "confirmed", label: "Confirmed" },
            { key: "paid", label: "Paid" },
            { key: "cancelled", label: "Cancelled" },
          ].map((col) => {
            const colInvoices = filteredInvoices.filter((inv) => inv.status === col.key);
            const colTotal = colInvoices.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colInvoices.length}</span>
                  </div>
                  <div className="kanban-column-total">{formatCurrency(colTotal)}</div>
                </div>

                <div className="kanban-cards-list">
                  {colInvoices.length > 0 ? (
                    colInvoices.map((inv) => {
                      const due = Number(inv.grand_total || 0) - Number(inv.paid_amount || 0);
                      return (
                        <div
                          key={inv.id}
                          className="kanban-card"
                          onClick={() => openDetailsModal(inv.id)}
                        >
                          <div className="kanban-card-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <FileText size={15} style={{ color: "var(--primary)" }} />
                              <span className="kanban-card-title">{inv.invoice_number}</span>
                            </div>
                            <StatusBadge status={inv.status} />
                          </div>

                          <div className="kanban-card-body">
                            <div className="kanban-card-sub">
                              <User size={13} style={{ color: "var(--text-muted)" }} />
                              <span style={{ fontWeight: 500 }}>{inv.customer_name}</span>
                            </div>
                            <div className="kanban-card-sub">
                              <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                              <span>Date: {String(inv.invoice_date).slice(0, 10)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              <span>Paid: {formatCurrency(inv.paid_amount)}</span>
                              <span style={{ fontWeight: 600, color: due > 0 ? "var(--danger)" : "var(--success)" }}>
                                Due: {formatCurrency(due)}
                              </span>
                            </div>
                          </div>

                          <div className="kanban-card-footer">
                            <div className="kanban-card-amount">
                              {formatCurrency(inv.grand_total)}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                              {!isContact && inv.status === "confirmed" && due > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openPaymentModal(inv)}
                                  title="Register Payment"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                                title="Download PDF"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openDetailsModal(inv.id)}
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="kanban-empty-col">No {col.label.toLowerCase()} invoices</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredInvoices.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => {
                    const outstanding = Number(inv.grand_total || 0) - Number(inv.paid_amount || 0);
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FileText size={15} />
                            <span>{inv.invoice_number}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{inv.customer_name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {String(inv.invoice_date).slice(0, 10)}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {inv.due_date ? String(inv.due_date).slice(0, 10) : "-"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrency(inv.grand_total)}
                        </td>
                        <td style={{ textAlign: "right", color: "var(--success)", fontWeight: 600 }}>
                          {formatCurrency(inv.paid_amount)}
                        </td>
                        <td>
                          <StatusBadge status={inv.status} />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openDetailsModal(inv.id)}
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDownloadPdf(inv.id, inv.invoice_number)}
                              title="Download PDF Invoice"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No customer invoices found"
              description="Convert confirmed sales orders into customer invoices to issue billing."
            />
          )}
        </div>
      </div>
      )}

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Customer Invoice: ${selectedInvoice?.invoice_number || ""}`}
        size="lg"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Status:</span>
              <StatusBadge status={selectedInvoice?.status} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoice_number)}
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>

              {!isContact && selectedInvoice?.status === "draft" && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmInvoice}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm & Post to Ledger</span>
                </button>
              )}

              {selectedInvoice?.status === "confirmed" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPaymentModal(selectedInvoice)}
                >
                  <CreditCard size={15} />
                  <span>Register Payment</span>
                </button>
              )}
            </div>
          </div>
        }
      >
        {loadingDetails ? (
          <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading invoice...</p>
        ) : selectedInvoice ? (
          <div>
            {/* Overview tiles */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                padding: "16px",
                backgroundColor: "var(--bg-subtle)",
                borderRadius: "var(--radius-md)",
                marginBottom: "20px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>CUSTOMER</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{selectedInvoice.customer_name}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>INVOICE DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{String(selectedInvoice.invoice_date).slice(0, 10)}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>DUE DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  {selectedInvoice.due_date ? String(selectedInvoice.due_date).slice(0, 10) : "Immediate"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL AMOUNT</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--primary)" }}>
                  {formatCurrency(selectedInvoice.grand_total)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>PAID AMOUNT</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--success)" }}>
                  {formatCurrency(selectedInvoice.paid_amount)}
                </div>
              </div>
            </div>

            {/* Line items table */}
            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Invoice Breakdown</h4>
            <div className="table-container" style={{ marginBottom: "16px" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                    <th style={{ textAlign: "right" }}>Tax</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.lines?.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.product_name}</td>
                      <td style={{ textAlign: "right" }}>{l.quantity}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(l.unit_price)}</td>
                      <td style={{ textAlign: "right" }}>{formatCurrency(l.line_subtotal)}</td>
                      <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                        {formatCurrency(l.tax_amount)} ({Number(l.tax_rate || 0)}%)
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Tax Total:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedInvoice.tax_total)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "6px",
                    borderTop: "1px solid var(--border-color)",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ color: "var(--primary)" }}>{formatCurrency(selectedInvoice.grand_total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)", fontWeight: 600 }}>
                  <span>Paid:</span>
                  <span>{formatCurrency(selectedInvoice.paid_amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--danger)", fontWeight: 600 }}>
                  <span>Due Balance:</span>
                  <span>{formatCurrency(Number(selectedInvoice.grand_total) - Number(selectedInvoice.paid_amount))}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Register Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Register Customer Payment"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={savingPayment}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRegisterPayment}
              disabled={savingPayment || paymentForm.amount <= 0}
            >
              {savingPayment ? "Recording Payment..." : "Confirm & Post Payment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleRegisterPayment}>
          <div className="alert alert-info">
            Registering receipt for invoice <strong>{selectedInvoice?.invoice_number}</strong>. Outstanding balance:{" "}
            <strong>
              {formatCurrency(
                Number(selectedInvoice?.grand_total || 0) - Number(selectedInvoice?.paid_amount || 0)
              )}
            </strong>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payNum">Payment Number *</label>
              <input
                id="payNum"
                type="text"
                className="form-input font-mono"
                value={paymentForm.paymentNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payDate">Payment Date *</label>
              <input
                id="payDate"
                type="date"
                className="form-input"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="payMethod">Payment Method *</label>
              <select
                id="payMethod"
                className="form-select"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                required
              >
                <option value="bank">Bank Transfer (Bank Journal)</option>
                <option value="cash">Cash (Cash Journal)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payAmount">Amount (₹) *</label>
              <input
                id="payAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={Number(selectedInvoice?.grand_total || 0) - Number(selectedInvoice?.paid_amount || 0)}
                className="form-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payRef">Reference / Note</label>
            <input
              id="payRef"
              type="text"
              className="form-input"
              placeholder="e.g. NEFT / Cheque #12345"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
