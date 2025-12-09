# Troubleshooting: Profile CRUD Tidak Bisa Disimpan

## Masalah
Tampilan form sudah ada, tapi data tidak bisa disimpan.

## Solusi

### 1. Pastikan Tabel Database Sudah Dibuat

**Langkah:**
1. Buka Supabase Dashboard → SQL Editor
2. Buka file `database/add_profile_tables.sql`
3. Copy seluruh isi file
4. Paste ke SQL Editor
5. Klik **Run**
6. Pastikan tidak ada error

**Tabel yang harus ada:**
- `career_history`
- `education`
- `licenses`

**Cek apakah tabel sudah ada:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('career_history', 'education', 'licenses');
```

### 2. Cek Row Level Security (RLS) Policies

Pastikan RLS policies sudah dibuat dengan benar. Jalankan query ini untuk mengecek:

```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('career_history', 'education', 'licenses');
```

Jika tidak ada policies, jalankan kembali script `add_profile_tables.sql`.

### 3. Cek Browser Console

1. Buka Developer Tools (F12)
2. Buka tab **Console**
3. Coba simpan data
4. Lihat error message yang muncul

**Error umum:**
- `relation "career_history" does not exist` → Tabel belum dibuat
- `new row violates row-level security policy` → RLS policy bermasalah
- `Supabase client tidak tersedia` → Refresh halaman
- `Anda belum login` → Login kembali

### 4. Cek Authentication

Pastikan Anda sudah login:
1. Cek apakah ada session di Supabase
2. Cek `authManager.currentUser` di console
3. Jika null, login kembali

### 5. Test Manual di Supabase

Coba insert data manual untuk test:

```sql
-- Test insert career_history (ganti user_id dengan ID user Anda)
INSERT INTO public.career_history (
    user_id,
    job_title,
    company_name,
    start_date,
    is_current
) VALUES (
    'YOUR_USER_ID_HERE',
    'Software Developer',
    'PT. Test',
    '2024-01-01',
    true
);
```

Jika berhasil, berarti tabel dan RLS sudah benar.

### 6. Cek Network Tab

1. Buka Developer Tools → **Network** tab
2. Coba simpan data
3. Cari request ke Supabase
4. Lihat response:
   - Status 200 = Success
   - Status 401 = Not authenticated
   - Status 403 = RLS policy violation
   - Status 404 = Table not found

### 7. Refresh dan Clear Cache

1. Hard refresh: `Ctrl + F5` atau `Ctrl + Shift + R`
2. Clear browser cache
3. Coba lagi

## Checklist

- [ ] Tabel `career_history`, `education`, `licenses` sudah dibuat
- [ ] RLS policies sudah dibuat
- [ ] User sudah login
- [ ] Tidak ada error di console
- [ ] Network request berhasil (status 200)
- [ ] Form validation berjalan (field required terisi)

## Jika Masih Bermasalah

1. **Screenshot error di console**
2. **Screenshot Network tab** (request ke Supabase)
3. **Cek Supabase Logs**:
   - Dashboard → Logs → API Logs
   - Lihat error yang muncul saat save

## Quick Fix

Jika semua sudah dicek tapi masih error, coba:

1. Logout dan login kembali
2. Refresh halaman (Ctrl + F5)
3. Pastikan script SQL sudah dijalankan dengan benar
4. Cek apakah user_id di `authManager.currentUser.id` tidak null





