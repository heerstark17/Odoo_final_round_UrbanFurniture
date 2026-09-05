import { useEffect, useMemo, useState } from "react";

import DataTable from "../../components/DataTable";
import FormModal from "../../components/FormModal";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import Pagination from "../../components/Pagination";

import {
  getProducts,
  createProduct,
  updateProduct,
  archiveProduct,
} from "../../services/masterDataService";

const PAGE_SIZE = 5;

const PRODUCT_TYPES = [
  { value: "goods", label: "Goods" },
  { value: "service", label: "Service" },
  { value: "combo", label: "Combo" },
];

const EMPTY_FORM = {
  name: "",
  type: "goods",
  category: "",
  sales_price: "",
  cost: "",
};

function productTypeLabel(type) {
  if (type === "goods") return "Goods";
  if (type === "service") return "Service";
  if (type === "combo") return "Combo";
  return type || "-";
}

function typeBadgeClass(type) {
  switch (type) {
    case "goods":
      return "bg-primary";
    case "service":
      return "bg-info text-dark";
    case "combo":
      return "bg-warning text-dark";
    default:
      return "bg-secondary";
  }
}

function validateProduct(values) {
  const errors = {};

  if (!values.name.trim()) {
    errors.name = "Product name is required.";
  }

  if (!values.type) {
    errors.type = "Product type is required.";
  }

  if (!values.category.trim()) {
    errors.category = "Category is required.";
  }

  if (
    values.sales_price === "" ||
    Number.isNaN(Number(values.sales_price)) ||
    Number(values.sales_price) < 0
  ) {
    errors.sales_price = "Enter a valid sales price.";
  }

  if (
    values.cost === "" ||
    Number.isNaN(Number(values.cost)) ||
    Number(values.cost) < 0
  ) {
    errors.cost = "Enter a valid cost.";
  }

  return errors;
}

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [savingForm, setSavingForm] = useState(false);

  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [productToArchive, setProductToArchive] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to load products:", error);
      setLoadError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeProducts = useMemo(() => {
    return products.filter((product) => !product.archived);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return activeProducts.filter((product) => {
      const matchesType =
        typeFilter === "All" || product.type === typeFilter;

      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [activeProducts, searchTerm, typeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage((previousPage) =>
      Math.min(previousPage, totalPages)
    );
  }, [totalPages]);

  function openCreateForm() {
    setFormMode("create");
    setEditingId(null);
    setFormValues(EMPTY_FORM);
    setFormErrors({});
    setShowFormModal(true);
  }

  function openEditForm(product) {
    setFormMode("edit");
    setEditingId(product.id);

    setFormValues({
      name: product.name || "",
      type: product.type || "goods",
      category: product.category || "",
      sales_price: product.sales_price ?? "",
      cost: product.cost ?? "",
    });

    setFormErrors({});
    setShowFormModal(true);
  }

  function closeFormModal() {
    if (savingForm) return;

    setShowFormModal(false);
    setFormErrors({});
  }

  function handleFieldChange(field, value) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    const errors = validateProduct(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const payload = {
      name: formValues.name.trim(),
      type: formValues.type,
      category: formValues.category.trim(),
      sales_price: Number(formValues.sales_price),
      cost: Number(formValues.cost),
    };

    setSavingForm(true);

    try {
      if (formMode === "create") {
        await createProduct(payload);
      } else {
        await updateProduct(editingId, payload);
      }

      await loadProducts();
      setShowFormModal(false);
    } catch (error) {
      console.error("Failed to save product:", error);

      setFormErrors({
        submit: error.response?.data?.message ||
          "Failed to save product. Please try again.",
      });
    } finally {
      setSavingForm(false);
    }
  }

  function requestArchive(product) {
    setProductToArchive(product);
    setShowArchiveConfirm(true);
  }

  function closeArchiveConfirm() {
    if (archiving) return;

    setShowArchiveConfirm(false);
    setProductToArchive(null);
  }

  async function handleConfirmArchive() {
    if (!productToArchive) return;

    setArchiving(true);

    try {
      await archiveProduct(productToArchive.id);

      await loadProducts();

      setShowArchiveConfirm(false);
      setProductToArchive(null);
    } catch (error) {
      console.error("Failed to archive product:", error);
    } finally {
      setArchiving(false);
    }
  }

  const columns = [
    {
      key: "name",
      label: "Product Name",
    },
    {
      key: "type",
      label: "Type",
      render: (value) => (
        <span className={`badge ${typeBadgeClass(value)}`}>
          {productTypeLabel(value)}
        </span>
      ),
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "sales_price",
      label: "Sales Price",
      render: (value) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      key: "cost",
      label: "Cost",
      render: (value) => `₹${Number(value || 0).toFixed(2)}`,
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
            onClick={(event) => {
              event.stopPropagation();
              openEditForm(row);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={(event) => {
              event.stopPropagation();
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
        <div>
          <h2 className="fw-semibold mb-1">Products</h2>
          <p className="text-muted mb-0">
            Manage goods and services used in sales and purchases.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={openCreateForm}
        >
          + Add Product
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-12 col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Search by product name or category..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="col-12 col-md-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Types</option>

                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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
            <LoadingSpinner message="Loading products..." />
          ) : loadError ? (
            <div className="text-center text-danger py-4">
              {loadError}

              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadProducts}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={paginatedProducts}
                loading={false}
                emptyMessage="No products match your search or filter."
              />

              {filteredProducts.length > PAGE_SIZE && (
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
        title={formMode === "create" ? "Add Product" : "Edit Product"}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        submitText={formMode === "create" ? "Create" : "Save Changes"}
        loading={savingForm}
      >
        {formErrors.submit && (
          <div className="alert alert-danger py-2">
            {formErrors.submit}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Product Name</label>

          <input
            type="text"
            className={`form-control ${
              formErrors.name ? "is-invalid" : ""
            }`}
            value={formValues.name}
            onChange={(event) =>
              handleFieldChange("name", event.target.value)
            }
          />

          {formErrors.name && (
            <div className="invalid-feedback">
              {formErrors.name}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Product Type</label>

          <select
            className={`form-select ${
              formErrors.type ? "is-invalid" : ""
            }`}
            value={formValues.type}
            onChange={(event) =>
              handleFieldChange("type", event.target.value)
            }
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {formErrors.type && (
            <div className="invalid-feedback">
              {formErrors.type}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Category</label>

          <input
            type="text"
            className={`form-control ${
              formErrors.category ? "is-invalid" : ""
            }`}
            value={formValues.category}
            onChange={(event) =>
              handleFieldChange("category", event.target.value)
            }
            placeholder="e.g. Office Furniture"
          />

          {formErrors.category && (
            <div className="invalid-feedback">
              {formErrors.category}
            </div>
          )}
        </div>

        <div className="row g-2">
          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">Sales Price</label>

            <input
              type="number"
              min="0"
              step="0.01"
              className={`form-control ${
                formErrors.sales_price ? "is-invalid" : ""
              }`}
              value={formValues.sales_price}
              onChange={(event) =>
                handleFieldChange(
                  "sales_price",
                  event.target.value
                )
              }
            />

            {formErrors.sales_price && (
              <div className="invalid-feedback">
                {formErrors.sales_price}
              </div>
            )}
          </div>

          <div className="col-12 col-md-6 mb-3">
            <label className="form-label">Cost</label>

            <input
              type="number"
              min="0"
              step="0.01"
              className={`form-control ${
                formErrors.cost ? "is-invalid" : ""
              }`}
              value={formValues.cost}
              onChange={(event) =>
                handleFieldChange("cost", event.target.value)
              }
            />

            {formErrors.cost && (
              <div className="invalid-feedback">
                {formErrors.cost}
              </div>
            )}
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        show={showArchiveConfirm}
        title="Archive Product"
        message={
          productToArchive
            ? `Are you sure you want to archive "${productToArchive.name}"?`
            : "Are you sure you want to archive this product?"
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

export default Products;