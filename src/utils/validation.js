// Shared input rules, so every form rejects the same things with the same
// wording. Lengths mirror the [MaxLength] attributes on the API models - going
// over them would otherwise fail at the database with a 500.

export const LIMITS = {
  equipmentName: 150,
  categoryName: 100,
  description: 500,
  reason: 1000,
  purpose: 1000,
  fullName: 100,
  email: 100,
};

// Today in the user's own timezone, as YYYY-MM-DD. Using toISOString()
// directly would give UTC and could be a day off here (UTC+8).
export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function futureIso(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// ISO date strings sort correctly as plain strings, so no parsing needed.
export function isPastDate(value) {
  return Boolean(value) && value < todayIso();
}

export function isBeyond(value, daysAhead) {
  return Boolean(value) && value > futureIso(daysAhead);
}

export function tooLong(value, limit) {
  return (value ?? "").trim().length > limit;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value ?? "").trim());
}

// Returns an error message, or "" when the value passes.
export function checkText(value, label, limit, { required = true } = {}) {
  const text = (value ?? "").trim();

  if (required && !text) return `${label} is required.`;
  if (text.length > limit) {
    return `${label} must be ${limit} characters or fewer.`;
  }

  return "";
}

export function checkWholeNumber(value, label, { min = 0, max } = {}) {
  const number = Number(value);

  if (value === "" || value === null || Number.isNaN(number)) {
    return `${label} must be a number.`;
  }

  if (!Number.isInteger(number)) return `${label} must be a whole number.`;
  if (number < min) return `${label} cannot be less than ${min}.`;
  if (max !== undefined && number > max) {
    return `${label} cannot be more than ${max}.`;
  }

  return "";
}
