import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase.js";

const AuthContext = createContext(null);
const ADMIN_EMAIL = "vargasnatnat10@gmail.com";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    return signOut(auth);
  }

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: isAdmin ? "Admin" : "Teacher",
        isAdmin,
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