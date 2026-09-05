import { useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import FormModal from "../../components/FormModal";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 5;

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
};

const INITIAL_DATA = [
  {
    id: 1,
    code: "AA001",
    name: "Administration",
    description: "General administrative expenses",
    active: true,
  },
  {
    id: 2,
    code: "AA002",
    name: "Sales & Marketing",
    description: "Sales and marketing activities",
    active: true,
  },
  {
    id: 3,
    code: "AA003",
    name: "Manufacturing",
    description: "Manufacturing and production activities",
    active: true,
  },
  {
    id: 4,
    code: "AA004",
    name: "Operations",
    description: "Operational expenses and activities",
    active: true,
  },
];

function AnalyticAccounts() {
  const [accounts, setAccounts] = useState(INITIAL_DATA);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return accounts.filter(
      (account) =>
        account.active &&
        (!term ||
          account.name.toLowerCase().includes(term) ||
          account.code.toLowerCase().includes(term) ||
          account.description.toLowerCase().includes(term))
    );
  }, [accounts, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / PAGE_SIZE)
  );

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, currentPage]);

  function openCreateForm() {
    setFormMode("create");
    setFormValues(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowFormModal(true);
  }

  function openEditForm(account) {
    setFormMode("edit");
    setFormValues({
      name: account.name,
      code: account.code,
      description: account.description,
    });
    setEditingId(account.id);
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
    const code = formValues.code.trim();
    const description = formValues.description.trim();

    if (!name) {
      setFormError("Analytic account name is required.");
      return;
    }

    if (!code) {
      setFormError("Analytic account code is required.");
      return;
    }

    const duplicateCode = accounts.some(
      (account) =>
        account.code.toLowerCase() === code.toLowerCase() &&
        account.id !== editingId &&
        account.active
    );

    if (duplicateCode) {
      setFormError("An analytic account with this code already exists.");
      return;
    }

    if (formMode === "create") {
      const nextId =
        accounts.length > 0
          ? Math.max(...accounts.map((account) => account.id)) + 1
          : 1;

      setAccounts((prev) => [
        ...prev,
        {
          id: nextId,
          name,
          code,
          description,
          active: true,
        },
      ]);
    } else {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingId
            ? {
                ...account,
                name,
                code,
                description,
              }
            : account
        )
      );
    }

    closeFormModal();
  }

  function requestDelete(account) {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  }

  function closeDeleteConfirm() {
    setShowDeleteConfirm(false);
    setAccountToDelete(null);
  }

  function confirmDelete() {
    if (!accountToDelete) return;

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === accountToDelete.id
          ? { ...account, active: false }
          : account
      )
    );

    closeDeleteConfirm();
  }

  const columns = [
    {
      key: "code",
      label: "Code",
    },
    {
      key: "name",
      label: "Name",
    },
    {
      key: "description",
      label: "Description",
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
            onClick={() => requestDelete(row)}
          >
            Archive
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
          <h2 className="fw-semibold mb-1">Analytic Accounts</h2>
          <p className="text-muted mb-0">
            Manage analytic accounts for tracking business activities and
            expenses.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Analytic Account
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by code, name, or description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <DataTable
            columns={columns}
            data={paginatedAccounts}
            emptyMessage="No analytic accounts found."
          />

          {filteredAccounts.length > PAGE_SIZE && (
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

      <FormModal
        show={showFormModal}
        title={
          formMode === "create"
            ? "Add Analytic Account"
            : "Edit Analytic Account"
        }
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        submitText={formMode === "create" ? "Create" : "Save Changes"}
      >
        {formError && (
          <div className="alert alert-danger py-2">{formError}</div>
        )}

        <div className="mb-3">
          <label className="form-label">Code</label>
          <input
            type="text"
            className="form-control"
            value={formValues.code}
            onChange={(e) =>
              handleFieldChange("code", e.target.value)
            }
            placeholder="e.g. AA005"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            value={formValues.name}
            onChange={(e) =>
              handleFieldChange("name", e.target.value)
            }
            placeholder="Analytic account name"
          />
        </div>

        <div className="mb-1">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows="3"
            value={formValues.description}
            onChange={(e) =>
              handleFieldChange("description", e.target.value)
            }
            placeholder="Optional description"
          />
        </div>
      </FormModal>

      <ConfirmModal
        show={showDeleteConfirm}
        title="Archive Analytic Account"
        message={
          accountToDelete
            ? `Are you sure you want to archive "${accountToDelete.name}"?`
            : "Are you sure you want to archive this analytic account?"
        }
        onClose={closeDeleteConfirm}
        onConfirm={confirmDelete}
        confirmText="Archive"
        variant="danger"
      />
    </>
  );
}

export default AnalyticAccounts;