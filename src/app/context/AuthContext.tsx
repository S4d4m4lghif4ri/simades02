import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../../api";

interface User {
  user_id: string;
  nama: string;
  jabatan: string;
  role: string;
  email: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // 🔄 cek session saat pertama load
  useEffect(() => {
  getSession().finally(() => setInitializing(false));

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        setUser({
          user_id: session.user.id,
          nama: session.user.email || "",
          jabatan: "",
          role: "admin",
          email: session.user.email || "",
          status: "aktif",
        });
      } else {
        setUser(null);
      }

      setInitializing(false);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

 async function getSession() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return;

  setUser({
    user_id: data.user.id,
    nama: data.user.email || "",
    jabatan: "",
    role: "admin",
    email: data.user.email || "",
    status: "aktif",
  });
}

  // 🔐 LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      return false;
    }

    setUser({
      user_id: data.user.id,
      nama: data.user.email || "",
      jabatan: "",
      role: "admin",
      email: data.user.email || "",
      status: "aktif",
    });

    return true;
  };

  // 🚪 LOGOUT
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 🔐 PERMISSION (sementara default true)
  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    return true; // nanti bisa dikembangkan pakai role dari database
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}