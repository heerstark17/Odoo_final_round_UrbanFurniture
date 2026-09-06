import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import {
  UserCheck,
  ShoppingBag,
  Plus,
  FileText,
  Receipt,
  CreditCard,
  Download,
  DollarSign,
  AlertCircle,
  Building,
} from "lucide-react";

export default function ContactPortal() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [activeTab, setActiveTab] = useState("invoices");

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingDoc, setPayingDoc] = useState(null); // invoice or bill
  const [docType, setDocType] = useState("invoice"); // "invoice" | "bill"
  const [payForm, setPayForm] = useState({
    amount: 0,
    method: "bank",
    reference: "",
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setError("");
      const [invRes, billRes, payRes, poRes] = await Promise.all([
        api.get("/invoices").catch(() => ({ data: [] })),
        api.get("/vendor-bills").catch(() => ({ data: [] })),
        api.get("/payments").catch(() => ({ data: [] })),
        api.get("/purchase-orders").catch(() => ({ data: [] })),
      ]);
      setInvoices(invRes.data || []);
      setBills(billRes.data || []);
      setPayments(payRes.data || []);
      setOrders(poRes.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load portal data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const openPaymentModal = (doc, type) => {
    setPayingDoc(doc);
    setDocType(type);
    const outstanding = Number(doc.grand_total || 0) - Number(doc.paid_amount || 0);
    setPayForm({
      amount: outstanding > 0 ? outstanding : 0,
      method: "bank",
      reference: `Portal payment for ${type === "invoice" ? doc.invoice_number : doc.bill_number}`,
    });
    setIsPayModalOpen(true);
  };

  const handleMakePayment = async (e) => {
    e.preventDefault();
    if (!payingDoc) return;
    try {
      setSavingPayment(true);
      setError("");
      const randNum = Math.floor(1000 + Math.random() * 9000);

      const payload = {
        paymentNumber: `PAY-PORTAL-${randNum}`,
        paymentDate: new Date().toISOString().slice(0, 10),
        method: payForm.method,
        amount: parseFloat(payForm.amount),
        reference: payForm.reference.trim() || null,
        status: "posted",
      };

      if (docType === "invoice") {
        payload.direction = "in";
        payload.customerId = payingDoc.customer_id;
        payload.invoiceId = payingDoc.id;
      } else {
        payload.direction = "out";
        payload.vendorId = payingDoc.vendor_id;
        payload.billId = payingDoc.id;
      }

      await api.post("/payments", payload);
      setIsPayModalOpen(false);
      setSuccessMsg("Payment successful! Receipt updated.");
      await fetchPortalData();
    } catch (err) {
      setError(err.userMessage || "Payment processing failed");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDownloadPdf = async (id, number, type) => {
    try {
      const endpoint = type === "invoice" ? `/invoices/${id}/pdf` : `/vendor-bills/${id}/pdf`;
      const response = await api.get(endpoint, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF document");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const totalInvoiceDue = invoices.reduce(
    (sum, i) => sum + Math.max(0, Number(i.grand_total) - Number(i.paid_amount)),
    0
  );

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.full_name || "Partner"}`}
        description="Self-service portal to view your invoices, bills, download receipts, and settle dues"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="stats-grid">
        <StatCard
          label="Total Invoices Issued"
          value={invoices.length}
          icon={FileText}
          color="primary"
          isCurrency={false}
          subtext="Customer billing documents"
        />
        <StatCard
          label="Outstanding Payable Due"
          value={totalInvoiceDue}
          icon={AlertCircle}
          color={totalInvoiceDue > 0 ? "danger" : "success"}
          subtext="Due balance to be settled"
        />
        <StatCard
          label="Total Paid To Date"
          value={totalPaid}
          icon={DollarSign}
          color="success"
          subtext="Settled through Bank/Cash"
        />
        <StatCard
          label="Vendor Bills"
          value={bills.length}
          icon={Receipt}
          color="info"
          isCurrency={false}
          subtext="Purchases & supplies billed"
        />
      </div>

      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-button ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          My Purchase Orders ({orders.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          My Invoices ({invoices.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "bills" ? "active" : ""}`}
          onClick={() => setActiveTab("bills")}
        >
          My Vendor Bills ({bills.length})
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
        >
          My Payment History ({payments.length})
        </button>
      </div>

      
      {/* Purchase Orders Tab */}
      {activeTab === "orders" && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="card-title">My Purchase Orders</h3>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/purchase-orders")}
            >
              <Plus size={14} />
              <span>New Purchase Order</span>
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {orders.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th style={{ textAlign: "right" }}>Total Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShoppingBag size={15} />
                            <span>{o.po_number}</span>
                          </div>
                        </td>
                        <td>{String(o.order_date).slice(0, 10)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>
                          {formatCurrency(o.total_amount)}
                        </td>
                        <td>
                          <StatusBadge status={o.status} />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate("/purchase-orders")}
                          >
                            <span>Manage Items</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No purchase orders found"
                description="You have not placed any furniture purchase orders yet."
                action={
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/purchase-orders")}
                  >
                    <Plus size={14} />
                    <span>Place Purchase Order</span>
                  </button>
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {invoices.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "right" }}>Paid</th>
                      <th style={{ textAlign: "right" }}>Balance Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const due = Number(inv.grand_total) - Number(inv.paid_amount);
                      return (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 600, color: "var(--primary)" }}>{inv.invoice_number}</td>
                          <td>{String(inv.invoice_date).slice(0, 10)}</td>
                          <td>{inv.due_date ? String(inv.due_date).slice(0, 10) : "Immediate"}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(inv.grand_total)}</td>
                          <td style={{ textAlign: "right", color: "var(--success)" }}>{formatCurrency(inv.paid_amount)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: due > 0 ? "var(--danger)" : "var(--success)" }}>
                            {formatCurrency(due)}
                          </td>
                          <td>
                            <StatusBadge status={inv.status} />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleDownloadPdf(inv.id, inv.invoice_number, "invoice")}
                                title="Download PDF"
                              >
                                <Download size={13} />
                              </button>
                              {inv.status === "confirmed" && due > 0 && (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => openPaymentModal(inv, "invoice")}
                                >
                                  <CreditCard size={13} />
                                  <span>Pay Now</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={FileText} title="No invoices found" description="You have no customer invoices on file." />
            )}
          </div>
        </div>
      )}

      {/* Vendor Bills Tab */}
      {activeTab === "bills" && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {bills.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Bill #</th>
                      <th>Date</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th style={{ textAlign: "right" }}>Paid</th>
                      <th style={{ textAlign: "right" }}>Balance Due</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => {
                      const due = Number(b.grand_total) - Number(b.paid_amount);
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600, color: "var(--primary)" }}>{b.bill_number}</td>
                          <td>{String(b.bill_date).slice(0, 10)}</td>
                          <td>{b.due_date ? String(b.due_date).slice(0, 10) : "Immediate"}</td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(b.grand_total)}</td>
                          <td style={{ textAlign: "right", color: "var(--success)" }}>{formatCurrency(b.paid_amount)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: due > 0 ? "var(--danger)" : "var(--success)" }}>
                            {formatCurrency(due)}
                          </td>
                          <td>
                            <StatusBadge status={b.status} />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDownloadPdf(b.id, b.bill_number, "bill")}
                              title="Download PDF"
                            >
                              <Download size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Receipt} title="No vendor bills found" description="You have no vendor bills recorded." />
            )}
          </div>
        </div>
      )}

      {/* Payments History Tab */}
      {activeTab === "payments" && (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {payments.length > 0 ? (
              <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Payment #</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: "var(--primary)" }}>{p.payment_number}</td>
                        <td>{String(p.payment_date).slice(0, 10)}</td>
                        <td style={{ textTransform: "capitalize" }}>{p.method}</td>
                        <td>{p.reference || "-"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "var(--success)" }}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={CreditCard} title="No payment records" description="No payment transactions found." />
            )}
          </div>
        </div>
      )}

      {/* Pay Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Make Payment"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPayModalOpen(false)}
              disabled={savingPayment}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleMakePayment}
              disabled={savingPayment || payForm.amount <= 0}
            >
              {savingPayment ? "Processing..." : "Pay Now"}
            </button>
          </>
        }
      >
        <form onSubmit={handleMakePayment}>
          <div className="alert alert-info">
            Paying invoice <strong>{payingDoc?.invoice_number}</strong>. Total due:{" "}
            <strong>
              {formatCurrency(Number(payingDoc?.grand_total || 0) - Number(payingDoc?.paid_amount || 0))}
            </strong>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payMethodContact">Payment Method *</label>
            <select
              id="payMethodContact"
              className="form-select"
              value={payForm.method}
              onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
            >
              <option value="bank">Bank Transfer / UPI / Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payAmountContact">Amount to Pay (₹) *</label>
            <input
              id="payAmountContact"
              type="number"
              step="0.01"
              min="0.01"
              max={Number(payingDoc?.grand_total || 0) - Number(payingDoc?.paid_amount || 0)}
              className="form-input"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="payRefContact">Payment Note / Bank Reference</label>
            <input
              id="payRefContact"
              type="text"
              className="form-input"
              placeholder="e.g. Transaction UTR #982348"
              value={payForm.reference}
              onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
