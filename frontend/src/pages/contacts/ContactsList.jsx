import { useState, useEffect } from "react";
import api from "../../api/axios";
import PageHeader from "../../components/common/PageHeader";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import ViewSwitcher from "../../components/common/ViewSwitcher";
import { Plus, Search, Edit2, Trash2, Users, MapPin, Mail, Phone } from "lucide-react";

export default function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_type: "customer",
    email: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/contacts");
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setContacts(items);
    } catch (err) {
      setError(err.userMessage || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({
      name: "",
      contact_type: "customer",
      email: "",
      phone: "",
      city: "",
      state: "",
      pincode: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || "",
      contact_type: contact.contact_type || "customer",
      email: contact.email || "",
      phone: contact.phone || "",
      city: contact.city || "",
      state: contact.state || "",
      pincode: contact.pincode || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, formData);
      } else {
        await api.post("/contacts", formData);
      }
      setIsModalOpen(false);
      await fetchContacts();
    } catch (err) {
      setError(err.userMessage || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete contact "${name}"?`)) return;
    try {
      setError("");
      await api.delete(`/contacts/${id}`);
      await fetchContacts();
    } catch (err) {
      setError(err.userMessage || "Cannot delete contact: linked records exist");
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || c.contact_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <PageHeader
        title="Contact Master"
        description="Maintain customer and vendor records, addresses, and payment information"
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Contact</span>
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
            placeholder="Search by name, email, or city..."
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
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="both">Both (Customer & Vendor)</option>
          </select>
          <ViewSwitcher viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Contacts Table */}

      {viewMode === "kanban" ? (
        <div className="kanban-board">
          {[
            { key: "customer", label: "Customers" },
            { key: "vendor", label: "Vendors" },
            { key: "both", label: "Both" },
          ].map((col) => {
            const colContacts = filteredContacts.filter((c) => c.contact_type === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span>{col.label}</span>
                    <span className="kanban-column-count">{colContacts.length}</span>
                  </div>
                </div>

                <div className="kanban-cards-list">
                  {colContacts.length > 0 ? (
                    colContacts.map((c) => (
                      <div key={c.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "var(--radius-full)",
                                backgroundColor: "var(--primary-subtle)",
                                color: "var(--primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "14px",
                                flexShrink: 0,
                              }}
                            >
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="kanban-card-title">{c.name}</span>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>
                                {c.contact_type}
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={c.contact_type} />
                        </div>

                        <div className="kanban-card-body" style={{ marginTop: "4px" }}>
                          {c.email && (
                            <div className="kanban-card-sub">
                              <Mail size={12} style={{ color: "var(--text-muted)" }} />
                              <span style={{ wordBreak: "break-all" }}>{c.email}</span>
                            </div>
                          )}
                          {c.phone && (
                            <div className="kanban-card-sub">
                              <Phone size={12} style={{ color: "var(--text-muted)" }} />
                              <span>{c.phone}</span>
                            </div>
                          )}
                          {(c.city || c.state) && (
                            <div className="kanban-card-sub">
                              <MapPin size={12} style={{ color: "var(--text-muted)" }} />
                              <span>{[c.city, c.state].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                        </div>

                        <div className="kanban-card-footer">
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID #{c.id}</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(c)}
                              title="Edit Contact"
                            >
                              <Edit2 size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDelete(c.id, c.name)}
                              title="Delete Contact"
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
          {filteredContacts.length > 0 ? (
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Location</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "var(--radius-full)",
                              backgroundColor: "var(--primary-subtle)",
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          >
                            {contact.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{contact.name}</div>
                            {contact.is_active === false && (
                              <span style={{ fontSize: "11px", color: "var(--danger)" }}>Archived</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={contact.contact_type} />
                      </td>
                      <td>
                        {contact.email ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                            <Mail size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{contact.email}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {contact.phone ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                            <Phone size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{contact.phone}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {contact.city || contact.state ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                            <MapPin size={13} style={{ color: "var(--text-muted)" }} />
                            <span>{[contact.city, contact.state, contact.pincode].filter(Boolean).join(", ")}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => openEditModal(contact)}
                            title="Edit Contact"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDelete(contact.id, contact.name)}
                            title="Delete Contact"
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
              icon={Users}
              title="No contacts found"
              description="Add customers, vendors, or business partners to start invoicing and billing."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  <Plus size={14} />
                  <span>Create Contact</span>
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
        title={editingContact ? "Edit Contact" : "Add New Contact"}
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
              {saving ? "Saving..." : editingContact ? "Update Contact" : "Create Contact"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="contactName">Full Name *</label>
            <input
              id="contactName"
              type="text"
              className="form-input"
              placeholder="e.g. Azure Furniture or Nimesh Pathak"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="contactType">Contact Type *</label>
              <select
                id="contactType"
                className="form-select"
                value={formData.contact_type}
                onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="both">Both (Customer & Vendor)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactPhone">Phone / Mobile</label>
              <input
                id="contactPhone"
                type="text"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactEmail">Email Address</label>
            <input
              id="contactEmail"
              type="email"
              className="form-input"
              placeholder="e.g. contact@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="contactCity">City</label>
              <input
                id="contactCity"
                type="text"
                className="form-input"
                placeholder="e.g. Ahmedabad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactState">State</label>
              <input
                id="contactState"
                type="text"
                className="form-input"
                placeholder="e.g. Gujarat"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactPincode">Pincode</label>
              <input
                id="contactPincode"
                type="text"
                className="form-input"
                placeholder="e.g. 380001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
