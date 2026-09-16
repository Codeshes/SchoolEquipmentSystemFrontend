// Availability is derived from the number on hand, never from the stored
// status string alone - the two can drift when equipment is edited by hand.

export function isOutOfStock(item) {
  return Number(item?.availableQuantity ?? 0) <= 0;
}

// An admin can deliberately mark working stock as "Unavailable"
// (under repair, reserved, and so on), so that is honoured too.
export function isRequestable(item) {
  return (
    !isOutOfStock(item) &&
    (item?.status ?? "").toLowerCase() !== "unavailable"
  );
}

export function stockLabel(item) {
  if (isOutOfStock(item)) return "Out of Stock";
  if ((item?.status ?? "").toLowerCase() === "unavailable") return "Unavailable";
  return "Available";
}

export function stockClass(item) {
  return isRequestable(item) ? "available" : "unavailable";
}
