# 🎯 Aplikasi Rekrutasi Pegawai

Platform rekrutasi terpercaya yang menghubungkan perusahaan (HRD) dengan talenta terbaik (Pelamar). Aplikasi ini memungkinkan HRD untuk memposting lowongan pekerjaan dan mengelola aplikasi pelamar, sementara pelamar dapat mencari dan melamar pekerjaan yang sesuai.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Prerequisites](#-prerequisites)
- [Setup Awal](#-setup-awal)
  - [1. Setup Supabase](#1-setup-supabase)
  - [2. Clone Repository](#2-clone-repository)
  - [3. Setup Database](#3-setup-database)
  - [4. Setup Storage](#4-setup-storage)
  - [5. Konfigurasi Frontend](#5-konfigurasi-frontend)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Push ke GitHub](#-push-ke-github)
- [Struktur Project](#-struktur-project)
- [Troubleshooting](#-troubleshooting)
- [Kontributor](#-kontributor)

## ✨ Fitur Utama

### Untuk Pelamar
- ✅ Pencarian lowongan pekerjaan
- ✅ Melamar pekerjaan dengan upload CV dan Cover Letter
- ✅ Dashboard untuk melihat status lamaran
- ✅ Kelola profil lengkap (jabatan, pendidikan, lisensi)
- ✅ Rekomendasi pekerjaan berdasarkan profil

### Untuk HRD
- ✅ Posting lowongan pekerjaan
- ✅ Melihat dan mengelola aplikasi pelamar
- ✅ Update status lamaran (pending, reviewed, accepted, rejected)
- ✅ Melihat profil lengkap pelamar
- ✅ Dashboard untuk monitoring

## 🛠️ Teknologi yang Digunakan

- **Frontend:**
  - HTML5, CSS3, JavaScript (Vanilla)
  - Bootstrap 5.3.0
  - Bootstrap Icons

- **Backend & Database:**
  - Supabase (PostgreSQL, Authentication, Storage)
  - Row Level Security (RLS) untuk keamanan data

- **Tools:**
  - Git untuk version control
  - Supabase Dashboard untuk manajemen database

## 📦 Prerequisites

Sebelum memulai, pastikan Anda sudah memiliki:

1. **Akun Supabase** (gratis di [supabase.com](https://supabase.com))
2. **Git** terinstall di komputer
3. **Web Browser** modern (Chrome, Firefox, Edge)
4. **Text Editor** atau IDE (VS Code recommended)
5. **Web Server** lokal (opsional, bisa langsung buka file HTML)

## 🚀 Setup Awal

### 1. Setup Supabase

#### 1.1 Buat Project Supabase
1. Buka [supabase.com](https://supabase.com)
2. Login atau daftar akun baru
3. Klik **"New Project"**
4. Isi informasi project:
   - **Name:** Rekrutasi-Pegawai (atau nama lain)
   - **Database Password:** Buat password yang kuat (simpan dengan aman!)
   - **Region:** Pilih region terdekat
5. Klik **"Create new project"**
6. Tunggu hingga project selesai dibuat (sekitar 2-3 menit)

#### 1.2 Dapatkan API Keys
1. Di Supabase Dashboard, klik **Settings** (ikon gear) → **API**
2. Catat informasi berikut:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Simpan kedua informasi ini, akan digunakan untuk konfigurasi frontend

### 2. Clone Repository

```bash
# Clone repository ke komputer Anda
git clone <URL_REPOSITORY>
cd Rekrutasi-Pegawai
```

### 3. Setup Database

#### 3.1 Jalankan Schema Database
1. Buka Supabase Dashboard → **SQL Editor**
2. Klik **"New Query"**
3. Buka file `database/schema.sql` di project Anda
4. Copy **SEMUA** isi file (Ctrl+A, Ctrl+C)
5. Paste ke SQL Editor di Supabase
6. Klik **RUN** (atau Ctrl+Enter)
7. Pastikan tidak ada error (harus muncul "Success. No rows returned")

#### 3.2 Setup Tabel Profile
1. Masih di SQL Editor, buka file `database/ENSURE_PROFILE_TABLES.sql`
2. Copy seluruh isi file
3. Paste ke SQL Editor
4. Klik **RUN**
5. Pastikan tidak ada error

#### 3.3 Verifikasi Database
Jalankan query berikut untuk memverifikasi:

```sql
-- Cek tabel yang sudah dibuat
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Harus ada tabel:
-- - user_profiles
-- - jobs
-- - applications
-- - career_history
-- - education
-- - licenses
```

### 4. Setup Storage

#### 4.1 Buat Storage Bucket
1. Di Supabase Dashboard, klik **Storage**
2. Klik **"Create a new bucket"**
3. Isi informasi:
   - **Name:** `applications`
   - **Public bucket:** ✅ Centang (agar file bisa diakses)
4. Klik **"Create bucket"**

#### 4.2 Setup Storage Policies
1. Buka Supabase Dashboard → **SQL Editor**
2. Buka file `database/setup_storage_policies.sql`
3. Copy seluruh isi file
4. Paste ke SQL Editor
5. Klik **RUN**
6. Pastikan tidak ada error

### 5. Konfigurasi Frontend

#### 5.1 Update Supabase Configuration
1. Buka file `frontend/js/supabase-init.js`
2. Ganti nilai berikut dengan data dari Supabase Anda:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Ganti dengan Project URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // Ganti dengan anon key Anda
```

#### 5.2 Verifikasi Konfigurasi
Pastikan file `frontend/js/supabase-init.js` sudah diupdate dengan benar.

## 🎮 Menjalankan Aplikasi

### Opsi 1: Langsung Buka File HTML (Paling Mudah)

1. Buka folder `frontend/pages/`
2. Double-click file `index.html`
3. Aplikasi akan terbuka di browser default

**Catatan:** Beberapa fitur mungkin tidak berfungsi karena CORS policy. Gunakan Opsi 2 untuk pengalaman penuh.

### Opsi 2: Menggunakan npm run dev (Recommended)

1. Pastikan Node.js dan npm sudah terinstall
2. Jalankan perintah berikut di terminal:
```bash
npm run dev
```
3. Server akan berjalan di `http://localhost:3000`
4. **Buka browser dan akses URL berikut (SEMUA URL BERFUNGSI):**
   
   **URL Pendek (Recommended - Lebih Mudah):**
   - `http://localhost:3000/` → Homepage
   - `http://localhost:3000/login` → Login
   - `http://localhost:3000/register` → Register
   - `http://localhost:3000/jobs` → Daftar Lowongan
   - `http://localhost:3000/job-detail?id=xxx` → Detail Lowongan
   - `http://localhost:3000/dashboard-pelamar` → Dashboard Pelamar
   - `http://localhost:3000/dashboard-hrd` → Dashboard HRD
   - `http://localhost:3000/about` → Tentang Kami
   
   **URL Lengkap (Alternatif - Juga Berfungsi):**
   - `http://localhost:3000/pages/index.html` → Homepage
   - `http://localhost:3000/pages/login.html` → Login
   - `http://localhost:3000/pages/register.html` → Register
   - `http://localhost:3000/pages/jobs.html` → Daftar Lowongan
   - `http://localhost:3000/pages/job-detail.html?id=xxx` → Detail Lowongan
   - `http://localhost:3000/pages/dashboard-pelamar.html` → Dashboard Pelamar
   - `http://localhost:3000/pages/dashboard-hrd.html` → Dashboard HRD
   - `http://localhost:3000/pages/about.html` → Tentang Kami

**Catatan Penting:** 
- Server berjalan dari folder `frontend/`, jadi root URL (`/`) menunjuk ke folder `frontend/`
- File `frontend/index.html` akan otomatis redirect ke `/pages/index.html`
- File redirect dibuat di root `frontend/` untuk route pendek (`/login`, `/register`, dll.)
- Semua path CSS/JS menggunakan absolute paths (`/css/style.css` dan `/js/...`)
- Path absolute dimulai dari root server (`frontend/`), jadi `/css/style.css` akan mencari `frontend/css/style.css`
- Link antar halaman di HTML menggunakan path relatif (`login.html`, `jobs.html`, dll.) yang akan bekerja dengan benar karena semua file ada di folder `pages/` yang sama
- **Semua halaman HTML di folder `pages/` dapat diakses dengan sempurna dan berfungsi dengan baik**
- **URL pendek (tanpa `/pages/`) dan URL lengkap (dengan `/pages/`) keduanya berfungsi dengan baik**

### Opsi 3: Menggunakan Live Server (Alternatif)

#### Menggunakan VS Code:
1. Install extension **"Live Server"** di VS Code
2. Klik kanan pada file `frontend/pages/index.html`
3. Pilih **"Open with Live Server"**
4. Browser akan otomatis terbuka di `http://localhost:5500`

#### Menggunakan Python (jika sudah terinstall):
```bash
cd frontend/pages
python -m http.server 8000
# Buka browser: http://localhost:8000
```

#### Menggunakan Node.js (jika sudah terinstall):
```bash
# Install http-server global
npm install -g http-server

# Jalankan server
cd frontend/pages
http-server -p 8000
# Buka browser: http://localhost:8000
```

### Opsi 4: Menggunakan XAMPP/WAMP

1. Install XAMPP atau WAMP
2. Copy folder `frontend` ke `htdocs` (XAMPP) atau `www` (WAMP)
3. Buka browser: `http://localhost/frontend/pages/index.html`

## 📤 Push ke GitHub

Untuk mengunggah project ini ke GitHub menggunakan GitHub Desktop, ikuti tutorial lengkap di:

📖 **[Tutorial GitHub Setup](docs/GITHUB_SETUP.md)**

Tutorial tersebut mencakup:
- ✅ Verifikasi file sensitif (API keys)
- ✅ Inisialisasi Git repository
- ✅ Membuat commit pertama
- ✅ Membuat repository di GitHub
- ✅ Push ke GitHub
- ✅ Troubleshooting umum

**PENTING:** Pastikan file-file berikut **TIDAK** ter-commit:
- ❌ `frontend/js/supabase-init.js` (berisi API keys)
- ❌ `backend/config/config.js` (berisi API keys)

File template sudah tersedia:
- ✅ `frontend/js/supabase-init.template.js`
- ✅ `backend/config/config.template.js`

## 📁 Struktur Project

```
Rekrutasi-Pegawai/
├── database/                 # Script SQL untuk database
│   ├── schema.sql           # Schema utama database
│   ├── ENSURE_PROFILE_TABLES.sql
│   ├── FIX_INFINITE_RECURSION.sql
│   ├── RESTORE_LOGIN_FIRST.sql
│   ├── setup_storage_policies.sql
│   └── README.md
│
├── docs/                     # Dokumentasi
│   ├── README.md
│   ├── SETUP.md
│   ├── QUICK_START.md
│   ├── STRUCTURE.md
│   ├── FEATURE_STATUS.md
│   ├── TEST_ACCOUNTS.md
│   ├── TROUBLESHOOTING_PROFILE.md
│   ├── SUPABASE_COMPLETE_UPDATE.md
│   └── GITHUB_SETUP.md       # Tutorial push ke GitHub
│
├── frontend/                 # Frontend aplikasi
│   ├── css/
│   │   └── style.css        # Styling aplikasi
│   ├── js/
│   │   ├── supabase-init.js # Konfigurasi Supabase
│   │   ├── modules/
│   │   │   ├── auth.js      # Modul autentikasi
│   │   │   ├── jobs.js      # Modul jobs
│   │   │   └── applications.js
│   │   ├── dashboard-hrd.js
│   │   ├── dashboard-pelamar.js
│   │   └── main.js
│   └── pages/               # Halaman HTML
│       ├── index.html       # Homepage
│       ├── login.html       # Login
│       ├── register.html    # Registrasi
│       ├── jobs.html        # Daftar lowongan
│       ├── job-detail.html  # Detail lowongan
│       ├── dashboard-hrd.html
│       └── dashboard-pelamar.html
│
└── README.md                # File ini
```

## 🔧 Troubleshooting

### Masalah: Tidak bisa login
**Solusi:**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan script: `database/RESTORE_LOGIN_FIRST.sql`
3. Refresh aplikasi (Ctrl+F5)

### Masalah: Profile tidak bisa disimpan
**Solusi:**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan script: `database/ENSURE_PROFILE_TABLES.sql`
3. Refresh aplikasi (Ctrl+F5)

### Masalah: Error "infinite recursion"
**Solusi:**
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan script: `database/FIX_INFINITE_RECURSION.sql`
3. Refresh aplikasi (Ctrl+F5)

### Masalah: Supabase client tidak terinisialisasi
**Solusi:**
1. Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` sudah benar di `frontend/js/supabase-init.js`
2. Pastikan menggunakan Live Server atau web server (jangan langsung buka file HTML)
3. Cek Console browser (F12) untuk error detail

### Masalah: File tidak bisa diupload
**Solusi:**
1. Pastikan bucket `applications` sudah dibuat di Supabase Storage
2. Jalankan script: `database/setup_storage_policies.sql`
3. Pastikan bucket `applications` adalah public bucket

### Masalah: CORS Error
**Solusi:**
- Jangan langsung buka file HTML (double-click)
- Gunakan Live Server atau web server lokal
- Pastikan Supabase URL sudah benar

### Masalah: Error 404 untuk CSS/JS (style.css, supabase-init.js, auth.js, main.js tidak ditemukan)
**Solusi:**
1. **Pastikan menggunakan `npm run dev`:**
   ```bash
   npm run dev
   ```

2. **Akses URL yang benar:**
   - Server berjalan dari folder `frontend/`
   - ✅ **Benar:** `http://localhost:3000/pages/index.html` → Homepage
   - ✅ **Benar:** `http://localhost:3000/pages/login.html` → Login
   - ✅ **Benar:** `http://localhost:3000/pages/register.html` → Register
   - ✅ **Benar:** `http://localhost:3000/pages/jobs.html` → Jobs
   - ❌ **Salah:** `http://localhost:3000/index.html` (akan error 404)

3. **Path CSS/JS menggunakan absolute paths:**
   - Semua path di HTML menggunakan `/css/style.css` dan `/js/...`
   - Path ini absolute dari root server (`frontend/`), jadi akan selalu benar
   - Pastikan server berjalan dari folder `frontend/` (bukan `frontend/pages/`)

4. **Jika masih error, pastikan:**
   - File `frontend/css/style.css` ada
   - File `frontend/js/supabase-init.js` ada
   - File `frontend/js/modules/auth.js` ada
   - File `frontend/js/main.js` ada
   - **Restart server** setelah perubahan: `npm run dev`
   - **Clear browser cache** (Ctrl+Shift+R atau Ctrl+F5)
   - **Tutup Live Server** jika masih berjalan (port 5500, 5508, dll)

### Masalah: WebSocket Error untuk cv.html
**Solusi:**
- Error ini normal dan tidak mempengaruhi aplikasi
- WebSocket error muncul karena Live Server mencoba hot reload untuk file yang tidak ada
- Error ini sudah ditangani di `main.js` dan tidak akan mengganggu fungsi aplikasi
- Jika menggunakan `npm run dev`, error WebSocket tidak akan muncul karena `serve` tidak memiliki hot reload

## 📚 Dokumentasi Lengkap

Untuk dokumentasi lebih detail, lihat folder `docs/`:
- **[SETUP.md](docs/SETUP.md)** - Panduan setup lengkap
- **[QUICK_START.md](docs/QUICK_START.md)** - Quick start guide
- **[GITHUB_SETUP.md](docs/GITHUB_SETUP.md)** - Tutorial push ke GitHub Desktop
- **[TROUBLESHOOTING_PROFILE.md](docs/TROUBLESHOOTING_PROFILE.md)** - Troubleshooting detail

## 👥 Kontributor

Tim Development:
- [Nama Anggota 1] - [Role/Divisi]
- [Nama Anggota 2] - [Role/Divisi]
- [Nama Anggota 3] - [Role/Divisi]

**Catatan:** Ganti dengan nama dan role anggota tim Anda.

## 📝 Catatan Penting

1. **Jangan commit API keys ke repository public!** Gunakan environment variables atau file config yang di-ignore oleh Git
2. **Backup database secara berkala** melalui Supabase Dashboard
3. **Test semua fitur** setelah setup untuk memastikan semuanya berfungsi
4. **Update dokumentasi** jika ada perubahan pada struktur project

## 🎯 Progress Project

### ✅ Fitur yang Sudah Selesai
- [x] Authentication (Login/Register)
- [x] Dashboard Pelamar
- [x] Dashboard HRD
- [x] Posting Lowongan (HRD)
- [x] Pencarian Lowongan (Pelamar)
- [x] Melamar Pekerjaan
- [x] Kelola Profil (Jabatan, Pendidikan, Lisensi)
- [x] Upload CV dan Cover Letter
- [x] Update Status Lamaran (HRD)

### 🚧 Fitur yang Sedang Dikembangkan
- [ ] Notifikasi Email
- [ ] Filter Lowongan Lanjutan
- [ ] Export Data Pelamar

### 📋 Fitur yang Direncanakan
- [ ] Chat antara HRD dan Pelamar
- [ ] Rating dan Review
- [ ] Dashboard Analytics

## 📄 License

Project ini dibuat untuk keperluan akademik. Silakan sesuaikan dengan kebutuhan tim Anda.

## 🙏 Acknowledgments

- Supabase untuk backend infrastructure
- Bootstrap untuk UI framework
- Semua kontributor dan tester

---

**Dibuat dengan ❤️ oleh Tim Rekrutasi Pegawai**

Untuk pertanyaan atau bantuan, silakan buka [Issues](../../issues) atau hubungi tim development.
#   r e k r u t a s i - p e g a w a i 
 
 