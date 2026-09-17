import { Fragment, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Clock,
  LoaderCircle,
  X,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import Modal from "../components/Modal";
import { useLocation } from "react-router-dom";

import { requestApi } from "../services/api";
import {
  daysOverdue,
  decidedAt,
  formatDateOnly,
  formatDateTime as formatDate,
  isOverdue,
} from "../utils/datetime";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const location = useLocation();
  const focusedRef = useRef(null);

  useEffect(() => {
    loadRequests();
  }, []);

  // Arriving from a notification: jump straight into that request's details
  // instead of making the admin hunt for the row. The ref keeps it to a
  // single open, so closing the modal doesn't immediately reopen it.
  useEffect(() => {
    const focusId = location.state?.requestId;
    if (!focusId || requests.length === 0) return;
    if (focusedRef.current === focusId) return;

    const match = requests.find(
      (request) => (request.requestId ?? request.id) === focusId
    );

    if (match) {
      focusedRef.current = focusId;
      openDetails(match);
    }
  }, [requests, location.state]);

  async function loadRequests() {
    try {
      setError("");
      const response = await requestApi.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
      setRequests(data);
    } catch (requestError) {
      console.error("Failed to load requests:", requestError);
      setError("Unable to load requests right now.");
    } finally {
      setLoading(false);
    }
  }

  function openDetails(request) {
    setSelected(request);
    setRemarks(request.remarks ?? "");
    setActionError("");
    setRejecting(false);
  }

  function closeDetails() {
    if (working) return;

    setSelected(null);
    setRejecting(false);
  }

  async function runAction(kind) {
    const requestId = selected?.requestId ?? selected?.id;
    if (!requestId) return;

    // A rejection always has to explain itself - the teacher sees this.
    if (kind === "reject" && !remarks.trim()) {
      setActionError("Please give a reason for rejecting this request.");
      return;
    }

    try {
      setWorking(true);
      setActionError("");

      if (kind === "approve") {
        await requestApi.approve(requestId);
      } else if (kind === "reject") {
        await requestApi.reject(requestId, remarks.trim());
      } else {
        await requestApi.return(requestId);
      }

      setSelected(null);
      await loadRequests();
    } catch (requestError) {
      console.error(`Failed to ${kind} request:`, requestError);
      setActionError(
        requestError.response?.data?.message ??
          `Unable to ${kind} this request.`
      );
    } finally {
      setWorking(false);
    }
  }

  function getItems(request) {
    return Array.isArray(request?.items) ? request.items : [];
  }

  function getEquipmentName(request) {
    const items = getItems(request);

    if (items.length > 0) {
      return items.map((item) => item.equipmentName ?? "Equipment").join(", ");
    }

    return (
      request?.equipment?.name ??
      request?.equipmentName ??
      request?.itemName ??
      "Equipment request"
    );
  }

  function getQuantity(request) {
    const items = getItems(request);

    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    }

    return request?.quantity ?? request?.requestedQuantity ?? "-";
  }

  const selectedStatus = (selected?.status ?? "Pending").toLowerCase();

  const statusOf = (request) => request.status ?? "Pending";

  const TABS = [
    "Pending",
    "Approved",
    "Overdue",
    "Returned",
    "Rejected",
    "Cancelled",
    "All",
  ];

  const matchesTab = (request, tab) => {
    if (tab === "All") return true;
    if (tab === "Overdue") return isOverdue(request);
    return statusOf(request) === tab;
  };

  const countFor = (tab) =>
    requests.filter((request) => matchesTab(request, tab)).length;

  const visibleRequests = requests.filter((request) =>
    matchesTab(request, statusFilter)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">BORROWING</span>
          <h2>Borrow Requests</h2>
          <p>Review and manage equipment requests.</p>
        </div>
      </div>

      {!loading && requests.length > 0 && (
        <div className="filter-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${statusFilter === tab ? "active" : ""}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
              <span className="filter-count">{countFor(tab)}</span>
            </button>
          ))}
        </div>
      )}

      <GlassCard>
        {loading ? (
          <div className="empty-state large">
            <LoaderCircle className="spinner" size={38} />
            <p>Loading requests...</p>
          </div>
        ) : error && requests.length === 0 ? (
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
            <h3>No borrow requests</h3>
            <p>New equipment requests will appear here.</p>
            <div className="coming-soon">
              <Clock size={17} />
              Request workflow is ready
            </div>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="empty-state large">
            <ClipboardList size={55} />
            <h3>Nothing {statusFilter.toLowerCase()}</h3>
            <p>No requests currently have this status.</p>
            <button
              className="secondary-button"
              onClick={() => setStatusFilter("All")}
            >
              Show all requests
            </button>
          </div>
        ) : (
          <div className="table-container">
            {error && <p className="form-error">{error}</p>}
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Requester</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((request, index) => {
                  const requestId = request.requestId ?? request.id ?? index;
                  const status = request.status ?? "Pending";

                  return (
                    <tr key={requestId}>
                      <td>{getEquipmentName(request)}</td>
                      <td>{getQuantity(request)}</td>
                      <td>
                        {request.user?.fullName ??
                          request.userName ??
                          request.requesterName ??
                          "-"}
                      </td>
                      <td>{formatDate(request.requestDate)}</td>
                      <td>
                        <span
                          className={`status request-${status.toLowerCase()}`}
                        >
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
                            {formatDate(decidedAt(request))}
                          </small>
                        )}
                      </td>
                      <td>
                        <button
                          className="secondary-button"
                          onClick={() => openDetails(request)}
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal
        isOpen={Boolean(selected)}
        onClose={closeDetails}
        title="Request Details"
      >
        <div className="receipt-details">
          <span>Request number</span>
          <strong>{selected?.requestId ?? selected?.id ?? "-"}</strong>

          <span>Requester</span>
          <strong>{selected?.user?.fullName ?? "-"}</strong>

          <span>Email</span>
          <strong>{selected?.user?.email ?? "-"}</strong>

          <span>Status</span>
          <strong>{selected?.status ?? "Pending"}</strong>

          <span>Requested on</span>
          <strong>{formatDate(selected?.requestDate)}</strong>

          <span>Expected return</span>
          <strong>{formatDateOnly(selected?.expectedReturnDate)}</strong>

          {selected?.approvedDate && (
            <>
              <span>Approved on</span>
              <strong>{formatDate(selected.approvedDate)}</strong>
            </>
          )}

          {selected?.rejectedDate && (
            <>
              <span>Rejected on</span>
              <strong>{formatDate(selected.rejectedDate)}</strong>
            </>
          )}

          {selected?.returnedDate && (
            <>
              <span>Returned on</span>
              <strong>{formatDate(selected.returnedDate)}</strong>
            </>
          )}
        </div>

        <span className="eyebrow">EQUIPMENT REQUESTED</span>
        <div className="receipt-details">
          {getItems(selected).length === 0 ? (
            <>
              <span>No items recorded</span>
              <strong>-</strong>
            </>
          ) : (
            getItems(selected).map((item) => (
              <Fragment key={item.requestItemId ?? item.equipmentId}>
                <span>{item.equipmentName ?? "Equipment"}</span>
                <strong>x{item.quantity}</strong>
              </Fragment>
            ))
          )}
        </div>

        <span className="eyebrow">REASON</span>
        <p>{selected?.reason || "No reason provided."}</p>

        <span className="eyebrow">PURPOSE</span>
        <p>{selected?.purpose || "No purpose provided."}</p>

        {selectedStatus === "pending" && rejecting && (
          <div className="form-group reject-reason">
            <label htmlFor="request-remarks">
              Reason for rejection <span className="required-mark">*</span>
            </label>
            <textarea
              id="request-remarks"
              rows="3"
              autoFocus
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Explain why this is being turned down. The teacher will see this."
            />
          </div>
        )}

        {selectedStatus !== "pending" && selected?.remarks && (
          <>
            <span className="eyebrow">REMARKS</span>
            <p>{selected.remarks}</p>
          </>
        )}

        {actionError && <p className="form-error">{actionError}</p>}

        <div className="modal-actions">
          {rejecting ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setRejecting(false);
                  setActionError("");
                }}
                disabled={working}
              >
                Back
              </button>

              <button
                type="button"
                className="danger-button"
                onClick={() => runAction("reject")}
                disabled={working}
              >
                {working ? (
                  <LoaderCircle className="spinner" size={17} />
                ) : (
                  <X size={17} />
                )}
                Confirm Rejection
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={closeDetails}
                disabled={working}
              >
                Close
              </button>

              {selectedStatus === "pending" && (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setActionError("");
                      setRejecting(true);
                    }}
                    disabled={working}
                  >
                    <X size={17} />
                    Reject
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => runAction("approve")}
                    disabled={working}
                  >
                    {working ? (
                      <LoaderCircle className="spinner" size={17} />
                    ) : (
                      <Check size={17} />
                    )}
                    Approve
                  </button>
                </>
              )}

              {selectedStatus === "approved" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => runAction("return")}
                  disabled={working}
                >
                  {working ? (
                    <LoaderCircle className="spinner" size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  Mark Returned
                </button>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Requests;
