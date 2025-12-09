# Akun Test untuk Testing

Dokumen ini berisi informasi akun test yang dapat digunakan untuk mengakses dashboard tanpa perlu registrasi.

## 📋 Akun Test

### 1. Akun Pelamar (Applicant)

**Email:** `pelamar@test.com`  
**Password:** `test123456`  
**Role:** Pelamar  
**Status:** Terverifikasi ✅  
**Akses:** Dashboard Pelamar

**Fitur yang dapat diakses:**
- Melihat daftar lowongan pekerjaan
- Mencari lowongan
- Melamar pekerjaan
- Melihat status lamaran
- Dashboard dengan statistik

### 2. Akun HRD

**Email:** `hrd@test.com`  
**Password:** `test123456`  
**Role:** HRD  
**Status:** Terverifikasi ✅  
**Akses:** Dashboard HRD

**Fitur yang dapat diakses:**
- Membuat lowongan pekerjaan
- Mengedit dan menghapus lowongan
- Melihat daftar pelamar
- Mengevaluasi pelamar
- Update status lamaran
- Statistik rekrutasi

## 🚀 Cara Setup Akun Test

### Metode 1: Manual (Recommended)

1. **Buka Supabase Dashboard**
   - Login ke [Supabase Dashboard](https://supabase.com/dashboard)
   - Pilih project Anda

2. **Buat User di Authentication**
   - Buka menu **Authentication** > **Users**
   - Klik **"Add user"** atau **"Invite user"**
   - Buat 2 user dengan detail berikut:

   **User 1 - Pelamar:**
   - Email: `pelamar@test.com`
   - Password: `test123456`
   - Auto Confirm: ✅ **Yes** (penting!)

   **User 2 - HRD:**
   - Email: `hrd@test.com`
   - Password: `test123456`
   - Auto Confirm: ✅ **Yes** (penting!)

3. **Jalankan SQL Script**
   - Buka **SQL Editor** di Supabase
   - Copy dan paste isi file `database/create_test_users.sql`
   - Klik **Run** untuk menjalankan script
   - Script akan otomatis membuat user profiles

4. **Verifikasi**
   - Cek di **Table Editor** > `user_profiles`
   - Pastikan kedua user sudah ada dengan `is_verified = true`

### Metode 2: Otomatis (Jika sudah ada user)

Jika user sudah dibuat sebelumnya, cukup jalankan script `database/create_test_users.sql` di SQL Editor.

## 🔐 Login

Setelah setup selesai, Anda dapat login dengan:

1. Buka halaman login: `frontend/pages/login.html`
2. Masukkan email dan password dari akun test di atas
3. Klik "Masuk"
4. Anda akan diarahkan ke dashboard sesuai role

## 📝 Catatan Penting

- **Password:** `test123456` (untuk semua akun test)
- **Auto Confirm:** Pastikan user dibuat dengan Auto Confirm = Yes agar bisa langsung login
- **Verifikasi HRD:** Akun HRD sudah otomatis terverifikasi (`is_verified = true`)
- **Keamanan:** Jangan gunakan akun test ini di production!

## 🧪 Testing Scenarios

### Untuk Pelamar:
1. Login dengan `pelamar@test.com`
2. Cari lowongan pekerjaan
3. Lamar beberapa lowongan
4. Lihat status lamaran di dashboard

### Untuk HRD:
1. Login dengan `hrd@test.com`
2. Buat beberapa lowongan pekerjaan
3. Lihat pelamar yang melamar
4. Update status lamaran
5. Lihat statistik rekrutasi

## 🔄 Reset Data (Opsional)

Jika ingin reset data test, jalankan query berikut:

```sql
-- Hapus semua data test (HATI-HATI!)
DELETE FROM public.applications 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('pelamar@test.com', 'hrd@test.com')
);

DELETE FROM public.jobs 
WHERE created_by IN (
    SELECT id FROM auth.users WHERE email = 'hrd@test.com'
);

-- Reset user profiles (jika perlu)
UPDATE public.user_profiles 
SET is_verified = true 
WHERE id IN (
    SELECT id FROM auth.users WHERE email IN ('pelamar@test.com', 'hrd@test.com')
);
```

## ❓ Troubleshooting

**Q: User tidak bisa login**  
A: Pastikan Auto Confirm = Yes saat membuat user di Supabase Auth

**Q: HRD tidak bisa membuat lowongan**  
A: Pastikan `is_verified = true` di tabel `user_profiles` untuk user HRD

**Q: Error saat menjalankan script**  
A: Pastikan user sudah dibuat di Authentication terlebih dahulu sebelum menjalankan script SQL







