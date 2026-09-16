import { LoaderCircle, TriangleAlert } from "lucide-react";

import Modal from "./Modal";

function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  working = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="confirm-body">
        <div className="confirm-icon">
          <TriangleAlert size={22} />
        </div>

        <p>{message}</p>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={working}
        >
          Cancel
        </button>

        <button
          type="button"
          className="danger-button"
          onClick={onConfirm}
          disabled={working}
        >
          {working && <LoaderCircle className="spinner" size={17} />}
          {working ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
