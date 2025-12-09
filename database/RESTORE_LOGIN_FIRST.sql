-- ============================================
-- RESTORE LOGIN FIRST - Pulihkan Login Dulu
-- ============================================
-- Script ini akan MEMASTIKAN semua policy untuk login ada dan berfungsi
-- Jalankan script ini JIKA TIDAK BISA LOGIN
-- 
-- INSTRUKSI:
-- 1. Copy seluruh isi file ini
-- 2. Paste ke Supabase SQL Editor
-- 3. Klik RUN
-- 4. Coba login lagi

-- ============================================
-- STEP 1: CEK POLICY YANG ADA SEKARANG
-- ============================================
SELECT 
    'Policies BEFORE restore' as check_type,
    policyname as name,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- STEP 2: BUAT ULANG POLICY UNTUK LOGIN (PENTING!)
-- ============================================
-- Policy ini DIPERLUKAN untuk login - user harus bisa membaca profil mereka sendiri

-- Hapus dulu jika ada (untuk menghindari duplicate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Buat ulang policy untuk SELECT (membaca profil sendiri)
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- ============================================
-- STEP 3: PASTIKAN POLICY INSERT ADA
-- ============================================
-- Policy untuk insert (registrasi)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 4: PASTIKAN POLICY UPDATE ADA
-- ============================================
-- Policy untuk update profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

-- ============================================
-- STEP 5: HAPUS POLICY HRD YANG BERMASALAH (SEMENTARA)
-- ============================================
-- Hapus policy HRD yang menyebabkan recursion
-- Kita akan buat ulang nanti setelah login sudah berfungsi
DROP POLICY IF EXISTS "HRD can read applicant profiles" ON public.user_profiles;

-- ============================================
-- STEP 6: HAPUS FUNCTION HRD (SEMENTARA)
-- ============================================
-- Hapus function HRD yang mungkin bermasalah
-- Kita akan buat ulang nanti setelah login sudah berfungsi
DROP FUNCTION IF EXISTS is_verified_hrd(UUID);

-- ============================================
-- VERIFIKASI FINAL
-- ============================================
-- Cek semua policies untuk user_profiles
SELECT 
    'Policies AFTER restore' as check_type,
    policyname as name,
    cmd as command,
    CASE 
        WHEN policyname = 'Users can view own profile' THEN '✅ CRITICAL - Required for login!'
        WHEN policyname = 'Users can insert own profile' THEN '✅ Required for registration'
        WHEN policyname = 'Users can update own profile' THEN '✅ Required for profile update'
        ELSE '✅ OK'
    END as note
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- PENTING!
-- ============================================
-- Pastikan hasil verifikasi menunjukkan:
-- ✅ "Users can view own profile" (SELECT) - CRITICAL!
-- ✅ "Users can insert own profile" (INSERT)
-- ✅ "Users can update own profile" (UPDATE)
-- 
-- Policy HRD sengaja dihapus sementara untuk memastikan login berfungsi dulu
-- Setelah login berfungsi, kita bisa buat ulang policy HRD dengan benar

-- ============================================
-- SELESAI!
-- ============================================
-- Setelah script selesai:
-- 1. Pastikan 3 policy di atas ada (Users can view/insert/update own profile)
-- 2. Refresh aplikasi (Ctrl+F5)
-- 3. Coba login - seharusnya sudah bisa login
-- 4. Setelah login berfungsi, jalankan script FIX_INFINITE_RECURSION.sql untuk fix HRD


