import { createBrowserRouter, Navigate } from "react-router";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SuratKeluar from "./pages/SuratKeluar";
import SuratMasuk from "./pages/SuratMasuk";
import Disposisi from "./pages/Disposisi";
import ManajemenTugas from "./pages/ManajemenTugas";
import KegiatanDesa from "./pages/KegiatanDesa";
import KeuanganDesa from "./pages/KeuanganDesa";
import ArsipDokumen from "./pages/ArsipDokumen";
import Laporan from "./pages/Laporan";
import Pengaturan from "./pages/Pengaturan";
import IzinTidakMasuk from "./pages/IzinTidakMasuk";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: <ProtectedRoute />, // 🔥 proteksi
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: () => <Navigate to="dashboard" replace /> },
          { path: "dashboard", Component: Dashboard },
          { path: "surat-keluar", Component: SuratKeluar },
          { path: "surat-masuk", Component: SuratMasuk },
          { path: "disposisi", Component: Disposisi },
          { path: "tugas", Component: ManajemenTugas },
          { path: "kegiatan", Component: KegiatanDesa },
          { path: "keuangan", Component: KeuanganDesa },
          { path: "arsip", Component: ArsipDokumen },
          { path: "laporan", Component: Laporan },
          { path: "pengaturan", Component: Pengaturan },
          { path: "izin", Component: IzinTidakMasuk },
        ],
      },
    ],
  },
]);