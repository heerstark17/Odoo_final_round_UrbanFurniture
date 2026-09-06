import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import {
  Receipt,
  Search,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  Calendar,
  User,
  ArrowUpRight,
  DollarSign,
  PlusCircle,
} from "lucide-react";

export default function VendorBills() {
  const { isContact } = useAuth();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // View Details Modal
  const [selectedBill, setSelectedBill] = useState(null);
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

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/vendor-bills");
      setBills(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load vendor bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openDetailsModal = async (billId) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);
      setError("");
      setSuccessMsg("");
      const res = await api.get(`/vendor-bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load vendor bill details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmBill = async () => {
    if (!selectedBill) return;
    try {
      setError("");
      await api.put(`/vendor-bills/${selectedBill.id}`, {
        billNumber: selectedBill.bill_number,
        vendorId: selectedBill.vendor_id,
        billDate: String(selectedBill.bill_date).slice(0, 10),
        status: "confirmed",
      });
      setSuccessMsg("Vendor bill confirmed and recorded to Accounting General Ledger!");
      const res = await api.get(`/vendor-bills/${selectedBill.id}`);
      setSelectedBill(res.data);
      await fetchBills();
    } catch (err) {
      setError(err.userMessage || "Failed to confirm vendor bill");
    }
  };

  const openPaymentModal = (bill) => {
    const outstanding = Number(bill.grand_total || 0) - Number(bill.paid_amount || 0);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setPaymentForm({
      paymentNumber: `PAY-OUT-${randNum}`,
      amount: outstanding > 0 ? outstanding : 0,
      method: "bank",
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: `Payment for ${bill.bill_number}`,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;
    try {
      setSavingPayment(true);
      setError("");
      await api.post("/payments", {
        paymentNumber: paymentForm.paymentNumber.trim(),
        direction: "out",
        vendorId: selectedBill.vendor_id,
        billId: selectedBill.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        paymentDate: paymentForm.paymentDate,
        reference: paymentForm.reference.trim() || null,
        status: "posted",
      });
      setIsPaymentModalOpen(false);
      setSuccessMsg("Payment recorded to Bank/Cash ledger and Accounts Payable updated!");
      const res = await api.get(`/vendor-bills/${selectedBill.id}`);
      setSelectedBill(res.data);
      await fetchBills();
    } catch (err) {
      setError(err.userMessage || "Failed to register payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDownloadPdf = async (billId, billNumber) => {
    try {
      const response = await api.get(`/vendor-bills/${billId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${billNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF bill");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title={isContact ? "My Vendor Bills" : "Vendor Bills"}
        description="Accounts Payable documents, payment disbursement, and double-entry ledger tracking"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search bill # or vendor..."
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
            const colBills = filteredBills.filter((bill) => bill.status === col.key);
            const colTotal = colBills.reduce((sum, bill) => sum + Number(bill.grand_total || 0), 0);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colBills.length}</span>
                  </div>
                  <div className="kanban-column-total">{formatCurrency(colTotal)}</div>
                </div>

                <div className="kanban-cards-list">
                  {colBills.length > 0 ? (
                    colBills.map((bill) => {
                      const due = Number(bill.grand_total || 0) - Number(bill.paid_amount || 0);
                      return (
                        <div
                          key={bill.id}
                          className="kanban-card"
                          onClick={() => openDetailsModal(bill.id)}
                        >
                          <div className="kanban-card-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Receipt size={15} style={{ color: "var(--primary)" }} />
                              <span className="kanban-card-title">{bill.bill_number}</span>
                            </div>
                            <StatusBadge status={bill.status} />
                          </div>

                          <div className="kanban-card-body">
                            <div className="kanban-card-sub">
                              <User size={13} style={{ color: "var(--text-muted)" }} />
                              <span style={{ fontWeight: 500 }}>{bill.vendor_name}</span>
                            </div>
                            <div className="kanban-card-sub">
                              <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                              <span>Bill Date: {String(bill.bill_date).slice(0, 10)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              <span>Paid: {formatCurrency(bill.paid_amount)}</span>
                              <span style={{ fontWeight: 600, color: due > 0 ? "var(--danger)" : "var(--success)" }}>
                                Due: {formatCurrency(due)}
                              </span>
                            </div>
                          </div>

                          <div className="kanban-card-footer">
                            <div className="kanban-card-amount">
                              {formatCurrency(bill.grand_total)}
                            </div>
                            <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                              {!isContact && bill.status === "confirmed" && due > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openPaymentModal(bill)}
                                  title="Register Payment"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDownloadPdf(bill.id, bill.bill_number)}
                                title="Download PDF"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openDetailsModal(bill.id)}
                              >
                                <Eye size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="kanban-empty-col">No {col.label.toLowerCase()} bills</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredBills.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "right" }}>Paid</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Receipt size={15} />
                          <span>{b.bill_number}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{b.vendor_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {String(b.bill_date).slice(0, 10)}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {b.due_date ? String(b.due_date).slice(0, 10) : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(b.grand_total)}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--success)", fontWeight: 600 }}>
                        {formatCurrency(b.paid_amount)}
                      </td>
                      <td>
                        <StatusBadge status={b.status} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDetailsModal(b.id)}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadPdf(b.id, b.bill_number)}
                            title="Download PDF Bill"
                          >
                            <Download size={13} />
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
              icon={Receipt}
              title="No vendor bills found"
              description="Convert confirmed purchase orders to vendor bills to track payables."
            />
          )}
        </div>
      </div>
      )}

      {/* Bill Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Vendor Bill: ${selectedBill?.bill_number || ""}`}
        size="lg"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Status:</span>
              <StatusBadge status={selectedBill?.status} />
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
                onClick={() => handleDownloadPdf(selectedBill.id, selectedBill.bill_number)}
              >
                <Download size={15} />
                <span>Download PDF</span>
              </button>

              {!isContact && selectedBill?.status === "draft" && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleConfirmBill}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm & Post to Ledger</span>
                </button>
              )}

              {selectedBill?.status === "confirmed" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPaymentModal(selectedBill)}
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
          <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading bill...</p>
        ) : selectedBill ? (
          <div>
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
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>VENDOR</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{selectedBill.vendor_name}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>BILL DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{String(selectedBill.bill_date).slice(0, 10)}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>DUE DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>
                  {selectedBill.due_date ? String(selectedBill.due_date).slice(0, 10) : "Immediate"}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL AMOUNT</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--primary)" }}>
                  {formatCurrency(selectedBill.grand_total)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>PAID AMOUNT</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--success)" }}>
                  {formatCurrency(selectedBill.paid_amount)}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px" }}>Line Items Breakdown</h4>
            <div className="table-container" style={{ marginBottom: "16px" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Cost</th>
                    <th style={{ textAlign: "right" }}>Subtotal</th>
                    <th style={{ textAlign: "right" }}>Tax</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.lines?.map((l) => (
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

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Tax Total:</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(selectedBill.tax_total)}</span>
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
                  <span style={{ color: "var(--primary)" }}>{formatCurrency(selectedBill.grand_total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)", fontWeight: 600 }}>
                  <span>Paid:</span>
                  <span>{formatCurrency(selectedBill.paid_amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--danger)", fontWeight: 600 }}>
                  <span>Due Payable:</span>
                  <span>{formatCurrency(Number(selectedBill.grand_total) - Number(selectedBill.paid_amount))}</span>
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
        title="Register Vendor Payment"
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
            Registering disbursement for vendor bill <strong>{selectedBill?.bill_number}</strong>. Outstanding dues:{" "}
            <strong>
              {formatCurrency(
                Number(selectedBill?.grand_total || 0) - Number(selectedBill?.paid_amount || 0)
              )}
            </strong>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="billPayNum">Payment Number *</label>
              <input
                id="billPayNum"
                type="text"
                className="form-input font-mono"
                value={paymentForm.paymentNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="billPayDate">Payment Date *</label>
              <input
                id="billPayDate"
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
              <label className="form-label" htmlFor="billPayMethod">Payment Method *</label>
              <select
                id="billPayMethod"
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
              <label className="form-label" htmlFor="billPayAmount">Amount (₹) *</label>
              <input
                id="billPayAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={Number(selectedBill?.grand_total || 0) - Number(selectedBill?.paid_amount || 0)}
                className="form-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="billPayRef">Reference / Note</label>
            <input
              id="billPayRef"
              type="text"
              className="form-input"
              placeholder="e.g. Bank Ref #99283 or Voucher"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
