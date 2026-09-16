import { useState } from "react";
import { Globe, LoaderCircle, Package, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
        "auth/popup-blocked": "Allow popups for localhost and try again.",
        "auth/unauthorized-domain": "Add localhost to Firebase authorized domains.",
        "auth/operation-not-allowed": "Enable Google sign-in in Firebase Authentication.",
      };
      setError(messages[loginError.code] ?? "Google sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-glow glow-one"></div>
      <div className="login-glow glow-two"></div>

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
          {loading ? <LoaderCircle className="spinner" size={18} /> : <Globe size={18} />}
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && <p className="form-error login-error">{error}</p>}

        <div className="login-security">
          <ShieldCheck size={16} />
          Secure authentication
        </div>
      </div>
    </div>
  );
}

export default Login;