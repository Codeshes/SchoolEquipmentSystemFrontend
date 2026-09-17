import { useEffect, useState } from "react";
import {
  Folder,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import { categoryApi } from "../services/api";
import { LIMITS, checkText } from "../utils/validation";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoadError("");
      const response = await categoryApi.getAll();
      setCategories(
        Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? []
      );
    } catch (requestError) {
      console.error("Failed to load categories:", requestError);
      setLoadError("Unable to load categories. Check that the API is running.");
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(category) {
    setEditingId(category.categoryId);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!saving) {
      setIsModalOpen(false);
      setEditingId(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const nameError = checkText(
      form.name,
      "Category name",
      LIMITS.categoryName
    );
    if (nameError) {
      setError(nameError);
      return;
    }

    const descriptionError = checkText(
      form.description,
      "Description",
      LIMITS.description,
      { required: false }
    );
    if (descriptionError) {
      setError(descriptionError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
    };

    try {
      setSaving(true);

      if (editingId) {
        await categoryApi.update(editingId, {
          ...payload,
          categoryId: editingId,
        });
      } else {
        await categoryApi.create(payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      await loadCategories();
    } catch (requestError) {
      console.error("Failed to save category:", requestError);
      setError(
        requestError.response?.data?.message ??
          "Unable to save this category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    try {
      setDeleting(true);
      setDeleteError("");
      await categoryApi.delete(pendingDelete.categoryId);
      setPendingDelete(null);
      await loadCategories();
    } catch (requestError) {
      console.error("Failed to delete category:", requestError);
      setDeleteError(
        requestError.response?.data?.message ??
          "Unable to delete this category."
      );
    } finally {
      setDeleting(false);
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize your school equipment</p>
        </div>

        <button className="primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="glass-card toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card table-card">
        {loading ? (
          <div className="empty-state">
            <LoaderCircle className="spinner" size={34} />
            <span>Loading categories...</span>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <h4>Categories unavailable</h4>
            <p>{loadError}</p>
            <button className="secondary-button" onClick={loadCategories}>
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">
            <Folder size={42} />
            <h4>No categories found</h4>
            <p>Create a category to group your equipment.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Equipment</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.categoryId}>
                  <td>{category.categoryId}</td>
                  <td>{category.name}</td>
                  <td>{category.description}</td>
                  <td>{category.equipmentCount ?? 0}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-button edit"
                        title="Edit category"
                        onClick={() => openEditModal(category)}
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="action-button delete"
                        title="Delete category"
                        onClick={() => {
                          setDeleteError("");
                          setPendingDelete(category);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
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
        onClose={closeModal}
        title={editingId ? "Edit Category" : "Add Category"}
      >
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category-name">Name</label>
            <input
              id="category-name"
              maxLength={LIMITS.categoryName}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Electronics"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="category-description">Description</label>
            <textarea
              id="category-description"
              rows="4"
              maxLength={LIMITS.description}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Describe this category"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={closeModal}
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
                  : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete category"
        message={`Delete "${pendingDelete?.name ?? ""}"? Move or delete the equipment inside it first.`}
        working={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
