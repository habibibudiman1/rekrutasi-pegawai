<p align="center">
  <img src="https://img.shields.io/badge/Manajemen%20Proyek-Sistem%20Informasi-0066CC?style=for-the-badge" alt="Manajemen Proyek" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge" alt="Supabase" />
  <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge" alt="Bootstrap" />
</p>

<h1 align="center">🎯 Aplikasi Rekrutasi Pegawai</h1>

<p align="center">
  <b>Website rekrutasi yang menghubungkan perusahaan (HRD) dengan pelamar kerja.</b><br>
  HRD memposting lowongan & mengelola lamaran · Pelamar mencari lowongan, melamar dengan CV & cover letter, serta memantau status lamaran.
</p>

<p align="center">
  <a href="#-informasi-website">Informasi</a> •
  <a href="#-teknologi-yang-digunakan">Teknologi</a> •
  <a href="#-cara-mencoba">Cara Mencoba</a> •
  <a href="#-struktur-project">Struktur</a> •
  <a href="#-tim">Tim</a>
</p>

---

## 📌 Informasi Website

### Apa yang bisa dilakukan?

<table>
<tr>
<td width="50%" valign="top">

#### 👤 Sebagai Pelamar
- Daftar akun & lengkapi profil (riwayat jabatan, pendidikan, lisensi)
- Cari lowongan pekerjaan
- Melamar dengan upload **CV** dan **cover letter**
- Lihat status lamaran di dashboard (pending → reviewed → accepted/rejected)

</td>
<td width="50%" valign="top">

#### 🏢 Sebagai HRD
- Daftar akun dengan role HRD
- **Posting lowongan** (judul, deskripsi, lokasi, dll.)
- Lihat daftar pelamar per lowongan
- **Update status lamaran** & lihat profil lengkap pelamar
- Dashboard untuk memantau lowongan & lamaran

</td>
</tr>
</table>

### Fitur utama

| Fitur | Keterangan |
|-------|------------|
| **Autentikasi** | Login & register via Supabase |
| **Profil** | Kelola riwayat jabatan, pendidikan, lisensi |
| **Lowongan** | CRUD lowongan (HRD) |
| **Lamaran** | Upload CV & cover letter, pantau status |
| **Dashboard** | Terpisah untuk Pelamar & HRD |
| **Pencarian** | Cari & lihat detail lowongan |

---

## 🛠️ Teknologi yang Digunakan

| Bagian | Teknologi |
|--------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (vanilla), Bootstrap 5.3, Bootstrap Icons |
| **Backend** | Supabase (PostgreSQL, Authentication, Storage) |
| **Keamanan** | Row Level Security (RLS) |
| **Tools** | Node.js, npm, Git |

> Dibangun tanpa framework frontend (React/Vue)—murni HTML, CSS, dan JavaScript dengan Bootstrap untuk UI.

---

## 🚀 Cara Mencoba

### ⚡ Cara tercepat: klik file .bat (Windows)

| Langkah | Yang dilakukan |
|--------|-----------------|
| 1 | Clone project atau download ZIP lalu ekstrak |
| 2 | Masuk ke folder **rekrutasi-pegawai** |
| 3 | **Double-click** file **`setup-team.bat`** |
| 4 | Tunggu selesai (config + `npm install` otomatis) |
| 5 | Buka Command Prompt/PowerShell di folder yang sama, jalankan: `npm run dev` |
| 6 | Buka browser → **http://localhost:3000** |

> **Perlu:** Node.js sudah terpasang. Database & storage Supabase cukup disetup sekali oleh tim. Panduan lengkap: [SETUP_TEAM.md](SETUP_TEAM.md)

---

### 🐧 Linux / Mac

```bash
chmod +x setup-team.sh
./setup-team.sh
```

Lalu jalankan `npm run dev` dan buka **http://localhost:3000**.

---

### 📋 Cara manual (tanpa script)

| Yang dibutuhkan | Keterangan |
|-----------------|------------|
| Node.js & npm | Terpasang di komputer |
| Akun Supabase | Gratis di [supabase.com](https://supabase.com) |
| Browser | Chrome, Firefox, Edge, dll. |

1. **Clone** → `git clone <URL_REPOSITORY>` lalu `cd rekrutasi-pegawai`
2. **Supabase** → Buat project → SQL Editor jalankan: `schema.sql`, `ENSURE_PROFILE_TABLES.sql`, `setup_storage_policies.sql` → Storage buat bucket `applications` (public)
3. **Config** → Salin `frontend/js/supabase-init-template.js` ke `frontend/js/supabase-init.js`, isi URL & anon key dari Supabase
4. **Jalankan** → `npm install` lalu `npm run dev` → buka http://localhost:3000

Panduan detail: [SETUP_TEAM.md](SETUP_TEAM.md)

---

### 🔗 URL setelah aplikasi jalan

| Halaman | URL |
|---------|-----|
| Homepage | http://localhost:3000/ |
| Daftar akun | http://localhost:3000/register |
| Login | http://localhost:3000/login |
| Daftar lowongan | http://localhost:3000/jobs |
| Dashboard Pelamar | http://localhost:3000/dashboard-pelamar |
| Dashboard HRD | http://localhost:3000/dashboard-hrd |

*Tip:* Daftar satu akun Pelamar & satu akun HRD, lalu buat lowongan dari HRD dan lamar dari Pelamar untuk mencoba alur lengkap.

---

## 📁 Struktur Project

```
rekrutasi-pegawai/
├── database/           # Script SQL (schema, kebijakan, perbaikan)
├── docs/               # Dokumentasi (setup, troubleshooting, GitHub)
├── frontend/
│   ├── css/            # Styles
│   ├── js/             # Logika & modul (auth, jobs, applications)
│   └── pages/          # Halaman HTML
├── setup-team.bat      # Setup cepat Windows (double-click)
├── setup-team.sh       # Setup cepat Linux/Mac
├── SETUP_TEAM.md       # Panduan setup untuk tim
├── package.json
└── README.md
```

Dokumentasi lebih detail (troubleshooting, push ke GitHub, dll.) ada di folder **docs/**.

---

## 👥 Tim

| No | Nama | Role |
|----|------|------|
| 1 | **Ryan Ibnu Syahrani** | Web Developer |
| 2 | **Daenistry Cecila Wardhan** | UI/UX Designer |
| 3 | **Muhamad Habibi Budiman** | Project Manager & Web Developer |
| 4 | **Raihan Tri Dharma** | Web Developer |
| 5 | **Adilio Adaha** | Web Developer |

---

## 📄 Lisensi & Penggunaan

Proyek ini dibuat untuk keperluan **akademik** (Manajemen Proyek Sistem Informasi).  
Menggunakan **Supabase** untuk backend dan **Bootstrap** untuk tampilan.

---

<p align="center">
  <sub>Dibuat dengan ❤️ oleh Tim Rekrutasi Pegawai</sub>
</p>
