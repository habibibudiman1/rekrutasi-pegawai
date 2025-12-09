# Tutorial: Push Project ke GitHub Desktop

Panduan lengkap untuk mengunggah project Rekrutasi Pegawai ke GitHub menggunakan GitHub Desktop.

## 📋 Prerequisites

- ✅ GitHub Desktop sudah terinstall
- ✅ Akun GitHub sudah dibuat
- ✅ Project folder sudah siap

## 🔒 Langkah 1: Verifikasi File Sensitif

Sebelum push ke GitHub, pastikan file-file sensitif sudah di-ignore:

### File yang TIDAK boleh di-commit:
- ✅ `frontend/js/supabase-init.js` (berisi API keys)
- ✅ `backend/config/config.js` (berisi API keys)
- ✅ `.env` files (jika ada)
- ✅ `node_modules/` (jika ada)

### File Template (BOLEH di-commit):
- ✅ `frontend/js/supabase-init.template.js` (template tanpa API keys)

**Cek `.gitignore` sudah benar:**
```
# Supabase config files (JANGAN commit API keys!)
frontend/js/supabase-init.js
backend/config/config.js
```

---

## 🚀 Langkah 2: Inisialisasi Git Repository

### Opsi A: Melalui GitHub Desktop (Recommended)

1. **Buka GitHub Desktop**
   - Klik menu `File` → `Add Local Repository...`
   - Atau klik tombol `+` di pojok kiri atas → pilih `Add Existing Repository...`

2. **Pilih Folder Project**
   - Klik `Choose...` atau `Browse...`
   - Navigasi ke folder project:
     ```
     C:\MATAKULIAH SEMESTER 5\SEMESTER 5\MANAJEMEN PROYEK SISTEM INFORMASI\Rekrutasi-Pegawai
     ```
   - Klik `Add repository`

3. **Jika folder belum ada repository Git:**
   - GitHub Desktop akan menanyakan apakah ingin membuat repository baru
   - Klik `Create a Repository` atau `Yes`
   - Isi:
     - **Name:** `Rekrutasi-Pegawai` (atau nama yang Anda inginkan)
     - **Description:** (opsional) "Sistem Rekrutasi Pegawai dengan Supabase"
     - **Local Path:** Pastikan sudah benar
     - **Git ignore:** Pilih `None` (karena sudah ada `.gitignore`)
     - **License:** (opsional) Pilih sesuai kebutuhan
   - Klik `Create Repository`

### Opsi B: Melalui Command Line (Alternatif)

Jika Anda lebih nyaman dengan command line:

```powershell
# Buka PowerShell di folder project
cd "C:\MATAKULIAH SEMESTER 5\SEMESTER 5\MANAJEMEN PROYEK SISTEM INFORMASI\Rekrutasi-Pegawai"

# Inisialisasi git repository
git init

# Tambahkan remote (akan dilakukan setelah membuat repo di GitHub)
# git remote add origin https://github.com/USERNAME/Rekrutasi-Pegawai.git
```

Kemudian buka folder tersebut di GitHub Desktop.

---

## 📝 Langkah 3: Review File yang Akan Di-commit

Setelah repository ditambahkan, GitHub Desktop akan menampilkan semua file yang belum di-commit.

### ✅ Pastikan File Sensitif TIDAK Muncul:

**File yang TIDAK boleh muncul di daftar:**
- ❌ `frontend/js/supabase-init.js`
- ❌ `backend/config/config.js`
- ❌ `.env` (jika ada)
- ❌ `node_modules/` (jika ada)

**File yang BOLEH muncul:**
- ✅ `frontend/js/supabase-init.template.js`
- ✅ Semua file `.html`, `.css`, `.js` lainnya
- ✅ `README.md`
- ✅ `database/*.sql`
- ✅ `docs/*.md`
- ✅ `.gitignore`

### Jika File Sensitif Muncul:

1. **Cek `.gitignore`** - Pastikan sudah benar
2. **Hapus dari staging** - Klik kanan file → `Discard changes` atau uncheck di daftar
3. **Jika file sudah pernah di-commit sebelumnya:**
   ```powershell
   # Hapus dari git tracking (tapi tetap di local)
   git rm --cached frontend/js/supabase-init.js
   git rm --cached backend/config/config.js
   ```

---

## 💾 Langkah 4: Buat Commit Pertama

1. **Di GitHub Desktop, di panel kiri bawah:**
   - **Summary:** Isi dengan `Initial commit: Sistem Rekrutasi Pegawai`
   - **Description:** (opsional) Tambahkan deskripsi:
     ```
     - Setup project structure
     - Integrasi dengan Supabase
     - Dashboard HRD dan Pelamar
     - Sistem aplikasi lowongan kerja
     ```

2. **Pilih file yang akan di-commit:**
   - Centang semua file yang ingin di-commit (kecuali file sensitif)
   - Atau klik `Select all` jika semua file aman

3. **Klik tombol `Commit to main`** (atau `Commit to master`)

---

## 🌐 Langkah 5: Buat Repository di GitHub

### Melalui GitHub Desktop:

1. **Klik tombol `Publish repository`** di bagian atas
   - Atau menu `Repository` → `Publish repository`

2. **Isi informasi repository:**
   - **Name:** `Rekrutasi-Pegawai` (atau nama yang diinginkan)
   - **Description:** (opsional) "Sistem Rekrutasi Pegawai dengan Supabase"
   - **Keep this code private:** 
     - ✅ **Centang** jika ingin repository private (disarankan untuk project akademik)
     - ❌ **Jangan centang** jika ingin public

3. **Klik `Publish Repository`**

4. **Tunggu proses upload selesai**
   - GitHub Desktop akan menampilkan progress
   - Setelah selesai, tombol akan berubah menjadi `View on GitHub`

---

## 🔄 Langkah 6: Push ke GitHub

Jika repository sudah dibuat di GitHub sebelumnya:

1. **Tambahkan remote repository:**
   - Menu `Repository` → `Repository settings...` → tab `Remote`
   - Atau melalui command line:
     ```powershell
     git remote add origin https://github.com/USERNAME/Rekrutasi-Pegawai.git
     ```

2. **Push commit:**
   - Klik tombol `Push origin` di bagian atas
   - Atau menu `Repository` → `Push`
   - Tunggu hingga selesai

---

## ✅ Verifikasi

Setelah push berhasil:

1. **Klik `View on GitHub`** untuk membuka repository di browser
2. **Cek file yang ter-upload:**
   - Pastikan `frontend/js/supabase-init.js` **TIDAK ada**
   - Pastikan `backend/config/config.js` **TIDAK ada**
   - Pastikan `frontend/js/supabase-init.template.js` **ADA**

3. **Cek `.gitignore`:**
   - File `.gitignore` harus ada dan berisi aturan untuk file sensitif

---

## 🛠️ Troubleshooting

### Problem 1: File Sensitif Masih Muncul

**Solusi:**
```powershell
# Hapus dari git tracking
git rm --cached frontend/js/supabase-init.js
git rm --cached backend/config/config.js

# Commit perubahan
git commit -m "Remove sensitive files from tracking"

# Push
git push
```

### Problem 2: "Repository already exists"

**Solusi:**
- Repository dengan nama yang sama sudah ada di GitHub
- Ganti nama repository atau hapus yang lama
- Atau gunakan nama yang berbeda

### Problem 3: "Authentication failed"

**Solusi:**
1. Di GitHub Desktop: `File` → `Options` → `Accounts`
2. Pastikan sudah login dengan akun GitHub yang benar
3. Jika belum, klik `Sign in` dan ikuti instruksi

### Problem 4: "Large files detected"

**Solusi:**
- File terlalu besar (>100MB)
- Tambahkan ke `.gitignore`:
  ```
  # Large files
  *.zip
  *.rar
  *.7z
  *.pdf
  # atau file spesifik yang besar
  ```

### Problem 5: "Nothing to commit"

**Solusi:**
- Semua file sudah di-commit
- Cek di tab `History` apakah commit sudah ada
- Jika belum ada commit, pastikan file sudah di-staging (centang di panel kiri)

---

## 📌 Checklist Sebelum Push

Sebelum push ke GitHub, pastikan:

- [ ] `.gitignore` sudah benar dan file sensitif sudah di-ignore
- [ ] File `supabase-init.js` dan `config.js` **TIDAK** muncul di daftar file
- [ ] File `supabase-init.template.js` **ADA** di daftar file
- [ ] Semua file penting sudah di-staging
- [ ] Commit message sudah jelas
- [ ] Sudah login ke GitHub Desktop dengan akun yang benar
- [ ] Repository name sudah ditentukan (private atau public)

---

## 🔐 Keamanan

**PENTING:** Setelah push ke GitHub:

1. **Jika API keys terlanjur ter-commit:**
   - **SEGERA** ganti API keys di Supabase Dashboard
   - Hapus file dari git history (gunakan `git filter-branch` atau GitHub's secret scanning)
   - Update `.gitignore` dan pastikan file tidak ter-commit lagi

2. **Best Practices:**
   - ✅ Gunakan environment variables untuk API keys
   - ✅ Gunakan template files untuk dokumentasi
   - ✅ Jangan commit file dengan data sensitif
   - ✅ Gunakan private repository untuk project akademik

---

## 📚 Next Steps

Setelah project berhasil di-push:

1. **Tambahkan README.md yang informatif** (sudah ada)
2. **Tambahkan LICENSE** (jika perlu)
3. **Setup GitHub Actions** (jika perlu CI/CD)
4. **Tambahkan collaborators** (jika bekerja dalam tim)
5. **Buat branches** untuk fitur baru (jika perlu)

---

## 💡 Tips

- **Commit secara berkala:** Jangan tunggu sampai banyak perubahan, commit setiap fitur selesai
- **Gunakan commit message yang jelas:** Deskripsikan apa yang diubah, bukan hanya "update"
- **Review sebelum commit:** Selalu cek file yang akan di-commit
- **Backup lokal:** Simpan backup project di tempat lain juga
- **Branch untuk fitur besar:** Gunakan branch terpisah untuk fitur besar

---

## 🆘 Butuh Bantuan?

Jika mengalami masalah:

1. Cek dokumentasi GitHub Desktop: https://docs.github.com/en/desktop
2. Cek error message di GitHub Desktop (biasanya ada penjelasan)
3. Cek console/logs untuk detail error
4. Pastikan koneksi internet stabil

---

**Selamat! Project Anda sekarang sudah di GitHub! 🎉**

