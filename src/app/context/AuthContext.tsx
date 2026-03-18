import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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
      async (_event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email || "");
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
    await fetchUserProfile(data.user.id, data.user.email || "");
  }

  // 🔹 Fetch detail user dari tabel public.users
  async function fetchUserProfile(authUserId: string, authEmail: string) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", authEmail)
      .single();

    if (error || !data) {
      // Fallback jika belum dibuatkan data manual di tabel users
      setUser({
        user_id: authUserId,
        nama: authEmail.split("@")[0],
        jabatan: "Pengguna Baru",
        role: "GUEST",
        email: authEmail,
        status: "aktif",
      });
    } else {
      // Berhasil fetch role & data asli dari DB
      setUser({
        user_id: data.user_id,
        nama: data.nama,
        jabatan: data.jabatan,
        role: data.role,
        email: data.email,
        status: data.status,
      });
    }
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

    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email || "");
    }

    return true;
  };

  // 🚪 LOGOUT
  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 🔐 PERMISSION
  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    // Disini Anda bisa melimitasi akses, misal:
    // KEPALA_DESA bisa semua, ADMIN bisa sebagian, GUEST tidak bisa
    if (user.role === "KEPALA_DESA" || user.role === "ADMIN") return true;
    
    // Default fallback
    return true;
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