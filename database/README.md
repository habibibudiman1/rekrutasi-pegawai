# Database Scripts

Folder ini berisi script SQL untuk setup dan maintenance database Supabase.

## 📋 Script Utama

### 1. `schema.sql`
**Script utama untuk setup database**
- Membuat semua tabel (user_profiles, jobs, applications, dll)
- Membuat RLS policies
- Membuat functions dan triggers
- **Jalankan script ini pertama kali saat setup database**

### 2. `ENSURE_PROFILE_TABLES.sql`
**Memastikan tabel profile ada dan berfungsi**
- Membuat tabel: `career_history`, `education`, `licenses`
- Membuat RLS policies untuk tabel profile
- **Jalankan jika tidak bisa menyimpan data profile (jabatan, pendidikan, lisensi)**

### 3. `FIX_INFINITE_RECURSION.sql`
**Perbaikan error "infinite recursion detected in policy"**
- Memperbaiki policy HRD yang menyebabkan recursion
- Menggunakan SECURITY DEFINER function
- **Jalankan jika muncul error recursion saat HRD membaca profil pelamar**

### 4. `RESTORE_LOGIN_FIRST.sql`
**Pulihkan login jika tidak bisa login setelah menjalankan script lain**
- Membuat ulang policy "Users can view own profile"
- Memastikan semua policy untuk login ada
- **Jalankan jika tidak bisa login setelah menjalankan script SQL**

### 5. `setup_storage_policies.sql`
**Setup storage policies untuk upload file**
- Membuat bucket `applications` untuk CV dan Cover Letter
- Membuat RLS policies untuk storage
- **Jalankan setelah membuat bucket di Supabase Storage**

## 🔧 Script Tambahan

### `add_profile_tables.sql`
Script alternatif untuk membuat tabel profile (bisa digunakan jika `ENSURE_PROFILE_TABLES.sql` tidak bekerja)

## 📝 Cara Menggunakan

1. Buka Supabase Dashboard → SQL Editor
2. Copy seluruh isi script yang ingin dijalankan
3. Paste ke SQL Editor
4. Klik **RUN**
5. Pastikan tidak ada error
6. Refresh aplikasi (Ctrl+F5)

## ⚠️ Urutan Setup

1. **Pertama kali setup:**
   - Jalankan `schema.sql`
   - Jalankan `ENSURE_PROFILE_TABLES.sql`
   - Jalankan `setup_storage_policies.sql` (setelah membuat bucket)

2. **Jika ada masalah:**
   - Login tidak bisa → `RESTORE_LOGIN_FIRST.sql`
   - Error recursion → `FIX_INFINITE_RECURSION.sql`
   - Profile tidak bisa disimpan → `ENSURE_PROFILE_TABLES.sql`

## 📚 Dokumentasi Lengkap

Lihat folder `docs/` untuk dokumentasi lengkap tentang:
- Setup awal: `docs/SETUP.md`
- Troubleshooting: `docs/TROUBLESHOOTING_PROFILE.md`
- Quick start: `docs/QUICK_START.md`


