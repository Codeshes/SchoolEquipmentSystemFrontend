import { useEffect, useState } from "react";

import {
  Package,
  Folder,
  ClipboardList,
  CheckCircle2,
  ArrowUpRight,
  Clock,
} from "lucide-react";

import GlassCard from "../components/GlassCard";
import { useAuth } from "../context/AuthContext.jsx";
import { categoryApi, equipmentApi, requestApi } from "../services/api";
import { isOutOfStock, stockClass, stockLabel } from "../utils/stock";

function Dashboard() {
  const { user, role } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  function describeError(reason) {
    const status = reason?.response?.status;
    const detail = reason?.response?.data?.message;

    if (detail) return detail;
    if (status) return `HTTP ${status}`;
    return reason?.message ?? "network error";
  }

  const loadDashboard = async () => {
    setLoading(true);

    // Loaded independently on purpose: one failing endpoint should not
    // blank out the whole dashboard the way Promise.all did.
    const [equipmentResult, categoryResult, requestResult] =
      await Promise.allSettled([
        equipmentApi.getAll(),
        categoryApi.getAll(),
        requestApi.getAll(),
      ]);

    const failures = [];

    const apply = (result, label, setValue) => {
      if (result.status === "fulfilled") {
        const payload = result.value?.data;
        setValue(Array.isArray(payload) ? payload : payload?.data ?? []);
        return;
      }

      console.error(`Dashboard: failed to load ${label}:`, result.reason);
      failures.push(`${label}: ${describeError(result.reason)}`);
      setValue([]);
    };

    apply(equipmentResult, "Equipment", setEquipment);
    apply(categoryResult, "Categories", setCategories);
    apply(requestResult, "Requests", setRequests);

    setErrors(failures);
    setLoading(false);
  };

  const totalEquipment = equipment.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const availableEquipment = equipment.reduce(
    (sum, item) => sum + (item.availableQuantity || 0),
    0
  );

  const pendingRequests = requests.filter(
    (request) => (request.status ?? "Pending").toLowerCase() === "pending"
  ).length;

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const stats = [
    {
      title: "Total Equipment",
      value: totalEquipment,
      icon: Package,
      color: "purple",
    },
    {
      title: "Available",
      value: availableEquipment,
      icon: CheckCircle2,
      color: "green",
    },
    {
      title: "Categories",
      value: categories.length,
      icon: Folder,
      color: "blue",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      icon: Clock,
      color: "orange",
    },
  ];

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h2>Welcome back, {firstName} &#128075;</h2>
          <p>
            Here's what's happening with your school equipment.
          </p>
        </div>

        <div className="date-card">
          <Clock size={18} />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {errors.length > 0 && (
        <GlassCard>
          <div className="card-heading">
            <div>
              <h3>Some data could not be loaded</h3>
              <p>The figures below are incomplete.</p>
            </div>

            <ClipboardList size={22} />
          </div>

          {errors.map((message) => (
            <p className="form-error" key={message}>
              {message}
            </p>
          ))}

          <button className="secondary-button" onClick={loadDashboard}>
            Try Again
          </button>
        </GlassCard>
      )}

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <GlassCard key={stat.title}>
              <div className="stat-card">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={24} />
                </div>

                <div>
                  <span>{stat.title}</span>
                  <h3>{loading ? "..." : stat.value}</h3>
                </div>

                <ArrowUpRight className="stat-arrow" size={18} />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <GlassCard>
          <div className="card-heading">
            <div>
              <h3>Equipment Overview</h3>
              <p>Recently added equipment</p>
            </div>

            <Package size={22} />
          </div>

          {equipment.length === 0 ? (
            <div className="empty-state">
              <Package size={42} />
              <h4>No equipment yet</h4>
              <p>Add equipment to see it here.</p>
            </div>
          ) : (
            <div className="mini-list">
              {equipment.slice(0, 5).map((item) => (
                <div className="mini-item" key={item.equipmentId}>
                  <div className="mini-icon">
                    <Package size={18} />
                  </div>

                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {isOutOfStock(item)
                        ? "No stock left"
                        : `${item.availableQuantity} available`}
                    </span>
                  </div>

                  <span className={`status ${stockClass(item)}`}>
                    {stockLabel(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <div className="card-heading">
            <div>
              <h3>System Status</h3>
              <p>Current system information</p>
            </div>

            <CheckCircle2 size={22} />
          </div>

          <div className="system-status">
            <div>
              <span>API Server</span>
              <strong className={errors.length > 0 ? "pending" : "online"}>
                {errors.length > 0 ? "Errors" : "Online"}
              </strong>
            </div>

            <div>
              <span>Database</span>
              <strong className={errors.length > 0 ? "pending" : "online"}>
                {errors.length > 0 ? "Check API" : "Connected"}
              </strong>
            </div>

            <div>
              <span>Authentication</span>
              <strong className="online">Google Sign-In</strong>
            </div>

            <div>
              <span>Signed in as</span>
              <strong className="online">{role}</strong>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default Dashboard;
