import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  LoaderCircle,
  Palette,
  Save,
  Shield,
  User,
} from "lucide-react";

import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext.jsx";
import {
  clearLegacyProfileKeys,
  notificationsEnabled,
  setNotificationsEnabled,
} from "../utils/preferences";

function Settings() {
  const { user, role, updateDisplayProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? "");
  const [notifications, setNotifications] = useState(() =>
    notificationsEnabled(user?.email)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Older builds kept the name under one shared browser key, so whatever the
  // last person saved showed up for the next. Clear those keys once.
  useEffect(() => {
    clearLegacyProfileKeys();
  }, []);

  // This form belongs to whoever is signed in right now. Re-seeding it when
  // the account changes is what stops one person's name appearing on
  // another person's settings page.
  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setPhotoURL(user?.photoURL ?? "");
    setNotifications(notificationsEnabled(user?.email));
    setSaved(false);
    setError("");
  }, [user?.email]);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const name = displayName.trim();
    const photo = photoURL.trim();

    if (name.length > 80) {
      setError("Display name must be 80 characters or fewer.");
      return;
    }

    if (photo && !/^https?:\/\//i.test(photo)) {
      setError("The picture link must start with http:// or https://");
      return;
    }

    try {
      setSaving(true);

      // Saved on the account itself, not in this browser, so it follows the
      // person to any computer and never leaks to the next account here.
      await updateDisplayProfile({ displayName: name, photoURL: photo });
      setNotificationsEnabled(user?.email, notifications);

      setSaved(true);
    } catch (saveError) {
      console.error("Failed to save settings:", saveError);
      setError("Unable to save your profile right now. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">SYSTEM</span>
          <h2>Settings</h2>
          <p>Manage your profile and application preferences.</p>
        </div>
      </div>

      <form className="settings-layout" onSubmit={handleSave}>
        <GlassCard>
          <div className="settings-section-heading">
            <div className="setting-icon purple"><User size={21} /></div>
            <div><h3>Profile</h3><p>Update how your account appears in the system.</p></div>
          </div>
          <div className="profile-preview">
            {photoURL ? <img src={photoURL} alt="Profile preview" /> : <User size={25} />}
            <div><strong>{displayName || "Your name"}</strong><span>{user?.email}</span></div>
          </div>
          <div className="form-group">
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              maxLength={80}
              value={displayName}
              onChange={(event) => {
                setSaved(false);
                setDisplayName(event.target.value);
              }}
            />
            <small className="field-hint">
              Shown on the sidebar and on every request you submit.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="photo-url">Profile picture URL</label>
            <input
              id="photo-url"
              type="url"
              value={photoURL}
              onChange={(event) => {
                setSaved(false);
                setPhotoURL(event.target.value);
              }}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-section-heading">
            <div className="setting-icon blue"><Palette size={21} /></div>
            <div><h3>Preferences</h3><p>Choose the settings that suit your workflow.</p></div>
          </div>
          <label className="setting-toggle">
            <span><Bell size={18} /><span><strong>Notifications</strong><small>Show request and system notifications</small></span></span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => {
                setSaved(false);
                setNotifications(event.target.checked);
              }}
            />
          </label>
          <div className="account-role"><Shield size={18} /><span><strong>Account role</strong><small>{role} access</small></span></div>
        </GlassCard>

        <div className="settings-actions">
          {error && <p className="form-error">{error}</p>}
          {saved && <span className="save-confirmation"><Check size={16} /> Settings saved</span>}
          <button className="primary-button" disabled={saving}>
            {saving ? <LoaderCircle className="spinner" size={17} /> : <Save size={17} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
