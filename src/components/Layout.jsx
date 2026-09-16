import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./TopBar";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const titles = {
    "/": "Dashboard",
    "/equipment": "Equipment",
    "/categories": "Categories",
    "/requests": "Borrow Requests",
    "/my-requests": "My Requests",
    "/users": "Users",
    "/settings": "Settings",
  };

  const title = titles[location.pathname] || "SchoolEquip";

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="main-content">
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;