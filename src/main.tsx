import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";
import { supabase } from "./lib/supabase";

// Cek inisialisasi Supabase tanpa perlu query ke spesifik tabel
console.log("Supabase Client Initialized:", supabase ? "Berhasil" : "Gagal");

createRoot(document.getElementById("root")!).render(<App />);