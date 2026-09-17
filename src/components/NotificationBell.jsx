import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { requestApi } from "../services/api";
import { accountKey, notificationsEnabled } from "../utils/preferences";

const REFRESH_MS = 60000;

// Keyed per account - one person marking things read must not mark them
// read for the next person who signs in on this computer.
function seenKey(email) {
  return accountKey("seen-notifications", email);
}

function readSeen(email) {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(email)) ?? "[]"));
  } catch {
    return new Set();
  }
}

function saveSeen(email, keys) {
  try {
    localStorage.setItem(seenKey(email), JSON.stringify([...keys]));
  } catch {
    // storage can be unavailable in private windows - ignore
  }
}

function timeAgo(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState(() => readSeen(user?.email));
  const panelRef = useRef(null);

  const muted = !notificationsEnabled(user?.email);

  // Switching accounts loads that account's own read list.
  useEffect(() => {
    setSeen(readSeen(user?.email));
  }, [user?.email]);

  const build = useCallback(
    (requests) => {
      const equipmentOf = (request) =>
        Array.isArray(request.items) && request.items.length > 0
          ? request.items
              .map((item) => item.equipmentName ?? "Equipment")
              .join(", ")
          : "equipment";

      if (isAdmin) {
        return requests
          .filter((request) => (request.status ?? "") === "Pending")
          .map((request) => ({
            key: `${request.requestId}:Pending`,
            requestId: request.requestId,
            title: "New borrow request",
            detail: `${request.user?.fullName ?? "Someone"} requested ${equipmentOf(
              request
            )}`,
            at: request.requestDate,
            to: "/requests",
          }));
      }

      return requests
        .filter((request) => {
          const mine =
            !user?.email ||
            request.user?.email?.toLowerCase() === user.email.toLowerCase();
          return mine && request.status !== "Pending";
        })
        .map((request) => ({
          key: `${request.requestId}:${request.status}`,
          requestId: request.requestId,
          title: `Request ${String(request.status ?? "").toLowerCase()}`,
          detail: `Your request for ${equipmentOf(request)}`,
          at:
            request.returnedDate ??
            request.approvedDate ??
            request.rejectedDate ??
            request.requestDate,
          to: "/my-requests",
        }));
    },
    [isAdmin, user?.email]
  );

  const load = useCallback(async () => {
    try {
      const response = await requestApi.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];

      const built = build(data).sort(
        (a, b) => new Date(b.at ?? 0) - new Date(a.at ?? 0)
      );

      setItems(built.slice(0, 12));
    } catch (error) {
      console.error("Notifications: unable to load requests:", error);
      setItems([]);
    }
  }, [build]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // The Settings toggle turns the badge off. The list is still there for
  // anyone who opens the bell on purpose.
  const unread = muted ? [] : items.filter((item) => !seen.has(item.key));

  function markAll() {
    const next = new Set(seen);
    items.forEach((item) => next.add(item.key));
    setSeen(next);
    saveSeen(user?.email, next);
  }

  function openItem(item) {
    const next = new Set(seen);
    next.add(item.key);
    setSeen(next);
    saveSeen(user?.email, next);
    setOpen(false);
    navigate(item.to, { state: { requestId: item.requestId } });
  }

  return (
    <div className="notification-wrap" ref={panelRef}>
      <button
        className="notification-button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications (${unread.length} unread)`}
      >
        <Bell size={20} />
        {unread.length > 0 && (
          <span className="notification-badge">{unread.length}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-head">
            <strong>Notifications</strong>

            {muted && <span className="notification-muted">Alerts off</span>}

            {unread.length > 0 && (
              <button className="notification-mark" onClick={markAll}>
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="notification-empty">
              <Inbox size={30} />
              <p>Nothing new right now.</p>
            </div>
          ) : (
            <div className="notification-list">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`notification-item ${
                    seen.has(item.key) ? "" : "unread"
                  }`}
                  onClick={() => openItem(item)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <small>{timeAgo(item.at)}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
