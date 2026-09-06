import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { Plus, Search, Edit2, Trash2, Package, Tag, DollarSign } from "lucide-react";

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    product_type: "goods",
    category: "",
    sales_price: "",
    purchase_price: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/products");
      setProducts(res.data || []);
    } catch (err) {
      setError(err.userMessage || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      product_type: "goods",
      category: "",
      sales_price: "",
      purchase_price: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      product_type: product.product_type || "goods",
      category: product.category || "",
      sales_price: product.sales_price || "",
      purchase_price: product.purchase_price || "",
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
        product_type: formData.product_type,
        category: formData.category.trim() || null,
        sales_price: parseFloat(formData.sales_price) || 0,
        purchase_price: parseFloat(formData.purchase_price) || 0,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setError(err.userMessage || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      setError("");
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (err) {
      setError(err.userMessage || "Cannot delete product: used in orders or invoices");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(val || 0));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || p.product_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <PageHeader
        title="Product Master"
        description="Manage furniture items, services, sales prices, and purchase costs"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        }
      />

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by product name or category..."
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
            <option value="goods">Goods (Physical Furniture)</option>
            <option value="service">Service</option>
            <option value="combo">Combo</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Products Table */}

      {viewMode === "kanban" ? (
        <div className="kanban-grid">
          {filteredProducts.map((p) => {
            const margin = Number(p.sales_price) - Number(p.cost_price || p.purchase_price || 0);
            return (
              <div key={p.id} className="kanban-card">
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
                      <Package size={18} />
                    </div>
                    <div>
                      <span className="kanban-card-title">{p.name}</span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {p.category || "General Furniture"}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-customer">{p.product_type}</span>
                </div>

                <div className="kanban-card-body" style={{ marginTop: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span>Cost / Purchase:</span>
                    <span>{formatCurrency(p.cost_price || p.purchase_price || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <span>Estimated Margin:</span>
                    <span style={{ fontWeight: 600, color: margin >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {formatCurrency(margin)}
                    </span>
                  </div>
                </div>

                <div className="kanban-card-footer">
                  <div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", fontWeight: 600 }}>SALES PRICE</span>
                    <span className="kanban-card-amount">{formatCurrency(p.sales_price)}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(p)}
                      title="Edit Product"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(p.id, p.name)}
                      title="Delete Product"
                    >
                      <Trash2 size={12} style={{ color: "var(--danger)" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filteredProducts.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Sales Price</th>
                    <th style={{ textAlign: "right" }}>Cost Price</th>
                    <th style={{ textAlign: "right" }}>Margin</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const margin = Number(p.sales_price || 0) - Number(p.purchase_price || 0);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "var(--radius-md)",
                                backgroundColor: "var(--warning-subtle)",
                                color: "var(--warning)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Package size={16} />
                            </div>
                            <span>{p.name}</span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={p.product_type} />
                        </td>
                        <td>
                          {p.category ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                              <Tag size={12} />
                              {p.category}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(p.sales_price)}</td>
                        <td style={{ textAlign: "right", color: "var(--text-secondary)" }}>
                          {formatCurrency(p.purchase_price)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            color: margin >= 0 ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {formatCurrency(margin)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => openEditModal(p)}
                              title="Edit Product"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Delete Product"
                            >
                              <Trash2 size={14} style={{ color: "var(--danger)" }} />
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
              icon={Package}
              title="No products found"
              description="Add furniture items, office chairs, tables, or consultation services."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>Create Product</span>
                </button>
              }
            />
          )}
        </div>
      </div>
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
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
              disabled={saving || !formData.name.trim()}
            >
              {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="prodName">Product Name *</label>
            <input
              id="prodName"
              type="text"
              className="form-input"
              placeholder="e.g. Office Chair or Wooden Dining Table"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prodType">Type *</label>
              <select
                id="prodType"
                className="form-select"
                value={formData.product_type}
                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
              >
                <option value="goods">Goods (Stockable furniture)</option>
                <option value="service">Service</option>
                <option value="combo">Combo Kit</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prodCategory">Category</label>
              <input
                id="prodCategory"
                type="text"
                className="form-input"
                placeholder="e.g. Chairs, Tables, Seating"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="prodSalesPrice">Sales Price (₹) *</label>
              <input
                id="prodSalesPrice"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.sales_price}
                onChange={(e) => setFormData({ ...formData, sales_price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prodCostPrice">Cost / Purchase Price (₹) *</label>
              <input
                id="prodCostPrice"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
