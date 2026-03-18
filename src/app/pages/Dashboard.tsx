import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer } from "recharts";
import { Mail, MailOpen, CheckCircle, Clock, Wallet, Calendar, TrendingUp, TrendingDown, AlertCircle, Loader2 } from "lucide-react";

const formatRupiah = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(v);

export default function Dashboard() {
  const { user } = useAuth();

  const [suratKeluar, setSuratKeluar] = useState<any[]>([]);
  const [suratMasuk, setSuratMasuk] = useState<any[]>([]);
  const [tugas, setTugas] = useState<any[]>([]);
  const [kegiatan, setKegiatan] = useState<any[]>([]);
  const [keuangan, setKeuangan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [sk, sm, tg, kg, ku] = await Promise.all([
        supabase.from('surat_keluar').select('*'),
        supabase.from('surat_masuk').select('*').order('tanggal_surat', { ascending: false }),
        supabase.from('tugas').select('*').order('tanggal_mulai', { ascending: false }),
        supabase.from('kegiatan').select('*'),
        supabase.from('keuangan').select('*')
      ]);
      setSuratKeluar(sk.data || []);
      setSuratMasuk(sm.data || []);
      setTugas(tg.data || []);
      setKegiatan(kg.data || []);
      setKeuangan(ku.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const pendingSurat = suratKeluar.filter(s => s.status === "pending").length;
  const approvedSurat = suratKeluar.filter(s => s.status === "approved").length;
  const activeTasks = tugas.filter(t => t.status === "proses").length;
  const todayActivities = kegiatan.filter(k => k.tanggal === new Date().toISOString().split("T")[0]).length;
  const totalMasuk = keuangan.filter(k => k.jenis === "masuk").reduce((a, b) => a + Number(b.jumlah), 0);
  const totalKeluar = keuangan.filter(k => k.jenis === "keluar").reduce((a, b) => a + Number(b.jumlah), 0);
  const saldo = totalMasuk - totalKeluar;

  const recentSurat = suratMasuk.slice(0, 4);
  const recentTasks = tugas.slice(0, 4);

  const statsCards = [
    { label: "Surat Pending", value: pendingSurat, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", trend: "Menunggu" },
    { label: "Surat Disetujui", value: approvedSurat, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", trend: "Berhasil" },
    { label: "Tugas Aktif", value: activeTasks, icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", trend: `dari ${tugas.length} total` },
    { label: "Kegiatan Hari Ini", value: todayActivities, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", trend: "Jadwal" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    baru: "bg-blue-100 text-blue-700",
    diproses: "bg-amber-100 text-amber-700",
    selesai: "bg-emerald-100 text-emerald-700",
    proses: "bg-blue-100 text-blue-700",
    belum_mulai: "bg-gray-100 text-gray-600",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    approved: "Disetujui",
    rejected: "Ditolak",
    baru: "Baru",
    diproses: "Diproses",
    selesai: "Selesai",
    proses: "Proses",
    belum_mulai: "Belum Mulai",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-gray-900">Selamat Datang, {user?.nama?.split(" ")[0] || "User"}!</h1>
          <p className="text-gray-500 text-sm mt-0.5">Sistem Manajemen Desa Cibiru Hilir</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="text-xs text-emerald-600">Saldo Kas Desa</p>
            <p className="text-emerald-700 text-sm font-bold">{loading ? "..." : formatRupiah(saldo)}</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12 text-emerald-600 gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Memuat data dari Supabase...</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4 shadow-sm`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl text-gray-900 mb-0.5">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-xs text-gray-400 mt-1">{card.trend}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      {!loading && (<div className="grid lg:grid-cols-3 gap-4">
        {/* Task Completion */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Status Tugas & Kegiatan (Bulan Ini)</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
               <div className="text-emerald-700 font-bold text-2xl">{tugas.filter(t=>t.status==='selesai').length}</div>
               <div className="text-emerald-600 text-xs mt-1">Tugas Selesai</div>
            </div>
            <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
               <div className="text-blue-700 font-bold text-2xl">{tugas.filter(t=>t.status==='proses').length}</div>
               <div className="text-blue-600 text-xs mt-1">Sedang Proses</div>
            </div>
            <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
               <div className="text-amber-700 font-bold text-2xl">{tugas.filter(t=>t.status==='belum_mulai').length}</div>
               <div className="text-amber-600 text-xs mt-1">Belum Dimulai</div>
            </div>
          </div>
        </div>
      </div>)}



      {/* Recent Data */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Surat Masuk */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Surat Masuk Terbaru</h3>
            <MailOpen className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentSurat.map(surat => (
              <div key={surat.surat_masuk_id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MailOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm truncate">{surat.perihal}</p>
                  <p className="text-gray-400 text-xs">{surat.asal_surat} • {surat.tanggal_surat}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[surat.status]}`}>
                  {statusLabel[surat.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-800">Tugas Terkini</h3>
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentTasks.map(task => (
              <div key={task.tugas_id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm truncate">{task.nama_tugas}</p>
                  <p className="text-gray-400 text-xs">{task.penerima_tugas} • Deadline: {task.deadline}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
