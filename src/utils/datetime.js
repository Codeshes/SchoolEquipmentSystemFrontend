// The API stores timestamps with DateTime.UtcNow, but SQL Server hands them
// back to EF with Kind=Unspecified, so they serialise WITHOUT a trailing "Z".
// JavaScript then reads "2026-09-16T04:30:00" as *local* time, which shifts
// every approval time by the timezone offset (8 hours here). Tag anything
// missing an offset as UTC before parsing.
function parseApiDate(value) {
  if (!value) return null;

  const raw =
    typeof value === "string" && !/(Z|[+-]\d{2}:?\d{2})$/.test(value)
      ? `${value}Z`
      : value;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseApiDate(value);
  if (!date) return "-";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateOnly(value) {
  const date = parseApiDate(value);
  return date ? date.toLocaleDateString() : "-";
}

// An approved request whose expected return date has passed.
export function isOverdue(request) {
  if ((request?.status ?? "") !== "Approved") return false;
  if (!request?.expectedReturnDate) return false;

  const due = parseApiDate(request.expectedReturnDate);
  if (!due) return false;

  // Compare whole days so something due today is not flagged this morning.
  const endOfDue = new Date(due);
  endOfDue.setHours(23, 59, 59, 999);

  return Date.now() > endOfDue.getTime();
}

export function daysOverdue(request) {
  if (!isOverdue(request)) return 0;

  const due = parseApiDate(request.expectedReturnDate);
  const diff = Date.now() - due.getTime();

  return Math.max(1, Math.floor(diff / 86400000));
}

// Most recent decision made on a request, if any.
export function decidedAt(request) {
  return (
    request?.returnedDate ??
    request?.approvedDate ??
    request?.rejectedDate ??
    null
  );
}
