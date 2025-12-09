# Panduan Lengkap Update Supabase

Dokumen ini berisi **SEMUA** update yang perlu dilakukan di Supabase untuk fitur-fitur terbaru.

## 📋 Daftar Update

### 1. ✅ Update Status Aplikasi (WAJIB)
**File:** `database/update_supabase.sql`

**Perubahan:**
- Update constraint status aplikasi
- Tambah kolom baru di `user_profiles` (address, bio, linkedin_url, portfolio_url)

### 2. ✅ Tambah Tabel Profile (WAJIB)
**File:** `database/add_profile_tables.sql`

**Tabel yang ditambahkan:**
- `career_history` - Riwayat karier
- `education` - Pendidikan
- `licenses` - Lisensi & sertifikat

### 3. ✅ Tambah Kolom Cover Letter URL (WAJIB)
**File:** `database/add_cover_letter_url.sql`

**Perubahan:**
- Tambah kolom `cover_letter_url` di tabel `applications`

---

## 🚀 Cara Update (Step by Step)

### **LANGKAH 1: Update Status Aplikasi & User Profiles**

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Buka file `database/update_supabase.sql`
3. Copy **SEMUA** isi file
4. Paste ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`
6. Pastikan tidak ada error

**Script ini akan:**
- ✅ Update constraint status aplikasi
- ✅ Tambah kolom `address`, `bio`, `linkedin_url`, `portfolio_url` ke `user_profiles`

---

### **LANGKAH 2: Tambah Tabel Profile**

1. Masih di **SQL Editor**
2. Buka file `database/add_profile_tables.sql`
3. Copy **SEMUA** isi file
4. Paste ke SQL Editor
5. Klik **Run**
6. Pastikan tidak ada error

**Script ini akan:**
- ✅ Buat tabel `career_history`
- ✅ Buat tabel `education`
- ✅ Buat tabel `licenses`
- ✅ Setup RLS policies untuk semua tabel
- ✅ Setup triggers untuk `updated_at`

---

### **LANGKAH 3: Tambah Kolom Cover Letter URL**

1. Masih di **SQL Editor**
2. Buka file `database/add_cover_letter_url.sql`
3. Copy **SEMUA** isi file
4. Paste ke SQL Editor
5. Klik **Run**
6. Pastikan tidak ada error

**Script ini akan:**
- ✅ Tambah kolom `cover_letter_url` ke tabel `applications`

---

### **LANGKAH 4: Setup Storage Policies (PENTING!)**

1. Masih di **SQL Editor**
2. Buka file `database/setup_storage_policies.sql`
3. Copy **SEMUA** isi file
4. Paste ke SQL Editor
5. Klik **Run**
6. Pastikan tidak ada error

**Script ini akan:**
- ✅ Setup RLS policies untuk storage bucket `applications`
- ✅ User dapat upload CV dan Cover Letter
- ✅ User dapat membaca file mereka sendiri
- ✅ HRD dapat membaca semua file aplikasi

**⚠️ PENTING:** Script ini HARUS dijalankan setelah bucket `applications` dibuat!

---

## ✅ Verifikasi Update

Setelah menjalankan semua script, jalankan query berikut untuk memverifikasi:

```sql
-- 1. Cek kolom user_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_profiles'
AND column_name IN ('address', 'bio', 'linkedin_url', 'portfolio_url')
ORDER BY column_name;

-- 2. Cek constraint status aplikasi
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.applications'::regclass
AND conname = 'applications_status_check';

-- 3. Cek tabel profile baru
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('career_history', 'education', 'licenses')
ORDER BY table_name;

-- 4. Cek kolom cover_letter_url
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
AND column_name = 'cover_letter_url';

-- 5. Cek RLS policies untuk tabel baru
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('career_history', 'education', 'licenses')
ORDER BY tablename, policyname;
```

**Hasil yang diharapkan:**
- ✅ 4 kolom baru muncul di `user_profiles`
- ✅ Constraint status aplikasi menunjukkan status baru
- ✅ 3 tabel baru muncul: `career_history`, `education`, `licenses`
- ✅ Kolom `cover_letter_url` muncul di `applications`
- ✅ RLS policies sudah dibuat untuk semua tabel baru

---

## 📦 Setup Supabase Storage

Pastikan bucket `applications` sudah dibuat untuk menyimpan file:

1. Buka **Supabase Dashboard** → **Storage**
2. Klik **New bucket**
3. Nama bucket: `applications`
4. Public bucket: **YES** (untuk akses file)
5. Klik **Create bucket**

**Folder yang akan dibuat otomatis:**
- `cvs/` - Untuk file CV
- `cover-letters/` - Untuk file surat lamaran PDF

---

## 🔐 Setup Storage Policies

Setelah bucket dibuat, setup policies untuk akses file:

**File:** `database/setup_storage_policies.sql`

1. Buka file `database/setup_storage_policies.sql`
2. Copy **SEMUA** isi file
3. Paste ke Supabase SQL Editor
4. Klik **Run**

**Script ini akan:**
- ✅ Hapus policies lama (jika ada)
- ✅ Buat policy untuk upload file (CV & Cover Letter)
- ✅ Buat policy untuk read file sendiri
- ✅ Buat policy untuk HRD read semua file
- ✅ Buat policy untuk delete file sendiri

**Atau jalankan manual:**

```sql
-- Policy untuk upload CV dan Cover Letter
CREATE POLICY "Users can upload own application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'applications' AND
    (
        (storage.foldername(name))[1] = 'cvs' AND
        (storage.foldername(name))[2] LIKE (auth.uid()::text || '_cv_%')
    ) OR (
        (storage.foldername(name))[1] = 'cover-letters' AND
        (storage.foldername(name))[2] LIKE (auth.uid()::text || '_cover_letter_%')
    )
);

-- Policy untuk read file sendiri
CREATE POLICY "Users can read own application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'applications' AND
    (
        (storage.foldername(name))[1] = 'cvs' AND
        (storage.foldername(name))[2] LIKE (auth.uid()::text || '_cv_%')
    ) OR (
        (storage.foldername(name))[1] = 'cover-letters' AND
        (storage.foldername(name))[2] LIKE (auth.uid()::text || '_cover_letter_%')
    )
);

-- Policy untuk HRD read semua file
CREATE POLICY "HRD can read all application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'applications' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'HRD'
        AND is_verified = TRUE
    )
);
```

---

## 📝 Checklist Update

Gunakan checklist ini untuk memastikan semua update sudah dilakukan:

### Database Schema
- [ ] Script `update_supabase.sql` sudah dijalankan
- [ ] Script `add_profile_tables.sql` sudah dijalankan
- [ ] Script `add_cover_letter_url.sql` sudah dijalankan
- [ ] Verifikasi query berhasil dijalankan
- [ ] Semua tabel dan kolom sudah muncul

### Storage
- [ ] Bucket `applications` sudah dibuat
- [ ] Storage policies sudah dibuat
- [ ] Bucket bersifat public

### Testing
- [ ] Test fitur profile (tambah/edit career, education, license)
- [ ] Test upload CV
- [ ] Test upload surat lamaran PDF
- [ ] Test lihat aplikasi di dashboard HRD

---

## ⚠️ Troubleshooting

### Error: "relation does not exist"
**Solusi:** Pastikan script SQL sudah dijalankan dengan benar. Cek apakah tabel sudah dibuat.

### Error: "new row violates row-level security policy"
**Solusi:** Pastikan RLS policies sudah dibuat. Jalankan kembali script `add_profile_tables.sql`.

### Error: "bucket does not exist"
**Solusi:** Buat bucket `applications` di Storage dengan setting public.

### Error: "permission denied for storage"
**Solusi:** Setup storage policies seperti yang dijelaskan di atas.

---

## 🔗 File Terkait

- `database/update_supabase.sql` - Update status & user_profiles
- `database/add_profile_tables.sql` - Tabel profile baru
- `database/add_cover_letter_url.sql` - Kolom cover_letter_url
- `database/schema.sql` - Schema database lengkap
- `docs/SETUP.md` - Panduan setup awal
- `docs/TROUBLESHOOTING_PROFILE.md` - Troubleshooting profile

---

## 📞 Bantuan

Jika masih ada masalah:
1. Cek error message di Supabase SQL Editor
2. Cek Supabase Logs → API Logs
3. Screenshot error dan konsultasikan

