import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Folder,
  Globe,
  LoaderCircle,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Drifting equipment icons in the backdrop. Purely decorative.
const FLOATERS = [
  { Icon: Package, key: "float-1" },
  { Icon: ClipboardList, key: "float-2" },
  { Icon: Folder, key: "float-3" },
  { Icon: Users, key: "float-4" },
  { Icon: Clock, key: "float-5" },
  { Icon: CheckCircle2, key: "float-6" },
];

function Login() {
  const { loginWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle();
    } catch (loginError) {
      console.error("Google sign-in failed:", loginError);
      const messages = {
        "auth/popup-closed-by-user": "The sign-in window was closed.",
        "auth/popup-blocked": "Allow popups for this site and try again.",
        "auth/unauthorized-domain":
          "This domain is not authorised in Firebase Authentication.",
        "auth/operation-not-allowed":
          "Enable Google sign-in in Firebase Authentication.",
        "auth/network-request-failed":
          "Network problem. Check your connection and try again.",
      };
      setError(messages[loginError.code] ?? "Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-grid" aria-hidden="true"></div>

      <div className="login-glow glow-one" aria-hidden="true"></div>
      <div className="login-glow glow-two" aria-hidden="true"></div>
      <div className="login-glow glow-three" aria-hidden="true"></div>

      <div className="login-floaters" aria-hidden="true">
        {FLOATERS.map(({ Icon, key }) => (
          <span className={`login-floater ${key}`} key={key}>
            <Icon size={26} />
          </span>
        ))}
      </div>

      <div className="login-card glass-card">
        <div className="login-logo">
          <Package size={32} />
        </div>

        <span className="eyebrow">SCHOOL EQUIPMENT</span>

        <h1>Welcome back</h1>

        <p>
          Sign in to manage school equipment and borrowing
          requests.
        </p>

        <button
          className="microsoft-button google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="spinner" size={18} />
          ) : (
            <Globe size={18} />
          )}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && <p className="form-error login-error">{error}</p>}

        <div className="login-features">
          <span>
            <Package size={13} />
            Track stock
          </span>
          <span>
            <ClipboardList size={13} />
            Borrow requests
          </span>
          <span>
            <CheckCircle2 size={13} />
            Approvals
          </span>
        </div>

        <div className="login-security">
          <ShieldCheck size={16} />
          Secure Google authentication
        </div>
      </div>
    </div>
  );
}

export default Login;
