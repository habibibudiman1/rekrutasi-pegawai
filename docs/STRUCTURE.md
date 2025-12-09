# Struktur Folder Proyek

Dokumen ini menjelaskan struktur folder proyek Website Rekrutasi Pegawai.

## 📂 Struktur Lengkap

```
Rekrutasi-Pegawai/
│
├── frontend/                    # Frontend Application
│   ├── pages/                  # Halaman HTML
│   │   ├── index.html          # Homepage dengan hero section
│   │   ├── login.html          # Halaman login untuk semua user
│   │   ├── register.html      # Halaman registrasi (Pelamar/HRD)
│   │   ├── jobs.html           # Daftar lowongan pekerjaan
│   │   ├── job-detail.html     # Detail lowongan pekerjaan
│   │   ├── dashboard-hrd.html # Dashboard HRD
│   │   ├── dashboard-pelamar.html # Dashboard Pelamar
│   │   └── about.html          # Halaman tentang kami
│   │
│   ├── css/                    # Stylesheet
│   │   └── style.css           # Custom CSS dengan Bootstrap 5
│   │
│   └── js/                     # JavaScript
│       ├── main.js             # Utility functions & helpers
│       ├── dashboard-hrd.js    # Logic khusus dashboard HRD
│       ├── dashboard-pelamar.js # Logic khusus dashboard Pelamar
│       └── modules/            # JavaScript Modules
│           ├── auth.js         # Authentication (login, register, logout)
│           ├── jobs.js         # Jobs management (CRUD operations)
│           └── applications.js # Applications management
│
├── backend/                     # Backend Configuration
│   └── config/                  # Configuration files
│       └── config.js           # Supabase config (reference only)
│                               # Note: Supabase diinisialisasi inline di HTML
│
├── database/                    # Database Schema
│   └── schema.sql             # PostgreSQL schema untuk Supabase
│                               # - Tabel: user_profiles, jobs, applications
│                               # - RLS Policies
│                               # - Triggers
│
├── docs/                        # Documentation
│   ├── README.md              # Dokumentasi utama
│   ├── SETUP.md               # Panduan setup lengkap
│   └── STRUCTURE.md           # File ini
│
├── assets/                      # Static Assets
│   └── images/                # Gambar dan media files
│
├── package.json                # Node.js dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # Readme utama
```

## 📋 Penjelasan Folder

### `frontend/`
Berisi semua file frontend aplikasi.

#### `frontend/pages/`
Semua file HTML aplikasi. Setiap halaman memiliki path relatif ke folder `frontend/`:
- CSS: `../css/style.css`
- JS Modules: `../js/modules/[module].js`
- JS Utils: `../js/[file].js`

#### `frontend/css/`
File stylesheet custom. Menggunakan Bootstrap 5 sebagai base framework.

#### `frontend/js/`
JavaScript files:
- **main.js**: Utility functions yang digunakan di seluruh aplikasi
- **dashboard-*.js**: Logic khusus untuk masing-masing dashboard
- **modules/**: Modul JavaScript yang dapat digunakan kembali:
  - `auth.js`: Authentication management
  - `jobs.js`: Jobs CRUD operations
  - `applications.js`: Applications management

### `backend/`
Konfigurasi backend. Karena menggunakan Supabase (Backend as a Service), folder ini hanya berisi file konfigurasi referensi.

#### `backend/config/`
File konfigurasi (sebagai referensi). Supabase diinisialisasi inline di setiap file HTML.

### `database/`
Schema dan migration files untuk database Supabase.

#### `database/schema.sql`
File SQL yang berisi:
- Definisi tabel (user_profiles, jobs, applications)
- Row Level Security (RLS) policies
- Triggers untuk auto-update timestamps
- Indexes untuk performa

### `docs/`
Dokumentasi proyek:
- **README.md**: Dokumentasi utama
- **SETUP.md**: Panduan setup lengkap
- **STRUCTURE.md**: Dokumentasi struktur folder (ini)

### `assets/`
File static seperti gambar, icon, dll.

## 🔗 Path References

### Dari HTML ke CSS
```html
<link rel="stylesheet" href="../css/style.css">
```

### Dari HTML ke JS Modules
```html
<script src="../js/modules/auth.js"></script>
<script src="../js/modules/jobs.js"></script>
```

### Dari HTML ke JS Utils
```html
<script src="../js/main.js"></script>
<script src="../js/dashboard-hrd.js"></script>
```

### Antar Halaman HTML
Karena semua HTML ada di folder yang sama, path relatif tetap sama:
```html
<a href="login.html">Login</a>
<a href="jobs.html">Lowongan</a>
```

## 📝 Best Practices

1. **Modular JavaScript**: Pisahkan logic ke modul terpisah di `frontend/js/modules/`
2. **Consistent Naming**: Gunakan kebab-case untuk file HTML, camelCase untuk JS
3. **Path Consistency**: Selalu gunakan path relatif dari lokasi file
4. **Documentation**: Update dokumentasi saat menambah fitur baru

## 🔄 Perubahan Struktur

Jika perlu mengubah struktur folder:
1. Update semua path di file HTML
2. Update dokumentasi ini
3. Update README.md jika perlu
4. Test semua halaman untuk memastikan path benar







