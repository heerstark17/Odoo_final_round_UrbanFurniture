import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import FormModal from "../../components/FormModal";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";
import {
  getContacts,
  createContact,
  updateContact,
  archiveContact,
} from "../../services/masterDataService";

const PAGE_SIZE = 5;


const CONTACT_TYPE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
];

const CONTACT_TYPE_LABELS = {
  customer: "Customer",
  vendor: "Vendor",
};

const EMPTY_FORM = {
  name: "",
  contactType: "customer",
  email: "",
  phone: "",
  city: "",
  state: "",
  pincode: "",
  profileImageUrl: "",
};

function displayContactType(rawType) {
  if (!rawType) return "-";
  return CONTACT_TYPE_LABELS[rawType.toLowerCase()] || rawType;
}

function typeBadgeClass(rawType) {
  switch ((rawType || "").toLowerCase()) {
    case "customer":
      return "bg-primary";
    case "vendor":
      return "bg-info text-dark";
    default:
      return "bg-light text-dark border";
  }
}

function validateContactForm(values) {
  const errors = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  if (!values.contactType) errors.contactType = "Type is required.";

  
  const email = values.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = values.phone.trim();
  if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  const pincode = values.pincode.trim();
  if (pincode && !/^[0-9]{4,10}$/.test(pincode)) {
    errors.pincode = "Enter a valid pincode.";
  }

  return errors;
}

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [savingForm, setSavingForm] = useState(false);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [contactToArchive, setContactToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getContacts();
      setContacts(data || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to load contacts. Please check your connection and try again.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

 
  const activeContacts = useMemo(
    () => contacts.filter((c) => c.is_active === true),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activeContacts.filter((c) => {
      const matchesType =
        typeFilter === "All" ||
        (c.contact_type || "").toLowerCase() === typeFilter;

      const matchesSearch =
        !term ||
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [activeContacts, searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, currentPage]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  function openCreateForm() {
    setFormMode("create");
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setShowFormModal(true);
  }

  function openEditForm(contact) {
    setFormMode("edit");
    setFormValues({
      name: contact.name || "",
      contactType: (contact.contact_type || "customer").toLowerCase(),
      email: contact.email || "",
      phone: contact.phone || "",
      city: contact.city || "",
      state: contact.state || "",
      pincode: contact.pincode || "",
      profileImageUrl: contact.profile_image_url || "",
    });
    setFormErrors({});
    setEditingId(contact.id);
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (savingForm) return;
    setShowFormModal(false);
  }

  function handleFieldChange(field, value) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFormSubmit() {
    const errors = validateContactForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      contactType: formValues.contactType,
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim(),
      pincode: formValues.pincode.trim(),
      profileImageUrl: formValues.profileImageUrl.trim(),
    };

    setSavingForm(true);
    try {
      if (formMode === "create") {
        await createContact(payload);
      } else {
        await updateContact(editingId, payload);
      }
      await loadContacts();
      setShowFormModal(false);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to save contact. Please try again.";
      setFormErrors({ submit: message });
    } finally {
      setSavingForm(false);
    }
  }

  function requestArchive(contact) {
    setContactToArchive(contact);
    setArchiveError("");
    setShowArchiveConfirm(true);
  }

  function closeArchiveConfirm() {
    if (archiving) return;
    setShowArchiveConfirm(false);
    setContactToArchive(null);
    setArchiveError("");
  }

  async function handleConfirmArchive() {
    if (!contactToArchive) return;
    setArchiving(true);
    setArchiveError("");
    try {
      await archiveContact(contactToArchive.id);
      await loadContacts();
      setShowArchiveConfirm(false);
      setContactToArchive(null);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to archive contact. Please try again.";
      setArchiveError(message);
    } finally {
      setArchiving(false);
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "contact_type",
      label: "Type",
      render: (value) => (
        <span className={`badge ${typeBadgeClass(value)}`}>
          {displayContactType(value)}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    {
      key: "actions",
      label: "Actions",
      className: "text-end",
      render: (_value, row) => (
        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditForm(row);
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              requestArchive(row);
            }}
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
          <h2 className="fw-semibold mb-1">Contacts</h2>
          <p className="text-muted mb-0">
            Manage customers, vendors, and other business contacts.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateForm}>
          + Add Contact
        </button>
      </div>

      {/* Search / Filter */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="col-12 col-md-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Types</option>
                {CONTACT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Loading contacts..." />
          ) : loadError ? (
            <div className="text-center text-danger py-4">
              {loadError}
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadContacts}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={paginatedContacts}
                loading={false}
                emptyMessage="No contacts match your search or filter."
              />

              {filteredContacts.length > PAGE_SIZE && (
                <div className="d-flex justify-content-end mt-3">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Contact */}
      <FormModal
        show={showFormModal}
        title={formMode === "create" ? "Add Contact" : "Edit Contact"}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        submitText={formMode === "create" ? "Create" : "Save Changes"}
        loading={savingForm}
      >
        {formErrors.submit && (
          <div className="alert alert-danger py-2">{formErrors.submit}</div>
        )}

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
            value={formValues.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
          {formErrors.name && (
            <div className="invalid-feedback">{formErrors.name}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Type</label>
          <select
            className={`form-select ${formErrors.contactType ? "is-invalid" : ""}`}
            value={formValues.contactType}
            onChange={(e) => handleFieldChange("contactType", e.target.value)}
          >
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {formErrors.contactType && (
            <div className="invalid-feedback">{formErrors.contactType}</div>
          )}
        </div>

        <div className="row g-2">
          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">
              Email <span className="text-muted">(optional)</span>
            </label>
            <input
              type="email"
              className={`form-control ${formErrors.email ? "is-invalid" : ""}`}
              value={formValues.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
            />
            {formErrors.email && (
              <div className="invalid-feedback">{formErrors.email}</div>
            )}
          </div>
          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">
              Phone <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.phone ? "is-invalid" : ""}`}
              value={formValues.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
            />
            {formErrors.phone && (
              <div className="invalid-feedback">{formErrors.phone}</div>
            )}
          </div>
        </div>

        <div className="row g-2">
          <div className="col-12 col-md-4 mb-3">
            <label className="form-label">
              City <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formValues.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4 mb-3">
            <label className="form-label">
              State <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              value={formValues.state}
              onChange={(e) => handleFieldChange("state", e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4 mb-3">
            <label className="form-label">
              Pincode <span className="text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.pincode ? "is-invalid" : ""}`}
              value={formValues.pincode}
              onChange={(e) => handleFieldChange("pincode", e.target.value)}
            />
            {formErrors.pincode && (
              <div className="invalid-feedback">{formErrors.pincode}</div>
            )}
          </div>
        </div>

        <div className="mb-1">
          <label className="form-label">
            Profile Image URL <span className="text-muted">(optional)</span>
          </label>
          <input
            type="text"
            className="form-control"
            value={formValues.profileImageUrl}
            onChange={(e) =>
              handleFieldChange("profileImageUrl", e.target.value)
            }
            placeholder="https://..."
          />
        </div>
      </FormModal>

      {/* Archive Confirm */}
      <ConfirmModal
        show={showArchiveConfirm}
        title="Archive Contact"
        message={
          archiveError
            ? archiveError
            : contactToArchive
            ? `Are you sure you want to archive "${contactToArchive.name}"? This deactivates the contact but does not permanently delete it.`
            : "Are you sure you want to archive this contact?"
        }
        onClose={closeArchiveConfirm}
        onConfirm={handleConfirmArchive}
        confirmText="Archive"
        variant="danger"
        loading={archiving}
      />
    </>
  );
}

export default Contacts;