import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Folder,
  Globe,
  LoaderCircle,
  Lock,
  Mail,
  MailCheck,
  Package,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext.jsx";
import { isValidEmail } from "../utils/validation";

// Drifting equipment icons in the backdrop. Purely decorative.
const FLOATERS = [
  { Icon: Package, key: "float-1" },
  { Icon: ClipboardList, key: "float-2" },
  { Icon: Folder, key: "float-3" },
  { Icon: Users, key: "float-4" },
  { Icon: Clock, key: "float-5" },
  { Icon: CheckCircle2, key: "float-6" },
];

const AUTH_MESSAGES = {
  "auth/popup-closed-by-user": "The sign-in window was closed.",
  "auth/popup-blocked": "Allow popups for this site and try again.",
  "auth/unauthorized-domain":
    "This domain is not authorised in Firebase Authentication.",
  "auth/operation-not-allowed":
    "That sign-in method is not enabled in Firebase Authentication.",
  "auth/network-request-failed":
    "Network problem. Check your connection and try again.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account found with that email.",
  "auth/email-already-in-use": "An account already uses that email.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "app/email-not-verified":
    "Please verify your email first. We've just sent you a new link.",
};

function Login() {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resendVerification,
    resetPassword,
    suspended,
    user,
  } = useAuth();

  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verifyPrompt, setVerifyPrompt] = useState(null);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");
  const [resetting, setResetting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const isRegister = mode === "register";

  function describe(authError) {
    return (
      AUTH_MESSAGES[authError.code] ??
      "Something went wrong signing you in. Try again."
    );
  }

  async function handleGoogleLogin() {
    try {
      setGoogleLoading(true);
      setError("");
      setNotice("");
      await loginWithGoogle();
    } catch (loginError) {
      console.error("Google sign-in failed:", loginError);
      setError(describe(loginError));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (isRegister && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        await registerWithEmail(fullName.trim(), email.trim(), password);

        setVerifyPrompt({ email: email.trim(), reason: "registered" });
        setMode("signin");
        setFullName("");
        setConfirmPassword("");
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (authError) {
      console.error("Email sign-in failed:", authError);

      if (authError.code === "app/email-not-verified") {
        setVerifyPrompt({ email: email.trim(), reason: "unverified" });
      } else {
        setError(describe(authError));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setNotice("");

    if (!email.trim()) {
      setError("Enter your email address first, then tap Forgot password.");
      return;
    }

    try {
      setResetting(true);
      await resetPassword(email.trim());
      setNotice(
        `If an account exists for ${email.trim()}, a password reset link is on its way.`
      );
    } catch (resetError) {
      console.error("Password reset failed:", resetError);
      setError(describe(resetError));
    } finally {
      setResetting(false);
    }
  }

  async function handleResend() {
    if (!verifyPrompt?.email || !password) {
      setResendNote(
        "Enter your password on the sign-in form and try again to get a new link."
      );
      return;
    }

    try {
      setResending(true);
      setResendNote("");
      await resendVerification(verifyPrompt.email, password);
      setResendNote("Sent. Check your inbox again in a moment.");
    } catch (resendError) {
      console.error("Could not resend verification:", resendError);
      setResendNote(
        resendError.code === "auth/too-many-requests"
          ? "Too many requests. Wait a few minutes before asking for another."
          : "Could not send another link right now."
      );
    } finally {
      setResending(false);
    }
  }

  function closeVerifyPrompt() {
    setVerifyPrompt(null);
    setResendNote("");
    setPassword("");
  }

  function switchMode() {
    setMode(isRegister ? "signin" : "register");
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
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

      <div className="login-card glass-card" data-mode={mode}>
        <div className="login-logo">
          <Package size={32} />
        </div>

        <span className="eyebrow">SCHOOL EQUIPMENT</span>

        <h1 className="login-swap" key={`title-${mode}`}>
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>

        <p className="login-swap" key={`subtitle-${mode}`}>
          {isRegister
            ? "Register to browse equipment and submit borrowing requests."
            : "Sign in to manage school equipment and borrowing requests."}
        </p>

        <form
          className="login-form login-swap"
          key={`form-${mode}`}
          onSubmit={handleEmailSubmit}
        >
          {isRegister && (
            <div className="login-field">
              <User size={16} />
              <input
                type="text"
                autoComplete="name"
                placeholder="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
          )}

          <div className="login-field">
            <Mail size={16} />
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="login-field">
            <Lock size={16} />
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {isRegister && (
            <div
              className={`login-field ${
                confirmPassword && password !== confirmPassword
                  ? "field-mismatch"
                  : ""
              }`}
            >
              <Lock size={16} />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {confirmPassword && password === confirmPassword && (
                <Check size={15} className="field-ok" />
              )}
            </div>
          )}

          {isRegister && confirmPassword && password !== confirmPassword && (
            <small className="field-hint field-hint-error">
              Passwords don't match yet.
            </small>
          )}

          {!isRegister && (
            <button
              type="button"
              className="login-forgot"
              onClick={handleForgotPassword}
              disabled={resetting || loading}
            >
              {resetting ? "Sending reset link..." : "Forgot password?"}
            </button>
          )}

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={loading || googleLoading}
          >
            {loading && <LoaderCircle className="spinner" size={17} />}
            {loading
              ? isRegister
                ? "Creating account..."
                : "Signing in..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button
          className="microsoft-button google-button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <LoaderCircle className="spinner" size={18} />
          ) : (
            <Globe size={18} />
          )}
          {googleLoading ? "Signing in..." : "Continue with Google"}
        </button>

        {suspended && (
          <p className="form-error login-error">
            This account has been suspended. Contact an administrator.
          </p>
        )}

        {notice && <p className="login-notice">{notice}</p>}

        {error && <p className="form-error login-error">{error}</p>}

        <button
          type="button"
          className="login-switch"
          onClick={switchMode}
          disabled={loading || googleLoading}
        >
          <span className="login-swap" key={`switch-${mode}`}>
            {isRegister
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </span>
        </button>

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
          Secure authentication
        </div>
      </div>

      <footer className="login-footer">
        &copy; {new Date().getFullYear()} School Equipment Management System.
        All rights reserved.
      </footer>

      <Modal
        isOpen={Boolean(verifyPrompt)}
        onClose={closeVerifyPrompt}
        title={
          verifyPrompt?.reason === "registered"
            ? "Account created"
            : "Verify your email"
        }
      >
        <div className="verify-prompt">
          <div className="verify-icon">
            <MailCheck size={27} />
          </div>

          <h3>Check your inbox</h3>

          <p>
            We sent a verification link to{" "}
            <strong>{verifyPrompt?.email}</strong>.
          </p>

          <ol className="verify-steps">
            <li>Open the email from us</li>
            <li>Click the verification link</li>
            <li>Come back here and sign in</li>
          </ol>

          <p className="verify-hint">
            Nothing yet? Check your spam or junk folder - it can take a minute
            to arrive.
          </p>

          {resendNote && <p className="verify-note">{resendNote}</p>}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleResend}
            disabled={resending}
          >
            {resending && <LoaderCircle className="spinner" size={16} />}
            {resending ? "Sending..." : "Resend link"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={closeVerifyPrompt}
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Login;
