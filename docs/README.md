# Dokumentasi Aplikasi Rekrutasi Pegawai

Dokumentasi lengkap untuk aplikasi rekrutasi pegawai.

## 📚 Dokumentasi Utama

### Setup & Installation
- **[SETUP.md](./SETUP.md)** - Panduan setup lengkap aplikasi
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide untuk mulai menggunakan aplikasi
- **[STRUCTURE.md](./STRUCTURE.md)** - Struktur folder dan file aplikasi

### Troubleshooting
- **[TROUBLESHOOTING_PROFILE.md](./TROUBLESHOOTING_PROFILE.md)** - Troubleshooting masalah profile (jabatan, pendidikan, lisensi tidak bisa disimpan)

### Feature Documentation
- **[FEATURE_STATUS.md](./FEATURE_STATUS.md)** - Status fitur aplikasi
- **[TEST_ACCOUNTS.md](./TEST_ACCOUNTS.md)** - Akun test untuk testing

### Supabase Setup
- **[SUPABASE_COMPLETE_UPDATE.md](./SUPABASE_COMPLETE_UPDATE.md)** - Panduan lengkap update Supabase

## 🔧 Troubleshooting Cepat

### Login tidak bisa
1. Jalankan script: `database/RESTORE_LOGIN_FIRST.sql`
2. Refresh aplikasi (Ctrl+F5)

### Profile tidak bisa disimpan
1. Jalankan script: `database/ENSURE_PROFILE_TABLES.sql`
2. Refresh aplikasi (Ctrl+F5)

### Error "infinite recursion"
1. Jalankan script: `database/FIX_INFINITE_RECURSION.sql`
2. Refresh aplikasi (Ctrl+F5)

## 📖 Cara Menggunakan

1. Baca **[SETUP.md](./SETUP.md)** untuk setup awal
2. Ikuti **[QUICK_START.md](./QUICK_START.md)** untuk mulai menggunakan
3. Jika ada masalah, cek **[TROUBLESHOOTING_PROFILE.md](./TROUBLESHOOTING_PROFILE.md)**

## 🗂️ Struktur Dokumentasi

```
docs/
├── README.md (file ini)
├── SETUP.md - Setup lengkap
├── QUICK_START.md - Quick start
├── STRUCTURE.md - Struktur aplikasi
├── FEATURE_STATUS.md - Status fitur
├── TEST_ACCOUNTS.md - Akun test
├── TROUBLESHOOTING_PROFILE.md - Troubleshooting profile
└── SUPABASE_COMPLETE_UPDATE.md - Update Supabase
```
