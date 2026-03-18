import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Calendar, FileText, Send, X, Upload, Camera, Check } from "lucide-react";
import { toast } from "sonner";

type Izin = {
  id: string;
  tanggal_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jenis_izin: string;
  keterangan: string;
  lampiran?: string;
  lampiranUrl?: string;
  status: "pending" | "approved" | "rejected";
  disetujui_oleh?: string;
  tanggal_approve?: string;
};

const jenisIzinOptions = [
  "Sakit",
  "Cuti",
  "Keperluan Keluarga",
  "Keperluan Pribadi",
  "Dinas Luar",
  "Lainnya",
];

export default function IzinTidakMasuk() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedLampiran, setSelectedLampiran] = useState<File | null>(null);
  const [previewLampiran, setPreviewLampiran] = useState<string | null>(null);
  const [uploadMethod, setUploadMethod] = useState<"file" | "camera" | null>(null);
  const [riwayat, setRiwayat] = useState<Izin[]>([
    {
      id: "IZ001",
      tanggal_pengajuan: "2026-03-10",
      tanggal_mulai: "2026-03-11",
      tanggal_selesai: "2026-03-12",
      jenis_izin: "Sakit",
      keterangan: "Demam tinggi",
      lampiran: "surat_dokter.pdf",
      status: "approved",
      disetujui_oleh: "Kepala Desa",
      tanggal_approve: "2026-03-10",
    },
    {
      id: "IZ002",
      tanggal_pengajuan: "2026-03-05",
      tanggal_mulai: "2026-03-06",
      tanggal_selesai: "2026-03-06",
      jenis_izin: "Keperluan Keluarga",
      keterangan: "Menghadiri pernikahan saudara",
      status: "approved",
      disetujui_oleh: "Kepala Desa",
      tanggal_approve: "2026-03-05",
    },
  ]);

  const [form, setForm] = useState({
    tanggal_mulai: new Date().toISOString().split("T")[0],
    tanggal_selesai: new Date().toISOString().split("T")[0],
    jenis_izin: "",
    keterangan: "",
  });

  // Cek apakah user adalah Kepala Desa (tidak boleh mengajukan izin)
  const canRequest = user?.role !== "KEPALA_DESA";

  const handleLampiranFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Hanya file gambar atau PDF yang diperbolehkan");
        return;
      }
      setSelectedLampiran(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewLampiran(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewLampiran(null);
      }
      setUploadMethod("file");
      toast.success("File lampiran berhasil dipilih");
    }
  };

  const handleLampiranCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setSelectedLampiran(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewLampiran(reader.result as string);
      reader.readAsDataURL(file);
      setUploadMethod("camera");
      toast.success("Foto lampiran berhasil diambil");
    }
  };

  const handleSubmit = () => {
    if (!form.jenis_izin || !form.keterangan) {
      toast.error("Mohon lengkapi jenis izin dan keterangan");
      return;
    }

    const newId = `IZ${String(riwayat.length + 1).padStart(3, "0")}`;
    const newIzin: Izin = {
      id: newId,
      tanggal_pengajuan: new Date().toISOString().split("T")[0],
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.tanggal_selesai,
      jenis_izin: form.jenis_izin,
      keterangan: form.keterangan,
      lampiran: selectedLampiran ? selectedLampiran.name : undefined,
      lampiranUrl: previewLampiran || undefined,
      status: "pending",
    };

    setRiwayat((prev) => [newIzin, ...prev]);
    setShowForm(false);
    setForm({
      tanggal_mulai: new Date().toISOString().split("T")[0],
      tanggal_selesai: new Date().toISOString().split("T")[0],
      jenis_izin: "",
      keterangan: "",
    });
    setSelectedLampiran(null);
    setPreviewLampiran(null);
    setUploadMethod(null);
    toast.success("Permohonan izin berhasil diajukan!");
  };

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const statusLabel: Record<string, string> = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  if (!canRequest) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-gray-800 mb-2">Tidak Tersedia</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Kepala Desa tidak dapat mengajukan permohonan izin melalui sistem ini.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-gray-900">Form Izin Tidak Masuk Kerja</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Ajukan permohonan izin tidak masuk kerja
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm"
        >
          <FileText className="w-4 h-4" />
          Ajukan Izin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Total Izin</p>
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-2xl text-gray-800">{riwayat.length}</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Menunggu</p>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl text-amber-700">
            {riwayat.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Disetujui</p>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl text-emerald-700">
            {riwayat.filter((r) => r.status === "approved").length}
          </p>
        </div>
      </div>

      {/* Riwayat Izin */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-800">Riwayat Permohonan Izin</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {riwayat.map((izin) => (
            <div key={izin.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold text-gray-400">
                      {izin.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-tight ${
                        statusColor[izin.status]
                      }`}
                    >
                      {statusLabel[izin.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mb-1">{izin.jenis_izin}</p>
                  <p className="text-xs text-gray-500 mb-2">{izin.keterangan}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {izin.tanggal_mulai}
                      {izin.tanggal_mulai !== izin.tanggal_selesai &&
                        ` - ${izin.tanggal_selesai}`}
                    </span>
                    <span>Diajukan: {izin.tanggal_pengajuan}</span>
                    {izin.lampiran && (
                      <span className="text-blue-600">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {izin.lampiran}
                      </span>
                    )}
                  </div>
                  {izin.status === "approved" && izin.disetujui_oleh && (
                    <div className="mt-2 text-xs text-emerald-600">
                      <Check className="w-3 h-3 inline mr-1" />
                      Disetujui oleh {izin.disetujui_oleh} pada {izin.tanggal_approve}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {riwayat.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada riwayat permohonan izin</p>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-gray-900">Ajukan Izin Tidak Masuk</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedLampiran(null);
                  setPreviewLampiran(null);
                  setUploadMethod(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Jenis Izin <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.jenis_izin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jenis_izin: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih jenis izin...</option>
                  {jenisIzinOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_mulai}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_selesai}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))
                    }
                    min={form.tanggal_mulai}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Keterangan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keterangan: e.target.value }))
                  }
                  placeholder="Jelaskan alasan izin Anda..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5">
                  Upload Lampiran (Opsional)
                </label>
                {!selectedLampiran ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        id="lampiran-file-upload"
                        className="hidden"
                        onChange={handleLampiranFileChange}
                        accept="image/*,application/pdf"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("lampiran-file-upload")?.click()
                        }
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-300 transition-colors"
                      >
                        <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600">File</p>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="lampiran-camera-capture"
                        className="hidden"
                        onChange={handleLampiranCameraCapture}
                        accept="image/*"
                        capture="environment"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("lampiran-camera-capture")?.click()
                        }
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-emerald-300 transition-colors"
                      >
                        <Camera className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600">Kamera</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-emerald-500 bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {uploadMethod === "camera" ? (
                          <Camera className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Upload className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">
                          {selectedLampiran.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {(selectedLampiran.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLampiran(null);
                          setPreviewLampiran(null);
                          setUploadMethod(null);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {previewLampiran && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={previewLampiran}
                          alt="Preview"
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedLampiran(null);
                  setPreviewLampiran(null);
                  setUploadMethod(null);
                }}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-white"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Ajukan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
