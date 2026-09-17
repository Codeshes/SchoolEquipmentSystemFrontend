// Browser storage is shared by everyone who signs in on this computer, so
// anything stored per person has to carry their email in the key. Without
// it, a name saved by one account shows up under the next one.

export function accountKey(base, email) {
  return email ? `${base}:${email.toLowerCase()}` : base;
}

export function readFlag(base, email, fallback = true) {
  try {
    const value = localStorage.getItem(accountKey(base, email));
    if (value === null) return fallback;
    return value !== "false";
  } catch {
    // Private windows can block storage entirely.
    return fallback;
  }
}

export function writeFlag(base, email, enabled) {
  try {
    localStorage.setItem(accountKey(base, email), String(enabled));
  } catch {
    // Nothing to do - the setting just won't survive a refresh.
  }
}

export function notificationsEnabled(email) {
  return readFlag("notifications-enabled", email, true);
}

export function setNotificationsEnabled(email, enabled) {
  writeFlag("notifications-enabled", email, enabled);
}

// Earlier builds wrote the profile name, photo and notification flag under
// one shared key for every account. Clear those out once so a value left
// behind by another account stops following people around.
const LEGACY_KEYS = ["profile-name", "profile-photo", "notifications-enabled"];

export function clearLegacyProfileKeys() {
  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore - nothing was readable anyway.
  }
}
