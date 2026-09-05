import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/DataTable";
import FormModal from "../../components/FormModal";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import api from "../../services/api";

const PAGE_SIZE = 5;

const EMPTY_FORM = {
  code: "",
  name: "",
  accountType: "asset",
};

const ACCOUNT_TYPE_OPTIONS = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "capital", label: "Capital" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

const ACCOUNT_TYPE_LABELS = {
  asset: "Asset",
  liability: "Liability",
  capital: "Capital",
  income: "Income",
  expense: "Expense",
};

function typeBadgeClass(type) {
  switch (type) {
    case "asset":
      return "bg-primary";
    case "liability":
      return "bg-warning text-dark";
    case "capital":
      return "bg-secondary";
    case "income":
      return "bg-success";
    case "expense":
      return "bg-danger";
    default:
      return "bg-light text-dark border";
  }
}

function mapAccount(account) {
  return {
    id: account.id,
    code: account.account_code,
    name: account.account_name,
    accountType: account.account_type,
    accountSubtype: account.account_subtype,
    active: account.is_active,
  };
}

function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [accountToArchive, setAccountToArchive] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/chart-of-accounts");

      setAccounts(response.data.map(mapAccount));
    } catch (err) {
      console.error("Failed to load accounts:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load chart of accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return accounts.filter((account) => {
      if (!account.active) return false;

      const matchesType =
        typeFilter === "All" ||
        account.accountType === typeFilter;

      const matchesSearch =
        !term ||
        account.code.toLowerCase().includes(term) ||
        account.name.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [accounts, searchTerm, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAccounts.length / PAGE_SIZE)
  );

  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;

    return filteredAccounts.slice(
      start,
      start + PAGE_SIZE
    );
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
    setEditingId(account.id);

    setFormValues({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
    });

    setFormError("");
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (formSubmitting) return;

    setShowFormModal(false);
    setFormError("");
  }

  function handleFieldChange(field, value) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    const code = formValues.code.trim();
    const name = formValues.name.trim();

    if (!code) {
      setFormError("Account code is required.");
      return;
    }

    if (!name) {
      setFormError("Account name is required.");
      return;
    }

    if (!formValues.accountType) {
      setFormError("Account type is required.");
      return;
    }

    const duplicateCode = accounts.some(
      (account) =>
        account.code.toLowerCase() === code.toLowerCase() &&
        account.id !== editingId &&
        account.active
    );

    if (duplicateCode) {
      setFormError(
        "An account with this code already exists."
      );
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError("");

      const payload = {
        accountCode: code,
        accountName: name,
        accountType: formValues.accountType,
      };

      if (formMode === "create") {
        const response = await api.post(
          "/chart-of-accounts",
          payload
        );

        const newAccount = mapAccount(response.data);

        setAccounts((prev) => [...prev, newAccount]);
      } else {
        const response = await api.put(
          `/chart-of-accounts/${editingId}`,
          payload
        );

        const updatedAccount = mapAccount(response.data);

        setAccounts((prev) =>
          prev.map((account) =>
            account.id === editingId
              ? updatedAccount
              : account
          )
        );
      }

      closeFormModal();
    } catch (err) {
      console.error("Failed to save account:", err);

      setFormError(
        err.response?.data?.message ||
          "Failed to save account."
      );
    } finally {
      setFormSubmitting(false);
    }
  }

  function requestArchive(account) {
    setAccountToArchive(account);
    setShowArchiveConfirm(true);
  }

  function closeArchiveConfirm() {
    setShowArchiveConfirm(false);
    setAccountToArchive(null);
  }

  async function confirmArchive() {
    if (!accountToArchive) return;

    try {
      const response = await api.delete(
        `/chart-of-accounts/${accountToArchive.id}`
      );

      const archivedAccount = mapAccount(
        response.data.account
      );

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === archivedAccount.id
            ? archivedAccount
            : account
        )
      );

      closeArchiveConfirm();
    } catch (err) {
      console.error("Failed to archive account:", err);

      setError(
        err.response?.data?.message ||
          "Failed to archive account."
      );

      closeArchiveConfirm();
    }
  }

  const columns = [
    {
      key: "code",
      label: "Code",
    },
    {
      key: "name",
      label: "Account Name",
    },
    {
      key: "accountType",
      label: "Type",
      render: (value) => (
        <span className={`badge ${typeBadgeClass(value)}`}>
          {ACCOUNT_TYPE_LABELS[value] || value}
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
          <h2 className="fw-semibold mb-1">
            Chart of Accounts
          </h2>

          <p className="text-muted mb-0">
            Manage the accounts used for financial
            transactions and reporting.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Account
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by account code or name..."
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

                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              Loading accounts...
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={paginatedAccounts}
                emptyMessage="No accounts found."
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
            </>
          )}
        </div>
      </div>

      <FormModal
        show={showFormModal}
        title={
          formMode === "create"
            ? "Add Account"
            : "Edit Account"
        }
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        submitText={
          formMode === "create"
            ? "Create"
            : "Save Changes"
        }
      >
        {formError && (
          <div className="alert alert-danger py-2">
            {formError}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">
            Account Code
          </label>

          <input
            type="text"
            className="form-control"
            value={formValues.code}
            onChange={(e) =>
              handleFieldChange(
                "code",
                e.target.value
              )
            }
            placeholder="e.g. 1000"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">
            Account Name
          </label>

          <input
            type="text"
            className="form-control"
            value={formValues.name}
            onChange={(e) =>
              handleFieldChange(
                "name",
                e.target.value
              )
            }
            placeholder="e.g. Cash"
          />
        </div>

        <div className="mb-1">
          <label className="form-label">
            Account Type
          </label>

          <select
            className="form-select"
            value={formValues.accountType}
            onChange={(e) =>
              handleFieldChange(
                "accountType",
                e.target.value
              )
            }
          >
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </FormModal>

      <ConfirmModal
        show={showArchiveConfirm}
        title="Archive Account"
        message={
          accountToArchive
            ? `Are you sure you want to archive "${accountToArchive.name}"?`
            : "Are you sure you want to archive this account?"
        }
        onClose={closeArchiveConfirm}
        onConfirm={confirmArchive}
        confirmText="Archive"
        variant="danger"
      />
    </>
  );
}

export default ChartOfAccounts;