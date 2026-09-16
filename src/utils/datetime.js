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

// Most recent decision made on a request, if any.
export function decidedAt(request) {
  return (
    request?.returnedDate ??
    request?.approvedDate ??
    request?.rejectedDate ??
    null
  );
}
