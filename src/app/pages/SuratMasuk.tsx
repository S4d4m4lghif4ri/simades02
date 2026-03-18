import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { Plus, Search, Filter, Eye, MailOpen, FileText, X, Archive, Download, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Surat = {
  surat_masuk_id: string;
  nomor_surat: string;
  asal_surat: string;
  tanggal_surat: string;
  perihal: string;
  file_surat: string;
  status: string;
  fileUrl?: string;
};

const statusColor: Record<string, string> = {
  baru: "bg-blue-100 text-blue-700 border-blue-200",
  diproses: "bg-amber-100 text-amber-700 border-amber-200",
  selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const statusLabel: Record<string, string> = {
  baru: "Baru",
  diproses: "Diproses",
  selesai: "Selesai",
};

export default function SuratMasuk() {
  const { user } = useAuth();
  const [data, setData] = useState<Surat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Surat | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nomor_surat: "",
    asal_surat: "",
    tanggal_surat: new Date().toISOString().split("T")[0],
    perihal: "",
  });

  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    setLoading(true);
    const { data: dbData, error } = await supabase
      .from("surat_masuk")
      .select("*")
      .order("tanggal_surat", { ascending: false });

    if (error) {
      toast.error("Gagal mengambil data surat masuk: " + error.message);
    } else if (dbData) {
      setData(dbData);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Ukuran file scan melebihi 20MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownload = (surat: Surat) => {
    if (surat.fileUrl) {
      const link = document.createElement("a");
      link.href = surat.fileUrl;
      link.download = `Scan_${surat.nomor_surat.replace(/\//g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Berhasil mengunduh scan ${surat.nomor_surat}`);
    } else {
      toast.info(`Simulasi mengunduh scan sistem: ${surat.file_surat}`);
    }
  };

  const filtered = data.filter(s => {
    const matchSearch =
      s.nomor_surat.toLowerCase().includes(search.toLowerCase()) ||
      s.asal_surat.toLowerCase().includes(search.toLowerCase()) ||
      s.perihal.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.nomor_surat || !form.asal_surat || !form.perihal || !selectedFile) {
      toast.error("Mohon lengkapi data surat dan upload file scan");
      return;
    }
    
    setUploading(true);
    const newId = `SM${String(Date.now()).slice(-6)}`;
    
    const newSurat: Omit<Surat, 'fileUrl'> = {
      surat_masuk_id: newId,
      nomor_surat: form.nomor_surat,
      asal_surat: form.asal_surat,
      tanggal_surat: form.tanggal_surat,
      perihal: form.perihal,
      file_surat: selectedFile.name,
      status: "baru",
    };
    
    const { error } = await supabase.from("surat_masuk").insert([newSurat]);
    
    setUploading(false);
    
    if (error) {
      toast.error("Gagal meregistrasi surat: " + error.message);
      return;
    }

    const fileUrl = URL.createObjectURL(selectedFile);
    setData(prev => [{ ...newSurat, fileUrl } as Surat, ...prev]);
    setShowModal(false);
    setSelectedFile(null);
    setForm({ nomor_surat: "", asal_surat: "", tanggal_surat: new Date().toISOString().split("T")[0], perihal: "" });
    toast.success("Surat masuk berhasil diregistrasi");
  };

  const handleProcess = async (id: string) => {
    const { error } = await supabase.from("surat_masuk").update({ status: "diproses" }).eq("surat_masuk_id", id);
    if (error) {
       toast.error("Gagal update status: " + error.message);
       return;
    }
    setData(prev => prev.map(s => s.surat_masuk_id === id ? { ...s, status: "diproses" } : s));
    toast.info("Status surat diubah menjadi Diproses");
    setShowDetail(null);
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase.from("surat_masuk").update({ status: "selesai" }).eq("surat_masuk_id", id);
    if (error) {
       toast.error("Gagal update status: " + error.message);
       return;
    }
    setData(prev => prev.map(s => s.surat_masuk_id === id ? { ...s, status: "selesai" } : s));
    toast.success("Surat telah diarsipkan");
    setShowDetail(null);
  };

  const counts = {
    all: data.length,
    baru: data.filter(s => s.status === "baru").length,
    diproses: data.filter(s => s.status === "diproses").length,
    selesai: data.filter(s => s.status === "selesai").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl">Surat Masuk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola surat masuk dari instansi luar</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Input Surat Masuk
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
          { label: "Baru", value: counts.baru, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Diproses", value: counts.diproses, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Selesai", value: counts.selesai, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari surat masuk..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none min-w-[150px]"
          >
            <option value="all">Semua Status</option>
            <option value="baru">Baru</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nomor Surat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perihal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Asal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
                    <p className="text-sm">Memuat data dari Supabase...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <MailOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data surat masuk</p>
                  </td>
                </tr>
              ) : (
                filtered.map(surat => (
                <tr key={surat.surat_masuk_id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MailOpen className="w-4 h-4 text-blue-500" />
                      </div>
                      <span className="text-sm text-gray-800 font-mono font-medium">{surat.nomor_surat}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 max-w-[220px] truncate">{surat.perihal}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{surat.asal_surat}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-tight ${statusColor[surat.status]}`}>
                      {statusLabel[surat.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setShowDetail(surat)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(surat)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Unduh Scan"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-gray-900 font-semibold">Input Surat Masuk</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {[
                { label: "Nomor Surat", key: "nomor_surat", type: "text", placeholder: "Contoh: 001/KECAMATAN/2026" },
                { label: "Asal Surat", key: "asal_surat", type: "text", placeholder: "Instansi pengirim" },
                { label: "Perihal", key: "perihal", type: "text", placeholder: "Perihal surat" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal Surat</label>
                <input
                  type="date"
                  value={form.tanggal_surat}
                  onChange={e => setForm(f => ({ ...f, tanggal_surat: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Upload Scan Surat (PDF/JPG)</label>
                <div 
                  onClick={() => document.getElementById('scan-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  <input 
                    type="file" 
                    id="scan-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,image/*"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-900 truncate max-w-full px-4">{selectedFile.name}</p>
                      <p className="text-[10px] text-blue-500 mt-1 uppercase">Ready to register</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Klik untuk upload scan</p>
                      <p className="text-[10px] text-gray-400 mt-1">PDF atau Gambar (Maks 20MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-white transition-all disabled:opacity-50">
                Batal
              </button>
              <button 
                onClick={handleCreate} 
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Input Surat"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-gray-900 font-semibold">Detail Surat Masuk</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-2">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <MailOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Perihal</p>
                  <p className="text-base font-bold text-gray-800 leading-tight">{showDetail.perihal}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-tight ${statusColor[showDetail.status]}`}>
                    {statusLabel[showDetail.status]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "ID Register", value: showDetail.surat_masuk_id },
                  { label: "Nomor Surat", value: showDetail.nomor_surat },
                  { label: "Asal Surat", value: showDetail.asal_surat },
                  { label: "Tanggal Surat", value: showDetail.tanggal_surat },
                  { label: "File Scan", value: showDetail.file_surat, isFile: true },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-sm font-medium ${item.isFile ? 'text-blue-600' : 'text-gray-800'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              <div className="flex-1 flex gap-2">
                {showDetail.status === "baru" && (
                  <button onClick={() => handleProcess(showDetail.surat_masuk_id)} className="flex-1 bg-amber-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-amber-600 transition-all shadow-md shadow-amber-100">
                    Proses
                  </button>
                )}
                {showDetail.status === "diproses" && (
                  <button onClick={() => handleComplete(showDetail.surat_masuk_id)} className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2">
                    <Archive className="w-4 h-4" />
                    Arsipkan
                  </button>
                )}
                <button 
                  onClick={() => handleDownload(showDetail)}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh Scan
                </button>
              </div>
              <button onClick={() => setShowDetail(null)} className="px-6 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-white transition-all">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
