import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle2,
  FileCheck,
  Eye,
  Trash2,
  Calendar,
  User,
  PlusCircle,
  Package,
} from "lucide-react";

export default function SalesOrders() {
  const { isContact } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Create Order Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    so_number: "",
    customerId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [createLines, setCreateLines] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [createError, setCreateError] = useState("");

  // View / Edit Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Add Line Item Modal (standalone or inside Order Details)
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [lineForm, setLineForm] = useState({
    productId: "",
    quantity: 1,
    unitPrice: 0,
    taxId: "",
    accountId: "",
    analyticAccountId: "",
  });
  const [savingLine, setSavingLine] = useState(false);
  const [lineError, setLineError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/sales-orders");
      setOrders(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load sales orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [cRes, pRes, tRes, aRes, anRes] = await Promise.all([
        api.get("/contacts").catch(() => ({ data: [] })),
        api.get("/products").catch(() => ({ data: [] })),
        api.get("/taxes").catch(() => ({ data: [] })),
        api.get("/chart-of-accounts").catch(() => ({ data: [] })),
        api.get("/analytic-accounts").catch(() => ({ data: [] })),
      ]);
      const contactList = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data || []);
      setContacts(contactList.filter((c) => c.contact_type === "customer" || c.contact_type === "both"));
      setProducts(pRes.data || []);
      setTaxes(tRes.data || []);
      setAccounts((aRes.data || []).filter((a) => a.account_type === "income"));
      setAnalytics(anRes.data || []);
    } catch (err) {
      console.error("Failed to load dependencies:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDependencies();
  }, []);

  const openCreateModal = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const firstProduct = products[0];
    const initialPrice = firstProduct ? Number(firstProduct.sales_price || 0) : 0;

    setOrderForm({
      so_number: `SO-${new Date().getFullYear()}-${randomNum}`,
      customerId: contacts[0]?.id ? String(contacts[0].id) : "",
      orderDate: new Date().toISOString().slice(0, 10),
      notes: "Standard furniture delivery",
    });

    setCreateLines(
      firstProduct
        ? [
            {
              productId: String(firstProduct.id),
              quantity: 1,
              unitPrice: initialPrice,
              taxId: taxes[0]?.id ? String(taxes[0].id) : "",
              accountId: accounts[0]?.id ? String(accounts[0].id) : "",
              analyticAccountId: "",
            },
          ]
        : []
    );

    setCreateError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateLineChange = (index, field, value) => {
    const updated = [...createLines];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "productId") {
      const prod = products.find((p) => String(p.id) === String(value));
      if (prod) {
        updated[index].unitPrice = Number(prod.sales_price || 0);
      }
    }
    setCreateLines(updated);
  };

  const addRowToCreateModal = () => {
    const firstProduct = products[0];
    const initialPrice = firstProduct ? Number(firstProduct.sales_price || 0) : 0;
    setCreateLines([
      ...createLines,
      {
        productId: firstProduct ? String(firstProduct.id) : "",
        quantity: 1,
        unitPrice: initialPrice,
        taxId: taxes[0]?.id ? String(taxes[0].id) : "",
        accountId: accounts[0]?.id ? String(accounts[0].id) : "",
        analyticAccountId: "",
      },
    ]);
  };

  const removeRowFromCreateModal = (index) => {
    setCreateLines(createLines.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      setSavingOrder(true);
      setCreateError("");
      setError("");

      if (!orderForm.customerId) {
        setCreateError("Please select a customer");
        setSavingOrder(false);
        return;
      }

      const validLines = createLines
        .filter((l) => l.productId && Number(l.quantity) > 0)
        .map((l) => ({
          productId: parseInt(l.productId),
          quantity: parseFloat(l.quantity),
          unitPrice: parseFloat(l.unitPrice || 0),
          taxId: l.taxId ? parseInt(l.taxId) : null,
          accountId: l.accountId ? parseInt(l.accountId) : null,
          analyticAccountId: l.analyticAccountId ? parseInt(l.analyticAccountId) : null,
        }));

      const payload = {
        so_number: orderForm.so_number.trim(),
        customerId: parseInt(orderForm.customerId),
        orderDate: orderForm.orderDate,
        notes: orderForm.notes.trim() || null,
        lines: validLines,
      };

      const res = await api.post("/sales-orders", payload);
      setIsCreateModalOpen(false);
      await fetchOrders();
      if (res.data?.id) {
        openDetailsModal(res.data.id);
      }
    } catch (err) {
      setCreateError(err.userMessage || "Failed to create sales order");
    } finally {
      setSavingOrder(false);
    }
  };

  const openDetailsModal = async (orderId) => {
    try {
      setLoadingDetails(true);
      setIsDetailsModalOpen(true);
      const res = await api.get(`/sales-orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (err) {
      setError(err.userMessage || "Failed to load order details");
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openAddLineForOrder = async (orderId) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/sales-orders/${orderId}`);
      setSelectedOrder(res.data);
      const firstProduct = products[0];
      const initialPrice = firstProduct ? Number(firstProduct.sales_price || 0) : 0;
      setLineForm({
        productId: firstProduct ? String(firstProduct.id) : "",
        quantity: 1,
        unitPrice: initialPrice,
        taxId: taxes[0]?.id ? String(taxes[0].id) : "",
        accountId: accounts[0]?.id ? String(accounts[0].id) : "",
        analyticAccountId: "",
      });
      setLineError("");
      setIsAddLineModalOpen(true);
    } catch (err) {
      setError(err.userMessage || "Failed to load order");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleProductSelect = (productId) => {
    const prod = products.find((p) => String(p.id) === String(productId));
    setLineForm({
      ...lineForm,
      productId,
      unitPrice: prod ? Number(prod.sales_price || 0) : 0,
      taxId: taxes[0]?.id ? String(taxes[0].id) : "",
      accountId: accounts[0]?.id ? String(accounts[0].id) : "",
    });
  };

  const handleAddLine = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setSavingLine(true);
      setLineError("");
      if (!lineForm.productId) {
        setLineError("Please select a product");
        setSavingLine(false);
        return;
      }
      await api.post(`/sales-orders/${selectedOrder.id}/lines`, {
        productId: parseInt(lineForm.productId),
        quantity: parseFloat(lineForm.quantity),
        unitPrice: parseFloat(lineForm.unitPrice || 0),
        taxId: lineForm.taxId ? parseInt(lineForm.taxId) : null,
        accountId: lineForm.accountId ? parseInt(lineForm.accountId) : null,
        analyticAccountId: lineForm.analyticAccountId ? parseInt(lineForm.analyticAccountId) : null,
      });
      setIsAddLineModalOpen(false);
      // Refresh order details
      const res = await api.get(`/sales-orders/${selectedOrder.id}`);
      setSelectedOrder(res.data);
      await fetchOrders();
    } catch (err) {
      setLineError(err.userMessage || "Failed to add line item");
    } finally {
      setSavingLine(false);
    }
  };

  const handleDeleteLine = async (lineId) => {
    if (!selectedOrder) return;
    try {
      setError("");
      await api.delete(`/sales-orders/${selectedOrder.id}/lines/${lineId}`);
      const res = await api.get(`/sales-orders/${selectedOrder.id}`);
      setSelectedOrder(res.data);
      await fetchOrders();
    } catch (err) {
      setError(err.userMessage || "Failed to delete line item");
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      setError("");
      await api.put(`/sales-orders/${selectedOrder.id}`, {
        so_number: selectedOrder.so_number,
        customerId: selectedOrder.customer_id,
        orderDate: String(selectedOrder.order_date).slice(0, 10),
        status: "confirmed",
        notes: selectedOrder.notes,
      });
      const res = await api.get(`/sales-orders/${selectedOrder.id}`);
      setSelectedOrder(res.data);
      await fetchOrders();
    } catch (err) {
      setError(err.userMessage || "Failed to confirm sales order");
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm(`Are you sure you want to delete draft sales order ${selectedOrder.so_number}?`)) {
      return;
    }
    try {
      setError("");
      await api.delete(`/sales-orders/${selectedOrder.id}`);
      setIsDetailsModalOpen(false);
      await fetchOrders();
    } catch (err) {
      setError(err.userMessage || "Failed to delete sales order");
    }
  };

  const handleConvertToInvoice = async () => {
    if (!selectedOrder) return;
    try {
      setError("");
      await api.post(`/sales-orders/${selectedOrder.id}/convert-to-invoice`);
      setIsDetailsModalOpen(false);
      navigate("/invoices");
    } catch (err) {
      setError(err.userMessage || "Failed to convert sales order to customer invoice");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.so_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateCreateTotal = () => {
    return createLines.reduce((acc, curr) => {
      const qty = parseFloat(curr.quantity) || 0;
      const price = parseFloat(curr.unitPrice) || 0;
      return acc + qty * price;
    }, 0);
  };

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Create quotes, confirm sales orders with product line items, and convert directly into Customer Invoices"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Create Sales Order</span>
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
            placeholder="Search by SO number or customer..."
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
            <option value="cancelled">Cancelled</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      
      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "draft", label: "Draft / Quotation" },
            { key: "confirmed", label: "Confirmed Order" },
            { key: "cancelled", label: "Cancelled" },
          ].map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.key);
            const colTotal = colOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colOrders.length}</span>
                  </div>
                  <div className="kanban-column-total">{formatCurrency(colTotal)}</div>
                </div>

                <div className="kanban-cards-list">
                  {colOrders.length > 0 ? (
                    colOrders.map((o) => (
                      <div
                        key={o.id}
                        className="kanban-card"
                        onClick={() => openDetailsModal(o.id)}
                      >
                        <div className="kanban-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShoppingCart size={15} style={{ color: "var(--primary)" }} />
                            <span className="kanban-card-title">{o.so_number}</span>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>

                        <div className="kanban-card-body">
                          <div className="kanban-card-sub">
                            <User size={13} style={{ color: "var(--text-muted)" }} />
                            <span style={{ fontWeight: 500 }}>{o.customer_name}</span>
                          </div>
                          <div className="kanban-card-sub">
                            <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{String(o.order_date).slice(0, 10)}</span>
                          </div>
                          {o.notes && (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {o.notes}
                            </div>
                          )}
                        </div>

                        <div className="kanban-card-footer">
                          <div className="kanban-card-amount">
                            {formatCurrency(o.total_amount)}
                          </div>
                          <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                            {o.status === "draft" && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => openAddLineForOrder(o.id)}
                                title="Add Item"
                              >
                                <PlusCircle size={13} />
                                <span>Add Item</span>
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openDetailsModal(o.id)}
                            >
                              <Eye size={13} />
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
          {filteredOrders.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <ShoppingCart size={15} />
                          <span>{o.so_number}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{o.customer_name}</td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {String(o.order_date).slice(0, 10)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          {o.status === "draft" && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openAddLineForOrder(o.id)}
                              title="Add Item to this Order"
                            >
                              <PlusCircle size={13} />
                              <span>Add Item</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openDetailsModal(o.id)}
                          >
                            <Eye size={13} />
                            <span>View Details</span>
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
              icon={ShoppingCart}
              title="No sales orders found"
              description="Create a sales order for chairs, tables, or services to begin the sales workflow."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>New Sales Order</span>
                </button>
              }
            />
          )}
        </div>
      </div>
      )}

      {/* Create Order Modal with Integrated Line Items */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Sales Order"
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={savingOrder}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateOrder}
              disabled={savingOrder}
            >
              {savingOrder ? "Creating..." : "Create Order"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder}>
          {createError && (
            <div className="alert alert-danger" style={{ marginBottom: "16px" }}>
              {createError}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="soNumber">SO Number *</label>
              <input
                id="soNumber"
                type="text"
                className="form-input"
                value={orderForm.so_number}
                onChange={(e) => setOrderForm({ ...orderForm, so_number: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="soCustomer">Customer *</label>
              <select
                id="soCustomer"
                className="form-select"
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                required
              >
                <option value="">Select customer...</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city || "Urban Client"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="soDate">Order Date *</label>
              <input
                id="soDate"
                type="date"
                className="form-input"
                value={orderForm.orderDate}
                onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="soNotes">Order Notes</label>
              <input
                id="soNotes"
                type="text"
                className="form-input"
                placeholder="Optional notes or delivery instructions"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Integrated Line Items Section */}
          <div style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                Order Line Items ({createLines.length})
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addRowToCreateModal}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={14} />
                <span>Add Another Product</span>
              </button>
            </div>

            {createLines.length > 0 ? (
              <div className="table-container" style={{ marginBottom: "12px" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: "40%" }}>Product *</th>
                      <th style={{ width: "15%" }}>Qty *</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Unit Price (₹)</th>
                      <th style={{ width: "20%", textAlign: "right" }}>Subtotal</th>
                      <th style={{ width: "5%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {createLines.map((line, idx) => {
                      const subtotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
                      return (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select"
                              value={line.productId}
                              onChange={(e) => handleCreateLineChange(idx, "productId", e.target.value)}
                              required
                            >
                              <option value="">Select product...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - Price: {formatCurrency(p.sales_price)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="form-input"
                              value={line.quantity}
                              onChange={(e) => handleCreateLineChange(idx, "quantity", e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-input"
                              style={{ textAlign: "right" }}
                              value={line.unitPrice}
                              onChange={(e) => handleCreateLineChange(idx, "unitPrice", e.target.value)}
                              required
                            />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600 }}>
                            {formatCurrency(subtotal)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {createLines.length > 1 && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => removeRowFromCreateModal(idx)}
                                title="Remove item"
                              >
                                <Trash2 size={14} style={{ color: "var(--danger)" }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "16px", backgroundColor: "var(--bg-subtle)", borderRadius: "var(--radius-md)", marginBottom: "12px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No items added yet. Click &quot;Add Another Product&quot; to specify items.</p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginRight: "12px" }}>ESTIMATED TOTAL:</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--primary)" }}>
                  {formatCurrency(calculateCreateTotal())}
                </span>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Order Details & Lines Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Sales Order: ${selectedOrder?.so_number || ""}`}
        size="lg"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Status: <StatusBadge status={selectedOrder?.status} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>

              {selectedOrder?.status === "draft" && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteOrder}
                    title="Delete this draft sales order"
                  >
                    <Trash2 size={14} />
                    <span>Delete Draft</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleConfirmOrder}
                    disabled={!selectedOrder.lines?.length}
                    title={!selectedOrder.lines?.length ? "Add line items first" : "Confirm Sales Order"}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Order</span>
                  </button>
                </>
              )}

              {selectedOrder?.status === "confirmed" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConvertToInvoice}
                >
                  <FileCheck size={15} />
                  <span>Convert to Customer Invoice</span>
                </button>
              )}
            </div>
          </div>
        }
      >
        {loadingDetails ? (
          <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>Loading order...</p>
        ) : selectedOrder ? (
          <div>
            {/* Summary details */}
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
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>CUSTOMER</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{selectedOrder.customer_name}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>ORDER DATE</span>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>{String(selectedOrder.order_date).slice(0, 10)}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>STATUS</span>
                <div><StatusBadge status={selectedOrder.status} /></div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>TOTAL AMOUNT</span>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--primary)" }}>
                  {formatCurrency(selectedOrder.total_amount)}
                </div>
              </div>
            </div>

            {/* Line Items Header & Action */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                Order Line Items ({selectedOrder.lines?.length || 0})
              </h4>
              {selectedOrder.status === "draft" && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const firstProduct = products[0];
                    const initialPrice = firstProduct ? Number(firstProduct.sales_price || 0) : 0;
                    setLineForm({
                      productId: firstProduct ? String(firstProduct.id) : "",
                      quantity: 1,
                      unitPrice: initialPrice,
                      taxId: taxes[0]?.id ? String(taxes[0].id) : "",
                      accountId: accounts[0]?.id ? String(accounts[0].id) : "",
                      analyticAccountId: "",
                    });
                    setLineError("");
                    setIsAddLineModalOpen(true);
                  }}
                >
                  <PlusCircle size={14} />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            {/* Line Items Table */}
            <div className="table-container" style={{ marginBottom: "16px" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Tax</th>
                    <th style={{ textAlign: "right" }}>Line Total</th>
                    {selectedOrder.status === "draft" && (
                      <th style={{ width: "40px" }}></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines && selectedOrder.lines.length > 0 ? (
                    selectedOrder.lines.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 500 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Package size={14} style={{ color: "var(--text-secondary)" }} />
                            <span>{l.product_name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>{Number(l.quantity)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(l.unit_price)}</td>
                        <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                          {l.tax_name ? `${l.tax_name} (${Number(l.tax_rate)}%)` : "0%"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(l.line_total)}</td>
                        {selectedOrder.status === "draft" && (
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleDeleteLine(l.id)}
                              title="Delete line"
                            >
                              <Trash2 size={13} style={{ color: "var(--danger)" }} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                        No line items added yet. Click &quot;Add Line Item&quot; to add products to this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedOrder.notes && (
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", backgroundColor: "var(--bg-canvas)", padding: "10px", borderRadius: "var(--radius-sm)" }}>
                <strong>Notes:</strong> {selectedOrder.notes}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Add Line Modal */}
      <Modal
        isOpen={isAddLineModalOpen}
        onClose={() => setIsAddLineModalOpen(false)}
        title="Add Product Line"
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
              onClick={handleAddLine}
              disabled={savingLine || !lineForm.productId || lineForm.quantity <= 0}
            >
              {savingLine ? "Adding..." : "Add to Order"}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddLine}>
          {lineError && (
            <div className="alert alert-danger" style={{ marginBottom: "12px" }}>
              {lineError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="lineProduct">Product *</label>
            <select
              id="lineProduct"
              className="form-select"
              value={lineForm.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
              required
            >
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - Price: {formatCurrency(p.sales_price)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="lineQty">Quantity *</label>
              <input
                id="lineQty"
                type="number"
                step="1"
                min="1"
                className="form-input"
                value={lineForm.quantity}
                onChange={(e) => setLineForm({ ...lineForm, quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lineUnitPrice">Unit Price (₹) *</label>
              <input
                id="lineUnitPrice"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={lineForm.unitPrice}
                onChange={(e) => setLineForm({ ...lineForm, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="lineTax">Tax Rate</label>
              <select
                id="lineTax"
                className="form-select"
                value={lineForm.taxId}
                onChange={(e) => setLineForm({ ...lineForm, taxId: e.target.value })}
              >
                <option value="">No Tax (0%)</option>
                {taxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({Number(t.rate)}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lineAccount">Sales Income Account</label>
              <select
                id="lineAccount"
                className="form-select"
                value={lineForm.accountId}
                onChange={(e) => setLineForm({ ...lineForm, accountId: e.target.value })}
              >
                <option value="">Default Sales Account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.account_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lineAnalytic">Analytic Account (Cost/Revenue Center)</label>
            <select
              id="lineAnalytic"
              className="form-select"
              value={lineForm.analyticAccountId}
              onChange={(e) => setLineForm({ ...lineForm, analyticAccountId: e.target.value })}
            >
              <option value="">None</option>
              {analytics.map((an) => (
                <option key={an.id} value={an.id}>
                  {an.name} ({an.analytic_type})
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
