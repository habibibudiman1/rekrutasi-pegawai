# Panduan Push ke GitHub - Branch tubesmanprosi

## 📋 Langkah-langkah Push ke GitHub

### **LANGKAH 1: Cek Status Git**
```bash
git status
```
Ini akan menampilkan file-file yang sudah diubah atau belum di-commit.

---

### **LANGKAH 2: Cek Branch Saat Ini**
```bash
git branch
```
Pastikan Anda berada di branch yang benar. Jika belum di branch `tubesmanprosi`, lanjut ke Langkah 3.

---

### **LANGKAH 3: Pindah ke Branch tubesmanprosi**

**Jika branch sudah ada:**
```bash
git checkout tubesmanprosi
```

**Jika branch belum ada, buat branch baru:**
```bash
git checkout -b tubesmanprosi
```

**Atau jika ingin membuat dari branch lain (misalnya main/master):**
```bash
git checkout main
git pull origin main
git checkout -b tubesmanprosi
```

---

### **LANGKAH 4: Add File yang Diubah**

**Add semua file yang diubah:**
```bash
git add .
```

**Atau add file spesifik saja:**
```bash
git add frontend/js/modules/applications.js
git add frontend/js/dashboard-pelamar.js
git add frontend/pages/dashboard-pelamar.html
git add database/add_application_update_delete.sql
```

**Cek file yang akan di-commit:**
```bash
git status
```

---

### **LANGKAH 5: Commit Perubahan**

```bash
git commit -m "feat: Tambah fitur UPDATE dan DELETE untuk aplikasi pelamar

- Tambah fungsi updateApplicationDocuments() untuk update CV dan Cover Letter
- Tambah fungsi deleteApplication() untuk withdraw application
- Tambah tombol Update dan Delete di halaman Status Lamaran
- Tambah modal untuk update dokumen aplikasi
- Tambah script SQL untuk RLS policies dan kolom cover_letter_url"
```

**Atau commit message yang lebih singkat:**
```bash
git commit -m "feat: Tambah fitur update dan delete aplikasi pelamar"
```

---

### **LANGKAH 6: Push ke GitHub**

**Jika branch tubesmanprosi belum ada di remote:**
```bash
git push -u origin tubesmanprosi
```

**Jika branch sudah ada di remote:**
```bash
git push origin tubesmanprosi
```

**Atau jika ada konflik dan perlu force push (HATI-HATI!):**
```bash
git push origin tubesmanprosi --force
```

---

## 🔄 Jika Ada Konflik

### **Jika ada perubahan di remote yang belum di-pull:**

1. **Pull dulu perubahan dari remote:**
```bash
git pull origin tubesmanprosi
```

2. **Selesaikan konflik jika ada** (buka file yang conflict dan edit manual)

3. **Add file yang sudah di-resolve:**
```bash
git add .
```

4. **Commit merge:**
```bash
git commit -m "merge: Resolve conflict dengan remote branch"
```

5. **Push lagi:**
```bash
git push origin tubesmanprosi
```

---

## 📝 File yang Akan Di-commit

Berdasarkan perubahan yang sudah dibuat, file-file berikut akan di-commit:

1. ✅ `frontend/js/modules/applications.js` - Fungsi update dan delete
2. ✅ `frontend/js/dashboard-pelamar.js` - Handler dan UI update/delete
3. ✅ `frontend/pages/dashboard-pelamar.html` - Modal update aplikasi
4. ✅ `database/add_application_update_delete.sql` - Script SQL untuk database

---

## ⚠️ Catatan Penting

1. **Jangan commit file sensitif:**
   - `frontend/js/supabase-init.js` (sudah di .gitignore)
   - `backend/config/config.js` (sudah di .gitignore)
   - File `.env` (sudah di .gitignore)

2. **Pastikan tidak ada API keys atau credentials** yang ter-commit

3. **Test dulu di local** sebelum push ke GitHub

---

## 🚀 Quick Command (All-in-One)

Jika Anda yakin semua sudah benar, bisa jalankan sekaligus:

```bash
# Cek status
git status

# Pindah ke branch tubesmanprosi (atau buat baru)
git checkout tubesmanprosi || git checkout -b tubesmanprosi

# Add semua perubahan
git add .

# Commit
git commit -m "feat: Tambah fitur update dan delete aplikasi pelamar"

# Push
git push -u origin tubesmanprosi
```

---

## ✅ Verifikasi Setelah Push

Setelah push berhasil, cek di GitHub:
1. Buka repository di GitHub
2. Pilih branch `tubesmanprosi`
3. Pastikan semua file sudah ter-commit dengan benar
4. Cek commit message sudah sesuai

---

## 📞 Troubleshooting

### **Error: "branch tubesmanprosi does not exist"**
```bash
# Buat branch baru
git checkout -b tubesmanprosi
git push -u origin tubesmanprosi
```

### **Error: "Your branch is ahead of origin"**
```bash
# Push saja
git push origin tubesmanprosi
```

### **Error: "Permission denied"**
- Pastikan sudah login ke GitHub
- Cek SSH key atau token sudah benar
- Cek permission repository

### **Error: "Remote repository not found"**
```bash
# Cek remote URL
git remote -v

# Jika belum ada, tambah remote
git remote add origin https://github.com/USERNAME/REPO.git
```

---

**Selamat! Perubahan Anda sudah ter-push ke GitHub! 🎉**

