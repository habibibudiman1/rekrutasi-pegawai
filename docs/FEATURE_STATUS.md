# Status Fitur Website Rekrutasi Pegawai

## ✅ Fitur yang Sudah Berjalan

### HRD
- ✅ Registrasi dan Login
- ✅ Melengkapi data perusahaan dan data diri
- ✅ Melihat dashboard/rekapitulasi lowongan
- ✅ Membuat postingan lowongan baru
- ✅ Mengedit informasi lowongan
- ✅ Melihat listing pelamar
- ✅ Update status kandidat (dasar - perlu diperbaiki)
- ✅ Delete lowongan (outlist)

### Pelamar
- ✅ Registrasi dan Login
- ✅ Melengkapi data diri (dasar)
- ✅ Melihat dashboard/rekapitulasi lowongan yang sudah difollow up
- ✅ Mencari nama pekerjaan dan perusahaan
- ✅ Mengunggah CV (PDF)

## ❌ Fitur yang Belum Ada / Perlu Diperbaiki

### HRD
- ✅ **Status aplikasi** - Sudah diperbaiki sesuai spesifikasi
  - Status: Pending, Lolos Administrasi, Lolos Test Tulis, Lolos Wawancara, Diterima, Ditolak
- ❌ **Melihat kandidat yang memenuhi spesifikasi** (filter berdasarkan kualifikasi)
- ⚠️ **Outlist lowongan** (saat ini hanya delete, perlu fitur nonaktifkan)

### Pelamar
- ❌ **Edit profil lengkap** (nama, alamat, telepon, email)
- ❌ **Deskripsi diri** (tujuan dan motivasi)
- ❌ **Riwayat pendidikan**
- ❌ **Riwayat sertifikasi**
- ❌ **Riwayat pelatihan**
- ❌ **Riwayat magang**
- ❌ **Riwayat keterlibatan organisasi**
- ❌ **Riwayat pengalaman kerja**
- ❌ **Link media sosial profesional** (LinkedIn, portfolio)
- ❌ **Wishlist lowongan pekerjaan**

## 📋 Tabel Database yang Perlu Ditambahkan

1. **user_profiles** - Perlu ditambahkan kolom:
   - `address` (alamat)
   - `bio` (deskripsi diri)
   - `linkedin_url`
   - `portfolio_url`

2. **education_history** - Tabel baru untuk riwayat pendidikan
3. **work_experience** - Tabel baru untuk riwayat pengalaman kerja
4. **certifications** - Tabel baru untuk sertifikasi
5. **trainings** - Tabel baru untuk pelatihan
6. **internships** - Tabel baru untuk magang
7. **organizations** - Tabel baru untuk organisasi
8. **job_wishlist** - Tabel baru untuk wishlist lowongan

## 🔧 Prioritas Perbaikan

### Prioritas Tinggi
1. Perbaiki status aplikasi sesuai spesifikasi
2. Tambah fitur edit profil lengkap
3. Tambah fitur wishlist

### Prioritas Sedang
4. Tambah riwayat pendidikan dan pengalaman kerja
5. Tambah deskripsi diri dan link media sosial
6. Tambah filter kandidat untuk HRD

### Prioritas Rendah
7. Tambah riwayat sertifikasi, pelatihan, magang, organisasi
8. Perbaiki fitur outlist (nonaktifkan tanpa delete)

