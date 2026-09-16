import { Menu } from "lucide-react";

import NotificationBell from "./NotificationBell";
import { useAuth } from "../context/AuthContext.jsx";

function Topbar({ title, onMenuClick }) {
  const { user, role } = useAuth();

  const initials =
    user?.displayName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "US";

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div>
        <h1>{title}</h1>
        <p>School Equipment Management System</p>
      </div>

      <div className="topbar-actions">
        <span className="role-pill">{role}</span>

        <NotificationBell />

        <div className="top-avatar">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
