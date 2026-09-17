import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
} from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Categories from "./pages/Categories";
import Requests from "./pages/Requests";
import MyRequests from "./pages/MyRequests";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="auth-loading">Checking your account...</div>;
  }

  return user ? <Layout /> : <Login />;
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

// User management belongs to the master admin alone.
function MasterAdminRoute({ children }) {
  const { isMasterAdmin } = useAuth();
  return isMasterAdmin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route
            path="/categories"
            element={<AdminRoute><Categories /></AdminRoute>}
          />
          <Route
            path="/requests"
            element={<AdminRoute><Requests /></AdminRoute>}
          />
          <Route
            path="/my-requests"
            element={<MyRequests />}
          />
          <Route
            path="/users"
            element={<MasterAdminRoute><Users /></MasterAdminRoute>}
          />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;