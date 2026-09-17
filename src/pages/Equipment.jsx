import { useEffect, useState } from "react";
import {
  ClipboardList,
  ChevronDown,
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext.jsx";
import { categoryApi, equipmentApi, requestApi } from "../services/api";
import {
  isRequestable,
  stockClass,
  stockLabel,
} from "../utils/stock";

export default function Equipment() {
  const { isAdmin, user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [requestEquipment, setRequestEquipment] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState("1");
  const [requestReason, setRequestReason] = useState("");
  const [requestPurpose, setRequestPurpose] = useState("");
  const [requestReturnDate, setRequestReturnDate] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Available",
    quantity: "1",
    availableQuantity: "1",
    categoryId: "",
  });
  useEffect(() => {
    loadEquipment();
    loadCategories();
  }, []);

  async function loadEquipment() {
    try {
      const response = await equipmentApi.getAll();
      setEquipment(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? []
      );
    } catch (error) {
      console.error("Failed to load equipment:", error);
      setLoadError("Unable to load equipment. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await categoryApi.getAll();
      // Must stay an array: categories.map() below runs on every render,
      // so a non-array payload here blanks the whole page.
      setCategories(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? []
      );
    } catch (requestError) {
      console.error("Failed to load categories:", requestError);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      name: "",
      description: "",
      status: "Available",
      quantity: "1",
      availableQuantity: "1",
      categoryId: categories[0]?.categoryId?.toString() ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.equipmentId);
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
      status: item.status ?? "Available",
      quantity: String(item.quantity ?? 0),
      availableQuantity: String(item.availableQuantity ?? 0),
      categoryId: item.categoryId?.toString() ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeCreateModal() {
    if (!saving) setIsModalOpen(false);
  }

  function updateForm(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const quantity = Number(form.quantity);
    const availableQuantity = Number(form.availableQuantity);

    if (!form.name.trim()) {
      setError("Equipment name is required.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a whole number greater than zero.");
      return;
    }

    if (
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > quantity
    ) {
      setError("Available quantity must be between zero and total quantity.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      quantity,
      availableQuantity,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };

    try {
      setSaving(true);

      if (editingId) {
        // The API recalculates availability from the quantity change itself.
        await equipmentApi.update(editingId, {
          ...payload,
          equipmentId: editingId,
        });
      } else {
        await equipmentApi.create(payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      await loadEquipment();
    } catch (requestError) {
      console.error("Failed to save equipment:", requestError);
      setError(
        requestError.response?.data?.message ??
          "Unable to save this equipment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function openRequestModal(item) {
    if (!isRequestable(item)) return;

    setRequestEquipment(item);
    setRequestQuantity("1");
    setRequestReason("");
    setRequestPurpose("");
    setRequestReturnDate("");
    setRequestError("");
  }

  async function handleRequestSubmit(event) {
    event.preventDefault();
    const quantity = Number(requestQuantity);

    if (!requestEquipment || !Number.isInteger(quantity) || quantity < 1) {
      setRequestError("Enter a valid quantity.");
      return;
    }

    if (quantity > Number(requestEquipment.availableQuantity)) {
      setRequestError("Requested quantity is not available.");
      return;
    }

    if (!requestReason.trim()) {
      setRequestError("Please provide a reason for requesting the equipment.");
      return;
    }

    if (!requestPurpose.trim()) {
      setRequestError("Please provide what the equipment will be used for.");
      return;
    }

    try {
      setRequesting(true);
      const response = await requestApi.create({
        email: user?.email ?? "",
        fullName: user?.displayName ?? "",
        reason: requestReason.trim(),
        purpose: requestPurpose.trim(),
        expectedReturnDate: requestReturnDate || null,
        items: [
          {
            equipmentId: requestEquipment.equipmentId,
            quantity,
          },
        ],
      });
      const receiptId = response.data?.requestId ?? response.data?.id ?? `REQ-${Date.now()}`;
      setRequestEquipment(null);
      setReceipt({
        requestId: receiptId,
        equipmentName: requestEquipment.name,
        quantity,
        requesterName: user?.displayName ?? user?.email ?? "Teacher",
        requesterEmail: user?.email ?? "",
        date: new Date().toLocaleString(),
        status: "Pending",
      });
      const savedReceipts = JSON.parse(
        localStorage.getItem("equipment-receipts") ?? "[]"
      );
      const newReceipt = {
        requestId: receiptId,
        equipmentName: requestEquipment.name,
        quantity,
        requesterName: user?.displayName ?? user?.email ?? "Teacher",
        requesterEmail: user?.email ?? "",
        date: new Date().toISOString(),
        status: "Pending",
      };
      localStorage.setItem(
        "equipment-receipts",
        JSON.stringify([newReceipt, ...savedReceipts])
      );
    } catch (requestSubmitError) {
      console.error("Failed to create request:", requestSubmitError);
      const responseData = requestSubmitError.response?.data;
      const backendMessage =
        responseData?.message ??
        responseData?.title ??
        (typeof responseData === "string" ? responseData : "");
      setRequestError(
        backendMessage ||
          `Unable to submit request (${requestSubmitError.response?.status ?? "network error"}).`
      );
    } finally {
      setRequesting(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await equipmentApi.delete(pendingDelete.equipmentId);
      setPendingDelete(null);
      await loadEquipment();
    } catch (requestError) {
      console.error("Failed to delete equipment:", requestError);
      setDeleteError(
        requestError.response?.data?.message ??
          "Unable to delete this equipment."
      );
    } finally {
      setDeleting(false);
    }
  }

  function downloadReceipt() {
    if (!receipt) return;

    const content = [
      "SCHOOL EQUIPMENT SYSTEM",
      "EQUIPMENT REQUEST RECEIPT",
      "",
      `Receipt: ${receipt.requestId}`,
      `Equipment: ${receipt.equipmentName}`,
      `Quantity: ${receipt.quantity}`,
      `Requested by: ${receipt.requesterName}`,
      `Date: ${receipt.date}`,
      `Status: ${receipt.status ?? "Pending"}`,
      "",
      "Please show or print this receipt and present it to the inventory staff manager.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.requestId}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const countInCategory = (categoryId) =>
    categoryId === "all"
      ? equipment.length
      : equipment.filter((item) => item.categoryId === categoryId).length;

  // Out-of-stock items stay visible (clearly marked) instead of silently
  // disappearing from the teacher's list.
  const filteredEquipment = equipment.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) &&
      (categoryFilter === "all" || item.categoryId === categoryFilter)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Equipment</h1>
          <p>{isAdmin ? "Manage school equipment" : "Browse available equipment"}</p>
        </div>

        {isAdmin && (
          <button className="primary-button" onClick={openCreateModal}>
            <Plus size={18} />
            Add Equipment
          </button>
        )}
      </div>

      <div className="glass-card toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="filter-tabs">
          <button
            className={`filter-tab ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All equipment
            <span className="filter-count">{countInCategory("all")}</span>
          </button>

          {categories.map((category) => (
            <button
              key={category.categoryId}
              className={`filter-tab ${
                categoryFilter === category.categoryId ? "active" : ""
              }`}
              onClick={() => setCategoryFilter(category.categoryId)}
            >
              {category.name}
              <span className="filter-count">
                {countInCategory(category.categoryId)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="glass-card table-card">
        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spinner" size={34} />
            <span>Loading equipment...</span>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <h4>Equipment unavailable</h4>
            <p>{loadError}</p>
            <button className="secondary-button" onClick={loadEquipment}>
              Try Again
            </button>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="empty-state">
            No equipment found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Available</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEquipment.map((item) => (
                <tr key={item.equipmentId}>
                  <td>{item.equipmentId}</td>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>
                    <span className={`status ${stockClass(item)}`}>
                      {stockLabel(item)}
                    </span>
                  </td>
                  <td>{item.quantity}</td>
                  <td>{item.availableQuantity}</td>
                  <td>{item.categoryName ?? item.category?.name ?? "-"}</td>
                  <td>
                    <div className="table-actions">
                      {isAdmin ? (
                        <>
                        <button
                          className="action-button edit"
                          title="Edit equipment"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="action-button delete"
                          title="Delete equipment"
                          onClick={() => {
                            setDeleteError("");
                            setPendingDelete(item);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                        </>
                      ) : (
                        <button
                          className="secondary-button table-request-button"
                          disabled={!isRequestable(item)}
                          title={
                            isRequestable(item)
                              ? "Request this equipment"
                              : "This equipment has no stock available"
                          }
                          onClick={() => openRequestModal(item)}
                        >
                          <ClipboardList size={15} />
                          {isRequestable(item) ? "Request" : "No Stock"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title={editingId ? "Edit Equipment" : "Add Equipment"}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="equipment-name">Name</label>
            <input
              id="equipment-name"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="e.g. Projector"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="equipment-description">Description</label>
            <textarea
              id="equipment-description"
              rows="3"
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Describe this equipment"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="equipment-quantity">Quantity</label>
              <input
                id="equipment-quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  updateForm("quantity", event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="equipment-available">Available</label>
              <input
                id="equipment-available"
                type="number"
                min="0"
                value={form.availableQuantity}
                onChange={(event) =>
                  updateForm("availableQuantity", event.target.value)
                }
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="equipment-status">Status</label>
              <div className="select-wrap">
                <select
                  id="equipment-status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value)
                  }
                >
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="equipment-category">Category</label>
              <div className="select-wrap">
                <select
                  id="equipment-category"
                  value={form.categoryId}
                  onChange={(event) =>
                    updateForm("categoryId", event.target.value)
                  }
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={closeCreateModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving && <LoaderCircle className="spinner" size={17} />}
              {saving
                ? "Saving..."
                : editingId
                  ? "Save Changes"
                  : "Create Equipment"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(requestEquipment)}
        onClose={() => !requesting && setRequestEquipment(null)}
        title="Request Equipment"
      >
        <form className="form" onSubmit={handleRequestSubmit}>
          <p className="request-summary">
            Requesting <strong>{requestEquipment?.name}</strong>. Available:
            {" "}{requestEquipment?.availableQuantity ?? 0}
          </p>
          <div className="form-group">
            <label htmlFor="request-quantity">Quantity</label>
            <input
              id="request-quantity"
              type="number"
              min="1"
              max={requestEquipment?.availableQuantity ?? 1}
              value={requestQuantity}
              onChange={(event) => setRequestQuantity(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="request-reason">Reason</label>
            <textarea
              id="request-reason"
              rows="2"
              value={requestReason}
              onChange={(event) => setRequestReason(event.target.value)}
              placeholder="Why do you need this equipment?"
            />
          </div>
          <div className="form-group">
            <label htmlFor="request-purpose">Purpose</label>
            <textarea
              id="request-purpose"
              rows="2"
              value={requestPurpose}
              onChange={(event) => setRequestPurpose(event.target.value)}
              placeholder="What will it be used for?"
            />
          </div>
          <div className="form-group">
            <label htmlFor="request-return-date">Expected return date (optional)</label>
            <input
              id="request-return-date"
              type="date"
              value={requestReturnDate}
              onChange={(event) => setRequestReturnDate(event.target.value)}
            />
          </div>
          {requestError && <p className="form-error">{requestError}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setRequestEquipment(null)}
              disabled={requesting}
            >
              Cancel
            </button>
            <button className="primary-button" disabled={requesting}>
              {requesting && <LoaderCircle className="spinner" size={17} />}
              {requesting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="Request Receipt"
      >
        <div className="receipt">
          <div className="receipt-icon"><ClipboardList size={22} /></div>
          <p className="eyebrow">REQUEST SUBMITTED</p>
          <h3>Electronic receipt</h3>
          <div className="receipt-details">
            <span>Receipt number</span><strong>{receipt?.requestId}</strong>
            <span>Equipment</span><strong>{receipt?.equipmentName}</strong>
            <span>Quantity</span><strong>{receipt?.quantity}</strong>
            <span>Requested by</span><strong>{receipt?.requesterName}</strong>
            <span>Date</span><strong>{receipt?.date}</strong>
            <span>Status</span><strong className="pending">Pending</strong>
          </div>
          <p className="receipt-note">
            Please show or print this receipt and present it to the inventory
            staff manager.
          </p>
          <button className="primary-button receipt-download" onClick={downloadReceipt}>
            <Download size={17} /> Download Receipt
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete equipment"
        message={`Delete "${pendingDelete?.name ?? ""}"? This cannot be undone. Equipment that is part of a pending or approved request cannot be deleted.`}
        working={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}