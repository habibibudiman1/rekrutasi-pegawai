<p align="center">
  <img src="https://img.shields.io/badge/Manajemen-Proyek%20SI-blue?style=for-the-badge" alt="Manajemen Proyek" />
  <img src="https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge" alt="Supabase" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge" alt="Bootstrap" />
</p>

<h1 align="center">🎯 Aplikasi Rekrutasi Pegawai</h1>
<p align="center">
  <strong>Platform rekrutasi yang menghubungkan perusahaan (HRD) dengan talenta terbaik (Pelamar)</strong>
</p>

<p align="center">
  <a href="#-fitur-utama">Fitur</a> •
  <a href="#-teknologi">Teknologi</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-instalasi">Instalasi</a> •
  <a href="#-dokumentasi">Dokumentasi</a>
</p>

---

## 📖 Tentang Proyek

**Aplikasi Rekrutasi Pegawai** adalah platform rekrutasi terpercaya yang memungkinkan:

- **HRD** — memposting lowongan pekerjaan, mengelola lamaran, dan memantau kandidat
- **Pelamar** — mencari lowongan, melamar dengan CV & cover letter, dan memantau status lamaran

Dibangun dengan pendekatan modern: backend Supabase (PostgreSQL, Auth, Storage) dan frontend vanilla dengan Bootstrap 5.

---

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 👤 Untuk Pelamar
- Pencarian lowongan pekerjaan
- Melamar dengan upload CV & Cover Letter
- Dashboard status lamaran
- Profil lengkap (jabatan, pendidikan, lisensi)
- Rekomendasi pekerjaan berdasarkan profil

</td>
<td width="50%">

### 🏢 Untuk HRD
- Posting lowongan pekerjaan
- Kelola aplikasi pelamar
- Update status (pending → reviewed → accepted/rejected)
- Lihat profil lengkap pelamar
- Dashboard monitoring

</td>
</tr>
</table>

---

## 🛠️ Teknologi

| Kategori | Stack |
|----------|--------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5.3, Bootstrap Icons |
| **Backend** | Supabase (PostgreSQL, Authentication, Storage) |
| **Keamanan** | Row Level Security (RLS) |
| **Tools** | Git, Supabase Dashboard |

---

## ⚡ Quick Start

**Cara tercepat untuk tim:**

| OS | Perintah |
|----|----------|
| **Windows** | Double-click `setup-team.bat` |
| **Linux/Mac** | `chmod +x setup-team.sh` lalu `./setup-team.sh` |

Setelah setup selesai:

```bash
npm run dev
```

Buka browser: **http://localhost:3000**

📖 Panduan lengkap: [SETUP_TEAM.md](SETUP_TEAM.md)

---

## 📦 Prerequisites

- [Akun Supabase](https://supabase.com) (gratis)
- **Git** terinstall
- **Node.js** & **npm** (untuk `npm run dev`)
- Browser modern (Chrome, Firefox, Edge)

---

## 🚀 Instalasi

### 1. Clone & Persiapan

```bash
git clone <URL_REPOSITORY>
cd rekrutasi-pegawai
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Di **Settings → API**, catat **Project URL** dan **anon key**
3. Di **SQL Editor**, jalankan (berurutan):
   - `database/schema.sql`
   - `database/ENSURE_PROFILE_TABLES.sql`
   - `database/setup_storage_policies.sql`
4. Di **Storage**, buat bucket `applications` (public)

### 3. Konfigurasi Frontend

Salin template dan isi kredensial Supabase:

```bash
# Salin template
cp frontend/js/supabase-init-template.js frontend/js/supabase-init.js
```

Edit `frontend/js/supabase-init.js`:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Akses di browser:

| Halaman | URL |
|---------|-----|
| Homepage | http://localhost:3000/ |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Lowongan | http://localhost:3000/jobs |
| Dashboard Pelamar | http://localhost:3000/dashboard-pelamar |
| Dashboard HRD | http://localhost:3000/dashboard-hrd |

---

## 📁 Struktur Proyek

```
rekrutasi-pegawai/
├── database/           # Script SQL (schema, policies, fix)
├── docs/               # Dokumentasi (setup, troubleshooting, GitHub)
├── frontend/
│   ├── css/            # Styling
│   ├── js/             # Logic & modul (auth, jobs, applications)
│   └── pages/          # Halaman HTML
├── SETUP_TEAM.md       # Panduan setup untuk tim
└── README.md
```

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Tidak bisa login | Jalankan `database/RESTORE_LOGIN_FIRST.sql` di Supabase SQL Editor |
| Profil tidak tersimpan | Jalankan `database/ENSURE_PROFILE_TABLES.sql` |
| Error infinite recursion | Jalankan `database/FIX_INFINITE_RECURSION.sql` |
| Supabase tidak terinisialisasi | Cek `SUPABASE_URL` & `SUPABASE_ANON_KEY` di `supabase-init.js`, gunakan web server (jangan buka file HTML langsung) |
| Upload file gagal | Pastikan bucket `applications` ada dan policies dari `setup_storage_policies.sql` sudah dijalankan |
| 404 CSS/JS | Pastikan menjalankan `npm run dev` dari root project dan akses via http://localhost:3000 |

Dokumentasi lengkap: [docs/TROUBLESHOOTING_PROFILE.md](docs/TROUBLESHOOTING_PROFILE.md)

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [SETUP_TEAM.md](SETUP_TEAM.md) | Setup cepat untuk tim |
| [docs/SETUP.md](docs/SETUP.md) | Panduan setup lengkap |
| [docs/QUICK_START.md](docs/QUICK_START.md) | Quick start guide |
| [docs/GITHUB_SETUP.md](docs/GITHUB_SETUP.md) | Push ke GitHub (Desktop) |
| [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md) | Akun testing |

---

## 🎯 Progress Fitur

| Status | Fitur |
|--------|--------|
| ✅ | Authentication (Login/Register) |
| ✅ | Dashboard Pelamar & HRD |
| ✅ | Posting & pencarian lowongan |
| ✅ | Melamar (CV, Cover Letter) |
| ✅ | Profil (jabatan, pendidikan, lisensi) |
| ✅ | Update status lamaran |
| 🚧 | Notifikasi email, filter lanjutan, export data |
| 📋 | Chat HRD–Pelamar, rating, dashboard analytics |

---

## ⚠️ Keamanan

**Jangan commit kredensial ke repository publik.**

- Gunakan `supabase-init.template.js` sebagai acuan; simpan `supabase-init.js` di `.gitignore` atau gunakan environment variables.
- File sensitif: `frontend/js/supabase-init.js`, `backend/config/config.js`

---

## 👥 Kontributor

Tim Development:
- [Nama Anggota 1] — Role/Divisi
- [Nama Anggota 2] — Role/Divisi
- [Nama Anggota 3] — Role/Divisi

*Ganti dengan nama dan role anggota tim.*

---

## 📄 Lisensi & Acknowledgments

Proyek ini dibuat untuk keperluan akademik (Manajemen Proyek Sistem Informasi).

- **Supabase** — Backend
- **Bootstrap** — UI framework

---

<p align="center">
  <strong>Dibuat dengan ❤️ oleh Tim Rekrutasi Pegawai</strong><br>
  <sub>Untuk pertanyaan: buka <a href="../../issues">Issues</a> atau hubungi tim development.</sub>
</p>
