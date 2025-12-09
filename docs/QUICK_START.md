# Quick Start - Setup Akun Test

Panduan cepat untuk membuat akun test agar bisa langsung mengakses dashboard.

## 🎯 Akun Test yang Akan Dibuat

1. **Pelamar Test**
   - Email: `pelamar@test.com`
   - Password: `test123456`
   - Dashboard: Pelamar

2. **HRD Test**
   - Email: `hrd@test.com`
   - Password: `test123456`
   - Dashboard: HRD (sudah terverifikasi)

## 📝 Langkah-langkah Setup

### Step 1: Buat User di Supabase Auth

1. Buka **Supabase Dashboard** > Project Anda
2. Buka menu **Authentication** (di sidebar kiri)
3. Klik tab **Users**
4. Klik tombol **"Add user"** atau **"Invite user"**

**Buat User Pertama (Pelamar):**
- **Email:** `pelamar@test.com`
- **Password:** `test123456`
- **Auto Confirm:** ✅ **Centang/Enable** (PENTING!)
- Klik **"Create user"**

**Buat User Kedua (HRD):**
- **Email:** `hrd@test.com`
- **Password:** `test123456`
- **Auto Confirm:** ✅ **Centang/Enable** (PENTING!)
- Klik **"Create user"**

### Step 2: Jalankan SQL Script

1. Di Supabase Dashboard, buka **SQL Editor** (di sidebar kiri)
2. Klik **"New query"**
3. Copy seluruh isi file `database/create_test_users.sql`
4. Paste ke SQL Editor
5. Klik tombol **"Run"** (atau tekan Ctrl+Enter)
6. Pastikan tidak ada error di hasil query

### Step 3: Verifikasi

1. Buka **Table Editor** > `user_profiles`
2. Pastikan ada 2 baris data:
   - `pelamar_test` dengan role `Pelamar` dan `is_verified = true`
   - `hrd_test` dengan role `HRD` dan `is_verified = true`

### Step 4: Test Login

1. Buka aplikasi di browser: `frontend/pages/login.html`
2. Login dengan:
   - Email: `pelamar@test.com`
   - Password: `test123456`
3. Anda akan diarahkan ke Dashboard Pelamar
4. Logout dan login lagi dengan:
   - Email: `hrd@test.com`
   - Password: `test123456`
5. Anda akan diarahkan ke Dashboard HRD

## ✅ Checklist

- [ ] User `pelamar@test.com` dibuat di Authentication dengan Auto Confirm
- [ ] User `hrd@test.com` dibuat di Authentication dengan Auto Confirm
- [ ] Script SQL `create_test_users.sql` sudah dijalankan
- [ ] User profiles sudah muncul di Table Editor
- [ ] Bisa login dengan akun Pelamar
- [ ] Bisa login dengan akun HRD
- [ ] HRD bisa membuat lowongan (karena sudah terverifikasi)

## 🐛 Troubleshooting

**Error: "User not found" saat menjalankan script**
- Pastikan user sudah dibuat di Authentication terlebih dahulu
- Cek email sudah benar: `pelamar@test.com` dan `hrd@test.com`

**Tidak bisa login**
- Pastikan Auto Confirm = Yes saat membuat user
- Cek di Authentication > Users, pastikan user ada dan statusnya "Confirmed"

**HRD tidak bisa membuat lowongan**
- Cek di Table Editor > `user_profiles`
- Pastikan `is_verified = true` untuk user HRD
- Jika false, update manual: `UPDATE user_profiles SET is_verified = true WHERE role = 'HRD' AND email = 'hrd@test.com'`

## 📚 Dokumentasi Lengkap

Lihat [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) untuk dokumentasi lengkap tentang akun test.







