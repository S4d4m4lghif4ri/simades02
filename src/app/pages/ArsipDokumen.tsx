import { useState } from "react";
import { dokumen as initialDokumen } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, Filter, Archive, Download, Eye, X, FileText, FolderOpen, UploadCloud } from "lucide-react";
import { toast } from "sonner";

type Dokumen = typeof initialDokumen[0] & { fileUrl?: string };

const kategoriOptions = ["Perencanaan", "Keuangan", "Peraturan", "Umum", "Kependudukan", "Pertanahan", "Sosial"];

const kategoriColor: Record<string, string> = {
  Perencanaan: "bg-blue-100 text-blue-700",
  Keuangan: "bg-emerald-100 text-emerald-700",
  Peraturan: "bg-purple-100 text-purple-700",
  Umum: "bg-gray-100 text-gray-600",
  Kependudukan: "bg-amber-100 text-amber-700",
  Pertanahan: "bg-orange-100 text-orange-700",
  Sosial: "bg-rose-100 text-rose-700",
};

const getFileIcon = (file: string) => {
  const f = file.toLowerCase();
  if (f.endsWith(".pdf")) return "PDF";
  if (f.endsWith(".xlsx") || f.endsWith(".xls")) return "XLS";
  if (f.endsWith(".docx") || f.endsWith(".doc")) return "DOC";
  return "FILE";
};

const fileIconColor: Record<string, string> = {
  PDF: "bg-red-50 text-red-600",
  XLS: "bg-emerald-50 text-emerald-700",
  DOC: "bg-blue-50 text-blue-600",
  FILE: "bg-gray-50 text-gray-600",
};

export default function ArsipDokumen() {
  const { user } = useAuth();
  const [data, setData] = useState<Dokumen[]>(initialDokumen);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Dokumen | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nama_dokumen: "",
    kategori: "",
    tanggal: new Date().toISOString().split("T")[0],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Ukuran file melebihi 20MB");
        return;
      }
      setSelectedFile(file);
      if (!form.nama_dokumen) {
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
        setForm(f => ({ ...f, nama_dokumen: nameWithoutExt }));
      }
    }
  };

  const handleDownload = (doc: Dokumen) => {
    if (doc.fileUrl) {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.nama_dokumen + (doc.file.includes(".") ? doc.file.substring(doc.file.lastIndexOf(".")) : ".pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Berhasil mengunduh ${doc.nama_dokumen}`);
    } else {
      toast.info(`Simulasi mengunduh file sistem: ${doc.file}`);
    }
  };

  const handleCreate = async () => {
    if (!form.nama_dokumen || !form.kategori || !selectedFile) {
      toast.error("Mohon isi semua data dan pilih file");
      return;
    }
    
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newId = `DOK${String(data.length + 1).padStart(3, "0")}`;
    const fileUrl = URL.createObjectURL(selectedFile);
    
    const newDoc: Dokumen = {
      dokumen_id: newId,
      nama_dokumen: form.nama_dokumen,
      kategori: form.kategori,
      file: selectedFile.name,
      tanggal: form.tanggal,
      uploader: user?.nama || "Admin",
      fileUrl: fileUrl,
    };
    
    setData(prev => [newDoc, ...prev]);
    setUploading(false);
    setShowModal(false);
    setSelectedFile(null);
    setForm({ nama_dokumen: "", kategori: "", tanggal: new Date().toISOString().split("T")[0] });
    toast.success("Dokumen berhasil diupload");
  };

  const filtered = data.filter(d => {
    const matchSearch =
      d.nama_dokumen.toLowerCase().includes(search.toLowerCase()) ||
      d.uploader.toLowerCase().includes(search.toLowerCase());
    const matchKategori = filterKategori === "all" || d.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  const kategoriCounts = kategoriOptions.reduce((acc, k) => {
    acc[k] = data.filter(d => d.kategori === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl">Arsip Dokumen</h1>
          <p className="text-gray-500 text-sm mt-0.5">Penyimpanan dan manajemen dokumen desa</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Upload Dokumen
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
          <div className="text-2xl font-bold text-emerald-700">{data.length}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total Dokumen</div>
        </div>
        {Object.entries(kategoriCounts).slice(0, 3).map(([k, v]) => (
          <div key={k} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-semibold text-gray-700">{v}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari dokumen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none min-w-[160px]"
          >
            <option value="all">Semua Kategori</option>
            {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <FolderOpen className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-gray-700">Menampilkan {filtered.length} dokumen</span>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map(doc => {
            const fileType = getFileIcon(doc.file);
            return (
              <div
                key={doc.dokumen_id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => setShowDetail(doc)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${fileIconColor[fileType]}`}>
                  <span className="text-[10px] font-bold">{fileType}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nama_dokumen}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{doc.tanggal} · {doc.uploader} · {doc.file}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 hidden sm:inline-flex ${kategoriColor[doc.kategori] || "bg-gray-100 text-gray-600"}`}>
                  {doc.kategori}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setShowDetail(doc); }}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(doc); }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Tidak ada dokumen ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-gray-900 font-semibold">Upload Dokumen Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nama Dokumen</label>
                <input type="text" placeholder="Masukkan nama dokumen" value={form.nama_dokumen}
                  onChange={e => setForm(f => ({ ...f, nama_dokumen: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Kategori</label>
                  <select value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50">
                    <option value="">Pilih...</option>
                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Tanggal</label>
                  <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 ml-1">File Dokumen</label>
                <div 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-emerald-900 truncate max-w-full px-4">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Klik untuk upload dokumen</p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS (Maks 20MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                disabled={uploading}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-white transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleCreate} 
                disabled={uploading}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memproses...
                  </>
                ) : (
                  "Simpan Dokumen"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-gray-900 font-semibold">Detail Dokumen</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-emerald-50/50 rounded-2xl p-5 mb-6 flex items-center gap-4 border border-emerald-100">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${fileIconColor[getFileIcon(showDetail.file)]}`}>
                  <span className="text-sm font-bold">{getFileIcon(showDetail.file)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{showDetail.nama_dokumen}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1 uppercase tracking-tight">{showDetail.kategori}</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: "ID Dokumen", value: showDetail.dokumen_id },
                  { label: "Nama File", value: showDetail.file },
                  { label: "Tanggal Upload", value: showDetail.tanggal },
                  { label: "Diupload Oleh", value: showDetail.uploader },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-1 border-b border-gray-50 pb-3 last:border-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    <span className="text-sm text-gray-800 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => handleDownload(showDetail)}
                  className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh File
                </button>
                <button onClick={() => setShowDetail(null)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-all">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
