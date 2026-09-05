import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import FormModal from "../../components/FormModal";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 5;

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "sales",
};

const JOURNAL_TYPES = [
  { value: "sales", label: "Sales" },
  { value: "purchase", label: "Purchase" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "general", label: "General" },
];

const INITIAL_JOURNALS = [
  {
    id: 1,
    name: "Sales Journal",
    code: "SALES",
    type: "sales",
    active: true,
  },
  {
    id: 2,
    name: "Purchase Journal",
    code: "PURCH",
    type: "purchase",
    active: true,
  },
  {
    id: 3,
    name: "Cash Journal",
    code: "CASH",
    type: "cash",
    active: true,
  },
  {
    id: 4,
    name: "Bank Journal",
    code: "BANK",
    type: "bank",
    active: true,
  },
  {
    id: 5,
    name: "General Journal",
    code: "MISC",
    type: "general",
    active: true,
  },
];

const TYPE_LABELS = {
  sales: "Sales",
  purchase: "Purchase",
  cash: "Cash",
  bank: "Bank",
  general: "General",
};

function typeBadgeClass(type) {
  switch (type) {
    case "sales":
      return "bg-primary";
    case "purchase":
      return "bg-warning text-dark";
    case "cash":
      return "bg-success";
    case "bank":
      return "bg-info text-dark";
    case "general":
      return "bg-secondary";
    default:
      return "bg-light text-dark border";
  }
}

function Journals() {
  const [journals, setJournals] = useState(INITIAL_JOURNALS);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [journalToArchive, setJournalToArchive] = useState(null);

  const filteredJournals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return journals.filter((journal) => {
      if (!journal.active) return false;

      const matchesType =
        typeFilter === "All" || journal.type === typeFilter;

      const matchesSearch =
        !term ||
        journal.name.toLowerCase().includes(term) ||
        journal.code.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [journals, searchTerm, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJournals.length / PAGE_SIZE)
  );

  const paginatedJournals = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredJournals.slice(start, start + PAGE_SIZE);
  }, [filteredJournals, currentPage]);

  function openCreateForm() {
    setFormMode("create");
    setFormValues(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowFormModal(true);
  }

  function openEditForm(journal) {
    setFormMode("edit");
    setEditingId(journal.id);

    setFormValues({
      name: journal.name,
      code: journal.code,
      type: journal.type,
    });

    setFormError("");
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
    setFormError("");
  }

  function handleFieldChange(field, value) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit() {
    const name = formValues.name.trim();
    const code = formValues.code.trim().toUpperCase();

    if (!name) {
      setFormError("Journal name is required.");
      return;
    }

    if (!code) {
      setFormError("Journal code is required.");
      return;
    }

    if (!formValues.type) {
      setFormError("Journal type is required.");
      return;
    }

    const duplicateCode = journals.some(
      (journal) =>
        journal.code.toLowerCase() === code.toLowerCase() &&
        journal.id !== editingId &&
        journal.active
    );

    if (duplicateCode) {
      setFormError("A journal with this code already exists.");
      return;
    }

    if (formMode === "create") {
      const nextId =
        journals.length > 0
          ? Math.max(...journals.map((journal) => journal.id)) + 1
          : 1;

      setJournals((prev) => [
        ...prev,
        {
          id: nextId,
          name,
          code,
          type: formValues.type,
          active: true,
        },
      ]);
    } else {
      setJournals((prev) =>
        prev.map((journal) =>
          journal.id === editingId
            ? {
                ...journal,
                name,
                code,
                type: formValues.type,
              }
            : journal
        )
      );
    }

    closeFormModal();
  }

  function requestArchive(journal) {
    setJournalToArchive(journal);
    setShowConfirm(true);
  }

  function closeConfirm() {
    setShowConfirm(false);
    setJournalToArchive(null);
  }

  function confirmArchive() {
    if (!journalToArchive) return;

    setJournals((prev) =>
      prev.map((journal) =>
        journal.id === journalToArchive.id
          ? { ...journal, active: false }
          : journal
      )
    );

    closeConfirm();
  }

  const columns = [
    {
      key: "name",
      label: "Journal Name",
    },
    {
      key: "code",
      label: "Code",
    },
    {
      key: "type",
      label: "Type",
      render: (value) => (
        <span className={`badge ${typeBadgeClass(value)}`}>
          {TYPE_LABELS[value] || value}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-end",
      render: (_value, row) => (
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => openEditForm(row)}
          >
            Edit
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => requestArchive(row)}
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
          <h2 className="fw-semibold mb-1">Journals</h2>

          <p className="text-muted mb-0">
            Manage sales, purchase, cash, bank, and general accounting journals.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Journal
        </button>
      </div>

      {/* Search / Filter */}
      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by journal name or code..."
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

                {JOURNAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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
          <DataTable
            columns={columns}
            data={paginatedJournals}
            emptyMessage="No journals found."
          />

          {filteredJournals.length > PAGE_SIZE && (
            <div className="d-flex justify-content-end mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <FormModal
        show={showFormModal}
        title={formMode === "create" ? "Add Journal" : "Edit Journal"}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        submitText={formMode === "create" ? "Create" : "Save Changes"}
      >
        {formError && (
          <div className="alert alert-danger py-2">
            {formError}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Journal Name</label>

          <input
            type="text"
            className="form-control"
            value={formValues.name}
            onChange={(e) =>
              handleFieldChange("name", e.target.value)
            }
            placeholder="e.g. Sales Journal"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Journal Code</label>

          <input
            type="text"
            className="form-control"
            value={formValues.code}
            onChange={(e) =>
              handleFieldChange("code", e.target.value)
            }
            placeholder="e.g. SALES"
          />
        </div>

        <div className="mb-1">
          <label className="form-label">Journal Type</label>

          <select
            className="form-select"
            value={formValues.type}
            onChange={(e) =>
              handleFieldChange("type", e.target.value)
            }
          >
            {JOURNAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </FormModal>

      {/* Archive Confirmation */}
      <ConfirmModal
        show={showConfirm}
        title="Archive Journal"
        message={
          journalToArchive
            ? `Are you sure you want to archive "${journalToArchive.name}"?`
            : "Are you sure you want to archive this journal?"
        }
        onClose={closeConfirm}
        onConfirm={confirmArchive}
        confirmText="Archive"
        variant="danger"
      />
    </>
  );
}

export default Journals;