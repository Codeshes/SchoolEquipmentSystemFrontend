import { X } from "lucide-react";

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>

          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default Modal;