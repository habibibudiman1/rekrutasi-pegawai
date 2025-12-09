# Panduan Setup Website Rekrutasi Pegawai

## Prerequisites

1. Akun Supabase (gratis di https://supabase.com)
2. Node.js dan npm terinstall
3. Web browser modern

## Langkah-langkah Setup

### 1. Setup Supabase Project

1. Buat akun di [Supabase](https://supabase.com) jika belum punya
2. Buat project baru di Supabase
3. Catat **Project URL** dan **anon/public key** dari Settings > API

### 2. Setup Database

1. Buka Supabase Dashboard > SQL Editor
2. Copy seluruh isi file `database/schema.sql`
3. Paste dan jalankan di SQL Editor
4. Pastikan semua tabel dan policies berhasil dibuat

### 3. Setup Storage Bucket

1. Di Supabase Dashboard, buka Storage
2. Buat bucket baru dengan nama: `applications`
3. Set bucket sebagai **Public** (untuk akses CV)
4. Atau jika ingin private, sesuaikan policies di Storage

### 4. Konfigurasi Aplikasi

1. Buka setiap file HTML di folder `frontend/pages/`:
   - `index.html`
   - `login.html`
   - `register.html`
   - `dashboard-hrd.html`
   - `dashboard-pelamar.html`
   - `jobs.html`
   - `job-detail.html`
   - `about.html`

2. Cari script tag yang menginisialisasi Supabase (setelah script Supabase CDN)

3. Ganti `YOUR_SUPABASE_URL` dengan Project URL dari Supabase

4. Ganti `YOUR_SUPABASE_ANON_KEY` dengan anon key dari Supabase

Contoh di setiap file HTML:
```html
<script>
    // Initialize Supabase client
    const SUPABASE_URL = 'https://xxxxx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
```

**Catatan:** Supabase diinisialisasi inline di setiap file HTML untuk memastikan kompatibilitas dengan CDN.

### 5. Install Dependencies

```bash
npm install
```

### 6. Jalankan Aplikasi

Untuk development:
```bash
npm run dev
```

Atau gunakan live server lainnya seperti:
- VS Code Live Server extension
- Python: `python -m http.server 8000`
- PHP: `php -S localhost:8000`

### 7. Verifikasi HRD (Manual)

Untuk verifikasi HRD:
1. Buka Supabase Dashboard > Table Editor > `user_profiles`
2. Cari user dengan role 'HRD'
3. Edit dan set `is_verified` menjadi `true`

Atau jalankan SQL:
```sql
UPDATE user_profiles 
SET is_verified = true 
WHERE id = 'user-id-here' AND role = 'HRD';
```

## Struktur File

Lihat [STRUCTURE.md](STRUCTURE.md) untuk dokumentasi lengkap struktur folder.

Struktur utama:
```
Rekrutasi-Pegawai/
├── frontend/
│   ├── pages/             # Semua file HTML
│   ├── css/               # Stylesheet
│   └── js/                # JavaScript files
│       └── modules/       # JavaScript modules
├── backend/
│   └── config/           # Configuration files
├── database/
│   └── schema.sql        # Database schema
├── docs/                 # Documentation
├── assets/              # Static assets
└── package.json
```

## Fitur yang Tersedia

### Untuk Pelamar:
- ✅ Registrasi dan Login
- ✅ Mencari lowongan pekerjaan
- ✅ Melamar pekerjaan dengan upload CV
- ✅ Melihat status lamaran
- ✅ Dashboard dengan statistik

### Untuk HRD:
- ✅ Registrasi dan verifikasi
- ✅ Membuat, edit, hapus lowongan
- ✅ Melihat daftar pelamar
- ✅ Update status lamaran
- ✅ Statistik rekrutasi
- ✅ Dashboard lengkap

## Akun Test

Untuk memudahkan testing, Anda dapat membuat akun test. Lihat panduan lengkap di [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md).

**Quick Setup:**
1. Buat user di Supabase Auth dengan email `pelamar@test.com` dan `hrd@test.com` (password: `test123456`)
2. Jalankan script `database/create_test_users.sql` di SQL Editor
3. Login dengan akun test tersebut

## Troubleshooting

### Error: "Invalid API key"
- Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah benar di `js/config.js`

### Error: "relation does not exist"
- Pastikan sudah menjalankan `database/schema.sql` di Supabase SQL Editor

### Error: "permission denied"
- Pastikan Row Level Security (RLS) policies sudah dibuat
- Cek apakah user sudah login dengan benar

### CV tidak bisa diupload
- Pastikan bucket `applications` sudah dibuat di Storage
- Cek policies bucket apakah sudah public atau memiliki akses yang tepat

### HRD tidak bisa membuat lowongan
- Pastikan HRD sudah terverifikasi (`is_verified = true`)
- Cek di Supabase Table Editor > user_profiles

## Catatan Penting

1. **Keamanan**: Untuk production, gunakan environment variables untuk menyimpan credentials
2. **Storage**: Pastikan bucket storage memiliki policies yang sesuai
3. **Verifikasi HRD**: Di production, buat sistem verifikasi otomatis atau admin panel
4. **Email Verification**: Supabase memiliki fitur email verification, aktifkan di Authentication settings

## Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository atau hubungi tim development.

