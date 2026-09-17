import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

import { auth, googleProvider } from "../services/firebase.js";
import { userApi } from "../services/api";

const AuthContext = createContext(null);

// Three tiers of access:
//
//   Master Admin - this one address. Everything, including managing users.
//   Admin        - Role = "Admin" in the database. Requests, equipment and
//                  categories, but NOT user management.
//   Teacher      - everyone else. Browse and submit requests.
//
// The master address is fixed in code on purpose: it cannot be demoted or
// deleted from the Users page, so the system can never lock itself out.
const MASTER_ADMIN_EMAIL = "vargasnatnat10@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [storedRole, setStoredRole] = useState(null);
  const [suspended, setSuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      // Email/password accounts must confirm their address first. Google
      // accounts arrive already verified, so they pass straight through.
      const usesPassword = currentUser?.providerData?.some(
        (provider) => provider.providerId === "password"
      );

      if (currentUser && usesPassword && !currentUser.emailVerified) {
        setUser(null);
        setStoredRole(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      if (currentUser?.email) {
        try {
          // Registers the account on first sign-in and tells us its role.
          const response = await userApi.sync({
            email: currentUser.email,
            fullName: currentUser.displayName ?? currentUser.email,
          });

          // A suspended account is turned away even with valid credentials.
          if (response.data?.isActive === false) {
            await signOut(auth);
            setUser(null);
            setStoredRole(null);
            setSuspended(true);
            setLoading(false);
            return;
          }

          setSuspended(false);
          setStoredRole(response.data?.role ?? null);
        } catch (error) {
          console.error("Could not load your role from the API:", error);
          setStoredRole(null);
        }
      } else {
        setStoredRole(null);
      }

      setLoading(false);
    });
  }, []);

  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  async function loginWithEmail(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      // Send a fresh link, then drop the session so they cannot proceed.
      try {
        await sendEmailVerification(credential.user);
      } catch (sendError) {
        // Firebase rate-limits repeat sends; the message below still applies.
        console.error("Could not resend the verification email:", sendError);
      }

      await signOut(auth);

      const unverified = new Error("Email address is not verified.");
      unverified.code = "app/email-not-verified";
      throw unverified;
    }

    return credential;
  }

  async function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Signs in just long enough to trigger a fresh verification email.
  async function resendVerification(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    await signOut(auth);
  }

  async function registerWithEmail(fullName, email, password) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const name = fullName?.trim();

    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }

    // Register them in our own database so admins can see the account.
    try {
      await userApi.sync({ email, fullName: name || email });
    } catch (error) {
      console.error("Could not register your account with the API:", error);
    }

    await sendEmailVerification(credential.user);

    // No access until the address is confirmed.
    await signOut(auth);

    return { verificationSent: true, email };
  }

  async function logout() {
    return signOut(auth);
  }

  const isMasterAdmin =
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;

  // Master admin is an admin too - it just has extra powers on top.
  const isAdmin = isMasterAdmin || storedRole?.toLowerCase() === "admin";

  const role = isMasterAdmin
    ? "Master Admin"
    : isAdmin
      ? "Admin"
      : "Teacher";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isMasterAdmin,
        masterAdminEmail: MASTER_ADMIN_EMAIL,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resendVerification,
        resetPassword,
        suspended,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
