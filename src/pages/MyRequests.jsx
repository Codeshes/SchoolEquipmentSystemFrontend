import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, Clock, LoaderCircle, X } from "lucide-react";

import GlassCard from "../components/GlassCard";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext.jsx";
import { requestApi } from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  daysOverdue,
  decidedAt,
  formatDateOnly,
  formatDateTime,
  isOverdue,
} from "../utils/datetime";

function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setError("");
      const response = await requestApi.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      const receipts = JSON.parse(
        localStorage.getItem("equipment-receipts") ?? "[]"
      );
      const ownRequests = data.filter((request) => {
        const email =
          request.requesterEmail ??
          request.user?.email ??
          request.requestedByEmail;
        return !email || !user?.email || email === user.email;
      });
      const receiptRequests = receipts
        .filter((receipt) => !user?.email || receipt.requesterEmail === user.email)
        .map((receipt) => ({ ...receipt, isReceipt: true }));
      const existingIds = new Set(
        ownRequests.map((request) => request.requestId ?? request.id)
      );
      setRequests([
        ...ownRequests,
        ...receiptRequests.filter((receipt) => !existingIds.has(receipt.requestId)),
      ]);
    } catch (requestError) {
      console.error("Failed to load requests:", requestError);
      setError("Unable to load your requests right now.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const requestId = pendingCancel?.requestId ?? pendingCancel?.id;
    if (!requestId) return;

    try {
      setCancelling(true);
      setCancelError("");
      await requestApi.cancel(requestId, user?.email ?? "");
      setPendingCancel(null);
      await loadRequests();
    } catch (requestError) {
      console.error("Failed to cancel request:", requestError);
      setCancelError(
        requestError.response?.data?.message ??
          "Unable to cancel this request."
      );
    } finally {
      setCancelling(false);
    }
  }

  function getEquipmentName(request) {
    if (Array.isArray(request.items) && request.items.length > 0) {
      return request.items
        .map((item) => item.equipmentName ?? "Equipment")
        .join(", ");
    }

    return (
      request.equipment?.name ??
      request.equipmentName ??
      request.itemName ??
      "Equipment request"
    );
  }

  function getQuantity(request) {
    if (Array.isArray(request.items) && request.items.length > 0) {
      return request.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
      );
    }

    return request.quantity ?? request.requestedQuantity ?? "-";
  }

  function getDate(request) {
    return formatDateOnly(
      request.createdAt ?? request.requestDate ?? request.date
    );
  }

  function downloadReceipt(receipt) {
    const content = [
      "SCHOOL EQUIPMENT SYSTEM",
      "EQUIPMENT REQUEST RECEIPT",
      "",
      `Receipt: ${receipt.requestId ?? receipt.id}`,
      `Equipment: ${getEquipmentName(receipt)}`,
      `Quantity: ${getQuantity(receipt)}`,
      `Requested by: ${receipt.requesterName ?? user?.email ?? "Teacher"}`,
      `Date: ${getDate(receipt)}`,
      `Status: ${receipt.status ?? "Pending"}`,
      ...(receipt.approvedDate
        ? [`Approved on: ${formatDateTime(receipt.approvedDate)}`]
        : []),
      ...(receipt.returnedDate
        ? [`Returned on: ${formatDateTime(receipt.returnedDate)}`]
        : []),
      ...(receipt.remarks ? [`Remarks: ${receipt.remarks}`] : []),
      "",
      "Please show or print this receipt and present it to the inventory staff manager.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt.requestId ?? receipt.id}-receipt.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Only a request still waiting for a decision can be withdrawn. If none
  // of them can, the column would be a row of blanks - so it isn't drawn.
  function canCancel(request) {
    return (request.status ?? "Pending") === "Pending" && !request.isReceipt;
  }

  const showActions = requests.some(canCancel);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">BORROWING</span>
          <h2>My Requests</h2>
          <p>Track your equipment borrowing requests.</p>
        </div>
      </div>

      <GlassCard>
        {loading ? (
          <div className="empty-state large">
            <LoaderCircle className="spinner" size={38} />
            <p>Loading your requests...</p>
          </div>
        ) : error ? (
          <div className="empty-state large">
            <ClipboardList size={55} />
            <h3>Requests unavailable</h3>
            <p>{error}</p>
            <button className="secondary-button" onClick={loadRequests}>
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state large">
            <ClipboardList size={55} />
            <h3>No requests yet</h3>
            <p>Your submitted equipment requests will appear here.</p>
            <div className="coming-soon">
              <Clock size={17} />
              Request history is ready
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Receipt</th>
                  {showActions && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => {
                  const status = request.status ?? "Pending";
                  const statusClass = status.toLowerCase();

                  return (
                    <tr key={request.requestId ?? request.id ?? index}>
                      <td>{getEquipmentName(request)}</td>
                      <td>{getQuantity(request)}</td>
                      <td>
                        <span className={`status request-${statusClass}`}>
                          {status}
                        </span>
                        {isOverdue(request) && (
                          <span className="status overdue-chip">
                            <AlertTriangle size={11} />
                            {daysOverdue(request)}d overdue
                          </span>
                        )}
                        {decidedAt(request) && (
                          <small className="status-stamp">
                            {formatDateTime(decidedAt(request))}
                          </small>
                        )}
                      </td>
                      <td>{getDate(request)}</td>
                      <td>
                        <button
                          className="receipt-link"
                          onClick={() => setSelectedReceipt(request)}
                        >
                          View receipt
                        </button>
                      </td>
                      {showActions && (
                        <td>
                          {canCancel(request) ? (
                            <button
                              className="secondary-button"
                              onClick={() => {
                                setCancelError("");
                                setPendingCancel(request);
                              }}
                            >
                              <X size={14} />
                              Cancel
                            </button>
                          ) : (
                            <span className="cell-empty">&mdash;</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        title="Cancel this request"
        message="Withdraw this borrow request? It stays in your history as cancelled, and you can submit a new one any time."
        confirmLabel="Cancel request"
        working={cancelling}
        error={cancelError}
        onConfirm={handleCancel}
        onCancel={() => !cancelling && setPendingCancel(null)}
      />

      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Request Receipt"
      >
        <div className="receipt">
          <div className="receipt-icon"><ClipboardList size={22} /></div>
          <p className="eyebrow">EQUIPMENT REQUEST</p>
          <h3>Electronic receipt</h3>
          <div className="receipt-details">
            <span>Receipt number</span><strong>{selectedReceipt?.requestId ?? selectedReceipt?.id}</strong>
            <span>Equipment</span><strong>{getEquipmentName(selectedReceipt ?? {})}</strong>
            <span>Quantity</span><strong>{getQuantity(selectedReceipt ?? {})}</strong>
            <span>Requested</span><strong>{getDate(selectedReceipt ?? {})}</strong>
            <span>Status</span><strong className="pending">{selectedReceipt?.status ?? "Pending"}</strong>
            {selectedReceipt?.approvedDate && (
              <>
                <span>Approved on</span>
                <strong>{formatDateTime(selectedReceipt.approvedDate)}</strong>
              </>
            )}
            {selectedReceipt?.returnedDate && (
              <>
                <span>Returned on</span>
                <strong>{formatDateTime(selectedReceipt.returnedDate)}</strong>
              </>
            )}
            {selectedReceipt?.remarks && (
              <>
                <span>Remarks</span>
                <strong>{selectedReceipt.remarks}</strong>
              </>
            )}
          </div>
          <p className="receipt-note">
            Please show or print this receipt and present it to the inventory
            staff manager.
          </p>
          <button className="primary-button receipt-download" onClick={() => downloadReceipt(selectedReceipt)}>
            Download Receipt
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default MyRequests;