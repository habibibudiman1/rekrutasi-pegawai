// Konfigurasi Supabase - TEMPLATE
// ============================================
// INSTRUKSI:
// 1. Copy file ini menjadi config.js
// 2. Ganti YOUR_SUPABASE_URL_HERE dengan Project URL dari Supabase
// 3. Ganti YOUR_SUPABASE_ANON_KEY_HERE dengan anon key dari Supabase
// 4. File config.js sudah di .gitignore, jadi tidak akan ter-commit
// ============================================

// CATATAN: Supabase sekarang diinisialisasi langsung di setiap file HTML
// File ini hanya berisi konstanta konfigurasi untuk referensi

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';  // Contoh: 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';  // Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Supabase client diinisialisasi di setiap HTML file menggunakan inline script
// setelah Supabase library dimuat dari CDN

