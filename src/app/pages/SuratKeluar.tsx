import { useState } from "react";
import { suratKeluar as initialData } from "../data/mockData";
import { useAuth } from "../context/AuthContext";
import {
  Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  FileText, Download, Stamp, ChevronDown, X, UploadCloud
} from "lucide-react";
import { toast } from "sonner";

type Surat = typeof initialData[0] & { fileUrl?: string };

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};
const statusLabel: Record<string, string> = {
  pending: "Pending",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const jenisSuratOptions = [
  "Surat Keterangan Domisili",
  "Surat Pengantar SKCK",
  "Surat Keterangan Tidak Mampu",
  "Surat Keterangan Usaha",
  "Surat Rekomendasi",
  "Surat Pernyataan",
  "Surat Keterangan Pindah",
];

export default function SuratKeluar() {
  const { user } = useAuth();
  const [data, setData] = useState<Surat[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Surat | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    jenis_surat: "",
    tanggal: new Date().toISOString().split("T")[0],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file draft melebihi 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDownload = (surat: Surat) => {
    // Generate mock PDF blob for download
    const content = `SURAT KELUAR\n\nNomor: ${surat.nomor_surat}\nJenis: ${surat.jenis_surat}\nTanggal: ${surat.tanggal}\nPembuat: ${surat.pembuat}\nStatus: ${statusLabel[surat.status]}\n${surat.ttd_kades ? `\nTertandatangani Digital: ${surat.tanggal_approve}` : '\nBelum Ditandatangani'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = surat.fileUrl || URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Surat_${surat.nomor_surat.replace(/\//g, "_")}${surat.ttd_kades ? '_Signed' : ''}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (!surat.fileUrl) {
      URL.revokeObjectURL(url);
    }
    toast.success(`Berhasil mengunduh ${surat.ttd_kades ? 'surat resmi bertanda tangan' : 'draft surat'}`);
  };

  const filtered = data.filter(s => {
    const matchSearch =
      s.nomor_surat.toLowerCase().includes(search.toLowerCase()) ||
      s.jenis_surat.toLowerCase().includes(search.toLowerCase()) ||
      s.pembuat.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id: string) => {
    setData(prev =>
      prev.map(s =>
        s.surat_id === id
          ? { ...s, status: "approved", ttd_kades: true, tanggal_approve: new Date().toISOString().split("T")[0] }
          : s
      )
    );
    toast.success("Surat berhasil disetujui dan ditandatangani digital");
    setShowDetail(null);
  };

  const handleReject = (id: string) => {
    setData(prev =>
      prev.map(s => s.surat_id === id ? { ...s, status: "rejected" } : s)
    );
    toast.error("Surat telah ditolak");
    setShowDetail(null);
  };

  const handleCreate = async () => {
    if (!form.jenis_surat || !selectedFile) {
      toast.error("Mohon lengkapi jenis surat dan upload draft");
      return;
    }
    
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const newId = `SK${String(data.length + 1).padStart(3, "0")}`;
    const fileUrl = URL.createObjectURL(selectedFile);
    
    const newSurat: Surat = {
      surat_id: newId,
      nomor_surat: `${String(data.length + 1).padStart(3, "0")}/SK/2026/${new Date().getMonth() + 1}`,
      jenis_surat: form.jenis_surat,
      tanggal: form.tanggal,
      pembuat: user?.nama || "Admin",
      file_draft: selectedFile.name,
      status: "pending",
      ttd_kades: false,
      tanggal_approve: null,
      fileUrl: fileUrl,
    };
    
    setData(prev => [newSurat, ...prev]);
    setUploading(false);
    setShowModal(false);
    setSelectedFile(null);
    setForm({ jenis_surat: "", tanggal: new Date().toISOString().split("T")[0] });
    toast.success("Draft surat baru berhasil dibuat");
  };

  const canApprove = user?.role === "KEPALA_DESA";

  const counts = {
    all: data.length,
    pending: data.filter(s => s.status === "pending").length,
    approved: data.filter(s => s.status === "approved").length,
    rejected: data.filter(s => s.status === "rejected").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-gray-900 font-semibold text-xl">Surat Keluar</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola surat keluar desa dan proses persetujuan</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Surat Baru
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200" },
          { label: "Pending", value: counts.pending, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
          { label: "Disetujui", value: counts.approved, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Ditolak", value: counts.rejected, color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
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
            placeholder="Cari surat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white appearance-none min-w-[150px]"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nomor Surat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis Surat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tanggal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">TTD</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(surat => (
                <tr key={surat.surat_id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-800 font-mono font-medium">{surat.nomor_surat}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{surat.jenis_surat}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{surat.tanggal}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-tight ${statusColor[surat.status]}`}>
                      {statusLabel[surat.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {surat.ttd_kades ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <Stamp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">Digital Signed</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Waiting</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setShowDetail(surat)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canApprove && surat.status === "pending" && (
                        <button
                          onClick={() => handleApprove(surat.surat_id)}
                          className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Setujui"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDownload(surat)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                        title="Unduh Draft"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data surat keluar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-gray-900 font-semibold">Buat Surat Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Jenis Surat</label>
                <select
                  value={form.jenis_surat}
                  onChange={e => setForm(f => ({ ...f, jenis_surat: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50"
                >
                  <option value="">Pilih jenis surat...</option>
                  {jenisSuratOptions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal Pengajuan</label>
                <input
                  type="date"
                  value={form.tanggal}
                  onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Upload Draft Surat (PDF/DOC)</label>
                <div 
                  onClick={() => document.getElementById('draft-upload')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}
                >
                  <input 
                    type="file" 
                    id="draft-upload" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-emerald-900 truncate max-w-full px-4">{selectedFile.name}</p>
                      <p className="text-[10px] text-emerald-500 mt-1 uppercase">Ready to upload</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Klik untuk upload draft</p>
                      <p className="text-[10px] text-gray-400 mt-1">PDF, DOC, DOCX (Maks 10MB)</p>
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
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  "Buat Draft"
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
              <h3 className="text-gray-900 font-semibold">Detail Surat Keluar</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Nomor Surat</p>
                  <p className="text-base font-mono font-bold text-gray-800">{showDetail.nomor_surat}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-tight ${statusColor[showDetail.status]}`}>
                    {statusLabel[showDetail.status]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {[
                  { label: "Jenis Surat", value: showDetail.jenis_surat },
                  { label: "Tanggal", value: showDetail.tanggal },
                  { label: "Pembuat", value: showDetail.pembuat },
                  { label: "File Draft", value: showDetail.file_draft, isFile: true },
                  { label: "Digital TTD", value: showDetail.ttd_kades ? "Terverifikasi" : "Menunggu" },
                  { label: "Tgl Disetujui", value: showDetail.tanggal_approve || "—" },
                ].map(item => (
                  <div key={item.label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-sm font-medium ${item.isFile ? 'text-blue-600' : 'text-gray-800'}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {showDetail.ttd_kades && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <Stamp className="w-10 h-10 text-emerald-600 opacity-20" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Tanda Tangan Digital Sah</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Dokumen ini telah disetujui secara elektronik oleh Kepala Desa pada {showDetail.tanggal_approve}.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
              {canApprove && showDetail.status === "pending" && (
                <>
                  <button
                    onClick={() => handleApprove(showDetail.surat_id)}
                    className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Setujui & TTD
                  </button>
                  <button
                    onClick={() => handleReject(showDetail.surat_id)}
                    className="flex-1 bg-white text-red-600 border border-red-200 rounded-xl py-3 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Tolak
                  </button>
                </>
              )}
              {(showDetail.status !== "pending" || !canApprove) && (
                <>
                  <button 
                    onClick={() => handleDownload(showDetail)}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Dokumen
                  </button>
                  <button onClick={() => setShowDetail(null)} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-white transition-all">
                    Tutup
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}