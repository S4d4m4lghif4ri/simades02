-- TABEL USERS --
CREATE TABLE public.users (
  user_id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  jabatan TEXT,
  role TEXT,
  email TEXT UNIQUE,
  password TEXT,
  status TEXT
);

-- TABEL SURAT KELUAR --
CREATE TABLE public.surat_keluar (
  surat_id TEXT PRIMARY KEY,
  nomor_surat TEXT,
  jenis_surat TEXT,
  tanggal DATE,
  pembuat TEXT,
  file_draft TEXT,
  status TEXT,
  ttd_kades BOOLEAN DEFAULT FALSE,
  tanggal_approve DATE
);

-- TABEL SURAT MASUK --
CREATE TABLE public.surat_masuk (
  surat_masuk_id TEXT PRIMARY KEY,
  nomor_surat TEXT,
  asal_surat TEXT,
  tanggal_surat DATE,
  perihal TEXT,
  file_surat TEXT,
  status TEXT
);

-- TABEL DISPOSISI --
CREATE TABLE public.disposisi (
  disposisi_id TEXT PRIMARY KEY,
  surat_masuk_id TEXT REFERENCES public.surat_masuk(surat_masuk_id),
  dari TEXT,
  kepada TEXT,
  instruksi TEXT,
  tanggal DATE,
  status TEXT
);

-- TABEL TUGAS --
CREATE TABLE public.tugas (
  tugas_id TEXT PRIMARY KEY,
  nama_tugas TEXT NOT NULL,
  deskripsi TEXT,
  pemberi_tugas TEXT,
  penerima_tugas TEXT,
  tanggal_mulai DATE,
  deadline DATE,
  file_referensi TEXT,
  status TEXT
);

-- TABEL KEGIATAN --
CREATE TABLE public.kegiatan (
  kegiatan_id TEXT PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  tanggal DATE,
  waktu TIME,
  pelaksana TEXT,
  peserta TEXT,
  dokumentasi TEXT,
  catatan TEXT
);

-- TABEL KEUANGAN --
CREATE TABLE public.keuangan (
  transaksi_id TEXT PRIMARY KEY,
  tanggal DATE,
  jenis TEXT,
  sumber_dana TEXT,
  jumlah NUMERIC,
  keterangan TEXT,
  bukti TEXT
);

-- TABEL DOKUMEN --
CREATE TABLE public.dokumen (
  dokumen_id TEXT PRIMARY KEY,
  nama_dokumen TEXT,
  kategori TEXT,
  file TEXT,
  tanggal DATE,
  uploader TEXT
);

-- Insert Sample Data (opsional, jika ingin tabel langsung ada datanya) --
INSERT INTO public.users (user_id, nama, jabatan, role, email, password, status) VALUES
('U001', 'Budi Santoso', 'Kepala Desa', 'KEPALA_DESA', 'kades@desa.id', 'kades123', 'aktif'),
('U002', 'Siti Rahayu', 'Sekretaris Desa', 'SEKDES', 'sekdes@desa.id', 'sekdes123', 'aktif'),
('U006', 'Hendra Wijaya', 'Admin Sistem', 'ADMIN', 'admin@desa.id', 'admin123', 'aktif');
