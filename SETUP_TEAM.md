# 🚀 Panduan Setup untuk Tim

Panduan ini membantu anggota tim untuk setup proyek **Rekrutasi Pegawai** dengan cepat menggunakan Supabase yang sama.

## 📋 Prerequisites

Sebelum memulai, pastikan Anda sudah memiliki:
- ✅ **Node.js** terinstall (versi 14 atau lebih baru)
- ✅ **Git** terinstall
- ✅ **Web Browser** modern (Chrome, Firefox, Edge)
- ✅ **Akses ke repository** proyek ini

## 🎯 Opsi Setup: Menggunakan Supabase yang Sama

Karena tim akan menggunakan Supabase yang sama, ada **3 cara** untuk setup:

### **🚀 Cara 0: Setup Otomatis (PALING MUDAH - Recommended!)**

Gunakan script otomatis yang akan melakukan semua setup untuk Anda!

#### Windows:
```bash
# Double-click file setup-team.bat
# ATAU jalankan di PowerShell/CMD:
setup-team.bat
```

#### Linux/Mac:
```bash
# Berikan permission execute terlebih dahulu
chmod +x setup-team.sh

# Jalankan script
./setup-team.sh
```

Script ini akan otomatis:
- ✅ Membuat file `frontend/js/supabase-init.js` dari template
- ✅ Mengisi konfigurasi Supabase yang benar
- ✅ Membuat file `backend/config/config.js` dari template
- ✅ Mengisi konfigurasi Supabase yang benar
- ✅ Menginstall semua dependencies (`npm install`)

**Setelah script selesai:**
1. Pastikan database sudah di-setup di Supabase Dashboard (cek Langkah 4 di bawah)
2. Jalankan aplikasi: `npm run dev`
3. Buka browser: `http://localhost:3000`

---

### **Cara 1: Setup Manual (Jika Script Tidak Bisa Digunakan)**

Jika repository Anda **private** atau hanya untuk tim internal, Anda bisa langsung menggunakan file konfigurasi yang sudah ada.

#### Langkah 1: Clone Repository
```bash
git clone <URL_REPOSITORY>
cd rekrutasi-pegawai
```

#### Langkah 2: Buat File Konfigurasi

**A. File Frontend (`frontend/js/supabase-init.js`)**

Buka file `frontend/js/supabase-init-template.js`, copy isinya, lalu buat file baru `frontend/js/supabase-init.js` dengan isi berikut:

```javascript
(function() {
    // KONFIGURASI SUPABASE UNTUK TIM
    const SUPABASE_URL = 'https://zibabfofuubjkgpvhstm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI';
    
    // ... (sisa kode dari template)
```

**Atau lebih mudah:** Copy file template dan edit baris 12-13:
```bash
# Windows (PowerShell)
Copy-Item frontend\js\supabase-init-template.js frontend\js\supabase-init.js

# Linux/Mac
cp frontend/js/supabase-init-template.js frontend/js/supabase-init.js
```

Lalu edit file `frontend/js/supabase-init.js` dan ganti baris 12-13 dengan:
```javascript
const SUPABASE_URL = 'https://zibabfofuubjkgpvhstm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI';
```

**B. File Backend (`backend/config/config.js`)**

Buka file `backend/config/config.template.js`, copy isinya, lalu buat file baru `backend/config/config.js` dengan isi berikut:

```javascript
const SUPABASE_URL = 'https://zibabfofuubjkgpvhstm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI';
```

**Atau lebih mudah:**
```bash
# Windows (PowerShell)
Copy-Item backend\config\config.template.js backend\config\config.js

# Linux/Mac
cp backend/config/config.template.js backend/config/config.js
```

Lalu edit file `backend/config/config.js` dan ganti baris 13-14 dengan:
```javascript
const SUPABASE_URL = 'https://zibabfofuubjkgpvhstm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI';
```

#### Langkah 3: Install Dependencies
```bash
npm install
```

#### Langkah 4: Verifikasi Database Sudah Setup

**PENTING:** Pastikan database sudah di-setup oleh admin proyek. Jika belum, ikuti langkah di [README.md](README.md) bagian "Setup Database".

Untuk verifikasi, cek di Supabase Dashboard:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Login dengan akun yang memiliki akses ke project
3. Buka **Table Editor** dan pastikan ada tabel:
   - `user_profiles`
   - `jobs`
   - `applications`
   - `career_history`
   - `education`
   - `licenses`

#### Langkah 5: Verifikasi Storage Bucket

Pastikan bucket `applications` sudah dibuat:
1. Di Supabase Dashboard, buka **Storage**
2. Pastikan ada bucket dengan nama `applications`
3. Pastikan bucket tersebut adalah **Public**

#### Langkah 6: Jalankan Aplikasi
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

Buka browser dan akses:
- `http://localhost:3000/` → Homepage
- `http://localhost:3000/login` → Login
- `http://localhost:3000/register` → Register

---

### **Cara 2: Setup Otomatis (Jika File Konfigurasi Sudah Di-Commit)**

Jika file konfigurasi sudah di-commit ke repository (untuk tim internal), setup menjadi lebih mudah:

#### Langkah 1: Clone Repository
```bash
git clone <URL_REPOSITORY>
cd rekrutasi-pegawai
```

#### Langkah 2: Install Dependencies
```bash
npm install
```

#### Langkah 3: Jalankan Aplikasi
```bash
npm run dev
```

Selesai! 🎉

---

## 🔧 Troubleshooting

### Masalah: File `supabase-init.js` tidak ditemukan
**Solusi:**
1. Pastikan Anda sudah membuat file dari template
2. Cek apakah file ada di `frontend/js/supabase-init.js`
3. Jika belum ada, ikuti Langkah 2 di Cara 1

### Masalah: Error "Supabase client not initialized"
**Solusi:**
1. Pastikan file `frontend/js/supabase-init.js` sudah dibuat dan berisi API keys yang benar
2. Pastikan menggunakan web server (jangan langsung buka file HTML)
3. Gunakan `npm run dev` untuk menjalankan aplikasi
4. Cek Console browser (F12) untuk error detail

### Masalah: Error 404 untuk CSS/JS
**Solusi:**
1. Pastikan menjalankan `npm run dev` dari root folder proyek
2. Pastikan mengakses URL yang benar: `http://localhost:3000/`
3. Jangan akses langsung file HTML tanpa server

### Masalah: Tidak bisa login atau register
**Solusi:**
1. Pastikan database sudah di-setup (cek Langkah 4)
2. Pastikan Supabase URL dan API key sudah benar
3. Cek Console browser (F12) untuk error detail
4. Jika perlu, minta admin untuk menjalankan script `database/RESTORE_LOGIN_FIRST.sql`

### Masalah: File tidak bisa diupload
**Solusi:**
1. Pastikan bucket `applications` sudah dibuat di Supabase Storage
2. Pastikan bucket adalah Public
3. Minta admin untuk menjalankan script `database/setup_storage_policies.sql`

---

## 📝 Catatan Penting

### ⚠️ Keamanan API Keys

**Untuk Repository Public:**
- ❌ **JANGAN** commit file `supabase-init.js` dan `config.js` ke repository public
- ✅ Gunakan Cara 1 (Setup Manual) dan buat file konfigurasi secara lokal

**Untuk Repository Private (Tim Internal):**
- ✅ Bisa commit file konfigurasi jika repository private
- ✅ Atau tetap gunakan Cara 1 untuk keamanan ekstra

### 🔑 Informasi Supabase

**Project URL:**
```
https://zibabfofuubjkgpvhstm.supabase.co
```

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmFiZm9mdXViamtncHZoc3RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzA5MTQsImV4cCI6MjA4MDUwNjkxNH0.m62SokdFd9yM20HsxjMmPqrRj3FNB1w_0YJXlHAv1nI
```

**Catatan:** 
- API keys ini adalah **anon/public key** yang aman untuk digunakan di frontend
- Jangan share **service_role key** (jika ada) karena memiliki akses penuh

---

## ✅ Checklist Setup

Gunakan checklist ini untuk memastikan setup sudah lengkap:

- [ ] Node.js sudah terinstall
- [ ] Repository sudah di-clone
- [ ] File `frontend/js/supabase-init.js` sudah dibuat dan dikonfigurasi
- [ ] File `backend/config/config.js` sudah dibuat dan dikonfigurasi
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Database sudah di-setup (verifikasi di Supabase Dashboard)
- [ ] Storage bucket `applications` sudah dibuat
- [ ] Aplikasi bisa dijalankan (`npm run dev`)
- [ ] Bisa mengakses `http://localhost:3000`
- [ ] Bisa register akun baru
- [ ] Bisa login

---

## 🆘 Butuh Bantuan?

Jika mengalami masalah:
1. Cek bagian **Troubleshooting** di atas
2. Cek dokumentasi lengkap di [README.md](README.md)
3. Hubungi admin proyek atau tim development
4. Cek Console browser (F12) untuk error detail

---

**Selamat coding! 🚀**


