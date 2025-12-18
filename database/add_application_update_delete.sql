-- ============================================
-- Script untuk Menambahkan Fitur UPDATE dan DELETE Aplikasi
-- Jalankan script ini di Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TAMBAH KOLOM cover_letter_url (jika belum ada)
-- ============================================
-- Cek apakah kolom sudah ada, jika belum tambahkan
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'applications' 
        AND column_name = 'cover_letter_url'
    ) THEN
        ALTER TABLE public.applications 
        ADD COLUMN cover_letter_url TEXT;
        
        RAISE NOTICE 'Kolom cover_letter_url berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom cover_letter_url sudah ada';
    END IF;
END $$;

-- ============================================
-- 2. TAMBAH RLS POLICY UNTUK PELAMAR UPDATE APLIKASI SENDIRI
-- ============================================
-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Pelamar can update own applications" ON public.applications;

-- Buat policy baru untuk pelamar update aplikasi mereka sendiri
CREATE POLICY "Pelamar can update own applications" 
ON public.applications
FOR UPDATE 
USING (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'Pelamar'
    )
)
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'Pelamar'
    )
);

-- ============================================
-- 3. TAMBAH RLS POLICY UNTUK PELAMAR DELETE APLIKASI SENDIRI
-- ============================================
-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Pelamar can delete own applications" ON public.applications;

-- Buat policy baru untuk pelamar delete aplikasi mereka sendiri
CREATE POLICY "Pelamar can delete own applications" 
ON public.applications
FOR DELETE 
USING (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() 
        AND role = 'Pelamar'
    )
);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek kolom cover_letter_url
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'applications'
AND column_name = 'cover_letter_url';

-- Cek RLS policies untuk applications
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'applications'
AND policyname LIKE '%Pelamar%'
ORDER BY policyname;

-- ============================================
-- CATATAN
-- ============================================
-- Setelah menjalankan script ini:
-- 1. Pelamar dapat mengupdate aplikasi mereka sendiri (update berkas)
-- 2. Pelamar dapat menghapus aplikasi mereka sendiri (mengundurkan diri)
-- 3. Kolom cover_letter_url tersedia untuk menyimpan URL file cover letter PDF

