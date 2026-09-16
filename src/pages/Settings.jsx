import { useState } from "react";
import { Bell, Check, Palette, Save, Shield, User } from "lucide-react";

import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext.jsx";

function Settings() {
  const { user, role } = useAuth();
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("profile-name") ?? user?.displayName ?? ""
  );
  const [photoURL, setPhotoURL] = useState(
    localStorage.getItem("profile-photo") ?? user?.photoURL ?? ""
  );
  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications-enabled") !== "false"
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaved(false);

    try {
      localStorage.setItem("profile-name", displayName.trim() || user.displayName);
      localStorage.setItem("profile-photo", photoURL.trim());
      localStorage.setItem("notifications-enabled", String(notifications));
      setSaved(true);
    } catch (saveError) {
      console.error("Failed to save settings:", saveError);
      setError("Unable to save settings. Please try again.");
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
            <input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="photo-url">Profile picture URL</label>
            <input id="photo-url" type="url" value={photoURL} onChange={(event) => setPhotoURL(event.target.value)} placeholder="https://example.com/photo.jpg" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="settings-section-heading">
            <div className="setting-icon blue"><Palette size={21} /></div>
            <div><h3>Preferences</h3><p>Choose the settings that suit your workflow.</p></div>
          </div>
          <label className="setting-toggle">
            <span><Bell size={18} /><span><strong>Notifications</strong><small>Show request and system notifications</small></span></span>
            <input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />
          </label>
          <div className="account-role"><Shield size={18} /><span><strong>Account role</strong><small>{role} access</small></span></div>
        </GlassCard>

        <div className="settings-actions">
          {error && <p className="form-error">{error}</p>}
          {saved && <span className="save-confirmation"><Check size={16} /> Settings saved</span>}
          <button className="primary-button"><Save size={17} /> Save Changes</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;