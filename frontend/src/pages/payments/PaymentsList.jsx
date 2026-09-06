import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import {
  CreditCard,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Building,
  Plus,
} from "lucide-react";

export default function PaymentsList() {
  const { isContact } = useAuth();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Create payment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState("in"); // "in" = Customer, "out" = Vendor
  const [formData, setFormData] = useState({
    paymentNumber: "",
    invoiceId: "",
    billId: "",
    amount: "",
    method: "bank",
    paymentDate: new Date().toISOString().slice(0, 10),
    reference: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/payments");
      setPayments(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnpaidDocuments = async () => {
    try {
      const [invRes, billRes] = await Promise.all([
        api.get("/invoices").catch(() => ({ data: [] })),
        api.get("/vendor-bills").catch(() => ({ data: [] })),
      ]);
      setInvoices(
        (invRes.data || []).filter(
          (i) => i.status === "confirmed" && Number(i.grand_total) > Number(i.paid_amount)
        )
      );
      setBills(
        (billRes.data || []).filter(
          (b) => b.status === "confirmed" && Number(b.grand_total) > Number(b.paid_amount)
        )
      );
    } catch (err) {
      console.error("Failed to load unpaid documents:", err);
    }
  };

  useEffect(() => {
    fetchPayments();
    if (!isContact) fetchUnpaidDocuments();
  }, [isContact]);

  const openCreateModal = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setPaymentType("in");
    setFormData({
      paymentNumber: `PAY-${randNum}`,
      invoiceId: invoices[0]?.id || "",
      billId: bills[0]?.id || "",
      amount: invoices[0] ? Number(invoices[0].grand_total) - Number(invoices[0].paid_amount) : 0,
      method: "bank",
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: "",
    });
    setIsModalOpen(true);
  };

  const handleInvoiceSelect = (invId) => {
    const inv = invoices.find((i) => String(i.id) === String(invId));
    setFormData({
      ...formData,
      invoiceId: invId,
      amount: inv ? Number(inv.grand_total) - Number(inv.paid_amount) : 0,
    });
  };

  const handleBillSelect = (bId) => {
    const b = bills.find((item) => String(item.id) === String(bId));
    setFormData({
      ...formData,
      billId: bId,
      amount: b ? Number(b.grand_total) - Number(b.paid_amount) : 0,
    });
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        paymentNumber: formData.paymentNumber.trim(),
        direction: paymentType,
        amount: parseFloat(formData.amount),
        method: formData.method,
        paymentDate: formData.paymentDate,
        reference: formData.reference.trim() || null,
        status: "posted",
      };

      if (paymentType === "in") {
        const inv = invoices.find((i) => String(i.id) === String(formData.invoiceId));
        if (!inv) throw new Error("Please select an outstanding customer invoice");
        payload.invoiceId = parseInt(formData.invoiceId);
        payload.customerId = inv.customer_id;
      } else {
        const bill = bills.find((b) => String(b.id) === String(formData.billId));
        if (!bill) throw new Error("Please select an outstanding vendor bill");
        payload.billId = parseInt(formData.billId);
        payload.vendorId = bill.vendor_id;
      }

      await api.post("/payments", payload);
      setIsModalOpen(false);
      await fetchPayments();
      if (!isContact) await fetchUnpaidDocuments();
    } catch (err) {
      setError(err.userMessage || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase());
    const matchesDirection = directionFilter === "all" || p.direction === directionFilter;
    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    return matchesSearch && matchesDirection && matchesMethod;
  });

  return (
    <div>
      <PageHeader
        title={isContact ? "My Payments" : "Payments & Receipts"}
        description="Cash and bank transactions recorded against customer invoices and vendor bills"
        actions={
          !isContact && (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Record Payment</span>
            </button>
          )
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by payment # or party..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
          >
            <option value="all">All Directions</option>
            <option value="in">Inflow (Customer Receipts)</option>
            <option value="out">Outflow (Vendor Payments)</option>
          </select>

          <select
            className="form-select"
            style={{ width: "auto" }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "in", label: "Customer Receipts (Inbound)", icon: ArrowDownLeft, color: "var(--success)" },
            { key: "out", label: "Vendor Payments (Outbound)", icon: ArrowUpRight, color: "var(--info)" },
          ].map((col) => {
            const colPayments = filteredPayments.filter((p) => p.direction === col.key);
            const colTotal = colPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const ColIcon = col.icon;
            return (
              <div key={col.key} className="kanban-column" style={{ minWidth: "340px" }}>
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <ColIcon size={16} style={{ color: col.color }} />
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colPayments.length}</span>
                  </div>
                  <div className="kanban-column-total">{formatCurrency(colTotal)}</div>
                </div>

                <div className="kanban-cards-list">
                  {colPayments.length > 0 ? (
                    colPayments.map((p) => (
                      <div key={p.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <CreditCard size={15} style={{ color: col.color }} />
                            <span className="kanban-card-title">{p.payment_number}</span>
                          </div>
                          <span className={`badge ${p.direction === "in" ? "badge-paid" : "badge-customer"}`}>
                            {p.direction === "in" ? "Customer Receipt" : "Vendor Payment"}
                          </span>
                        </div>

                        <div className="kanban-card-body">
                          <div className="kanban-card-sub">
                            <Building size={13} style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontWeight: 500 }}>{p.partner_name || "Self"}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)" }}>
                            <span>Date: {String(p.payment_date).slice(0, 10)}</span>
                            <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{p.payment_method}</span>
                          </div>
                          {(p.invoice_number || p.bill_number || p.reference) && (
                            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {p.invoice_number && <span>Linked: <strong>{p.invoice_number}</strong> </span>}
                              {p.bill_number && <span>Linked: <strong>{p.bill_number}</strong> </span>}
                              {p.reference && <span>Ref: {p.reference}</span>}
                            </div>
                          )}
                        </div>

                        <div className="kanban-card-footer">
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{p.id}</span>
                          <span
                            className="kanban-card-amount"
                            style={{ color: p.direction === "in" ? "var(--success)" : "var(--info)" }}
                          >
                            {p.direction === "in" ? "+" : "-"}{formatCurrency(p.amount)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="kanban-empty-col">No payments recorded</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredPayments.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment #</th>
                    <th>Date</th>
                    <th>Direction</th>
                    <th>Party (Customer / Vendor)</th>
                    <th>Linked Document</th>
                    <th>Method</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const isIn = p.direction === "in";
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <CreditCard size={15} />
                            <span>{p.payment_number}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>
                          {String(p.payment_date).slice(0, 10)}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: isIn ? "var(--success)" : "var(--danger)",
                            }}
                          >
                            {isIn ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            {isIn ? "Customer Inflow" : "Vendor Outflow"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {isIn ? p.customer_name : p.vendor_name}
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                            {isIn ? p.invoice_number || `Invoice #${p.invoice_id}` : p.bill_number || `Bill #${p.bill_id}`}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              textTransform: "capitalize",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {p.method === "bank" ? <Building size={13} /> : <Wallet size={13} />}
                            {p.method}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: isIn ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {isIn ? "+" : "-"} {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payments recorded"
              description="Register payments on confirmed customer invoices or vendor bills."
            />
          )}
        </div>
      </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
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
              onClick={handleSavePayment}
              disabled={saving || !formData.paymentNumber.trim() || formData.amount <= 0}
            >
              {saving ? "Posting..." : "Confirm & Post Payment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSavePayment}>
          <div className="tabs-nav" style={{ marginBottom: "16px" }}>
            <button
              type="button"
              className={`tab-button ${paymentType === "in" ? "active" : ""}`}
              onClick={() => setPaymentType("in")}
            >
              Receive from Customer (Inflow)
            </button>
            <button
              type="button"
              className={`tab-button ${paymentType === "out" ? "active" : ""}`}
              onClick={() => setPaymentType("out")}
            >
              Pay to Vendor (Outflow)
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="recPayNum">Payment # *</label>
              <input
                id="recPayNum"
                type="text"
                className="form-input font-mono"
                value={formData.paymentNumber}
                onChange={(e) => setFormData({ ...formData, paymentNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="recPayDate">Payment Date *</label>
              <input
                id="recPayDate"
                type="date"
                className="form-input"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          {paymentType === "in" ? (
            <div className="form-group">
              <label className="form-label" htmlFor="recInvoice">Select Confirmed Customer Invoice *</label>
              <select
                id="recInvoice"
                className="form-select"
                value={formData.invoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                required
              >
                <option value="">Select invoice...</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number} - {i.customer_name} (Due: {formatCurrency(Number(i.grand_total) - Number(i.paid_amount))})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="recBill">Select Confirmed Vendor Bill *</label>
              <select
                id="recBill"
                className="form-select"
                value={formData.billId}
                onChange={(e) => handleBillSelect(e.target.value)}
                required
              >
                <option value="">Select vendor bill...</option>
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bill_number} - {b.vendor_name} (Due: {formatCurrency(Number(b.grand_total) - Number(b.paid_amount))})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="recMethod">Payment Method *</label>
              <select
                id="recMethod"
                className="form-select"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                required
              >
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="recAmount">Amount (₹) *</label>
              <input
                id="recAmount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="recRef">Reference</label>
            <input
              id="recRef"
              type="text"
              className="form-input"
              placeholder="e.g. Transaction ID or Bank Ref"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
