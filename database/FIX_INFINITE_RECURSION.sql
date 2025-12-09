-- ============================================
-- FIX INFINITE RECURSION - Perbaikan Definitif
-- ============================================
-- Script ini akan memperbaiki error "infinite recursion detected in policy"
-- 
-- INSTRUKSI:
-- 1. Copy seluruh isi file ini
-- 2. Paste ke Supabase SQL Editor
-- 3. Klik RUN
-- 4. Refresh aplikasi (Ctrl+F5)

-- ============================================
-- STEP 1: HAPUS SEMUA POLICY HRD YANG BERMASALAH
-- ============================================
-- Hapus semua policy HRD yang mungkin menyebabkan recursion
DROP POLICY IF EXISTS "HRD can read applicant profiles" ON public.user_profiles;

-- ============================================
-- STEP 2: HAPUS FUNCTION LAMA
-- ============================================
DROP FUNCTION IF EXISTS is_verified_hrd(UUID);

-- ============================================
-- STEP 3: BUAT FUNCTION DENGAN SECURITY DEFINER
-- ============================================
-- Function ini menggunakan SECURITY DEFINER untuk bypass RLS
-- Sehingga tidak akan menyebabkan recursion
CREATE OR REPLACE FUNCTION is_verified_hrd(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    -- Function ini bypass RLS karena menggunakan SECURITY DEFINER
    -- Jadi tidak akan menyebabkan recursion
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = user_id
        AND role = 'HRD'
        AND is_verified = TRUE
    );
END;
$$;

-- ============================================
-- STEP 4: GRANT EXECUTE PERMISSION
-- ============================================
-- Pastikan authenticated users bisa execute function ini
GRANT EXECUTE ON FUNCTION is_verified_hrd(UUID) TO authenticated;

-- ============================================
-- STEP 5: BUAT POLICY HRD YANG BARU (TANPA RECURSION)
-- ============================================
-- Policy ini menggunakan function untuk cek HRD
-- Function menggunakan SECURITY DEFINER sehingga tidak akan recursion
CREATE POLICY "HRD can read applicant profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
    -- User dapat membaca profil mereka sendiri (penting untuk login!)
    auth.uid() = id
    OR
    -- HRD yang terverifikasi dapat membaca profil pelamar
    -- Menggunakan function yang sudah bypass RLS
    (
        is_verified_hrd(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.applications a
            INNER JOIN public.jobs j ON a.job_id = j.id
            WHERE a.user_id = user_profiles.id
            AND j.created_by = auth.uid()
        )
    )
);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek function
SELECT 
    'Function Check' as check_type,
    proname as name,
    prosecdef as is_security_definer,
    CASE WHEN prosecdef THEN '✅ SECURITY DEFINER' ELSE '❌ NOT SECURITY DEFINER' END as status
FROM pg_proc 
WHERE proname = 'is_verified_hrd';

-- Cek policy
SELECT 
    'Policy Check' as check_type,
    policyname as name,
    cmd as command,
    '✅ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
AND policyname = 'HRD can read applicant profiles';

-- Cek semua policies untuk user_profiles
SELECT 
    'All Policies' as check_type,
    policyname as name,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_profiles'
ORDER BY policyname;

-- ============================================
-- PENTING!
-- ============================================
-- Pastikan hasil verifikasi menunjukkan:
-- ✅ Function is_verified_hrd dengan SECURITY DEFINER = true
-- ✅ Policy "HRD can read applicant profiles" ada
-- ✅ Policy "Users can view own profile" masih ada (penting untuk login!)
-- 
-- Jika semua ✅, maka recursion seharusnya sudah hilang!

-- ============================================
-- SELESAI!
-- ============================================
-- Setelah script selesai:
-- 1. Refresh aplikasi (Ctrl+F5)
-- 2. Cek Console (F12) - error "infinite recursion" seharusnya sudah hilang
-- 3. Coba login - seharusnya sudah bisa login
-- 4. HRD seharusnya bisa membaca profil pelamar tanpa error


