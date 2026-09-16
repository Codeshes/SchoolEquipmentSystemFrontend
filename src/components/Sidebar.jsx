import {
  ClipboardList,
  Folder,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();

  const menu = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Equipment", path: "/equipment", icon: Package },
    ...(isAdmin
      ? [
          { name: "Categories", path: "/categories", icon: Folder },
          { name: "Requests", path: "/requests", icon: ClipboardList },
          { name: "Users", path: "/users", icon: Users },
        ]
      : []),
    { name: "My Requests", path: "/my-requests", icon: UserRound },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const initials = user?.displayName?.slice(0, 2).toUpperCase() ?? "US";

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <Package size={25} />
        </div>
        <div>
          <h2>School equipment</h2>
          <span>System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">MENU</div>
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="demo-user">
          <div className="avatar">
            {user?.photoURL ? <img src={user.photoURL} alt="Profile" /> : initials}
          </div>
          <div>
            <strong>{user?.displayName ?? "User"}</strong>
            <small>{user?.email ?? "Signed in with Google"}</small>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;