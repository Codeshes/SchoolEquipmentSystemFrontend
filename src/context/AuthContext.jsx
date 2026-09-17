import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser?.email) {
        try {
          // Registers the account on first sign-in and tells us its role.
          const response = await userApi.sync({
            email: currentUser.email,
            fullName: currentUser.displayName ?? currentUser.email,
          });

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
