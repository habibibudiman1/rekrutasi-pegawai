-- ============================================
-- Setup Storage Policies untuk Upload File
-- Jalankan script ini di Supabase SQL Editor
-- ============================================
-- Pastikan bucket 'applications' sudah dibuat di Storage terlebih dahulu!

-- ============================================
-- 1. HAPUS POLICIES LAMA (jika ada)
-- ============================================
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "HRD can read application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload CV" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload cover letter" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own application files" ON storage.objects;
DROP POLICY IF EXISTS "HRD can read all application files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own application files" ON storage.objects;

-- ============================================
-- 2. POLICY UNTUK UPLOAD FILE (CV & Cover Letter)
-- ============================================
-- User dapat upload file ke folder mereka sendiri
CREATE POLICY "Users can upload own application files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'applications' AND
    (
        -- CV files: cvs/{user_id}_cv_{timestamp}.pdf
        name LIKE 'cvs/' || auth.uid()::text || '_cv_%'
    ) OR (
        -- Cover letter files: cover-letters/{user_id}_cover_letter_{timestamp}.pdf
        name LIKE 'cover-letters/' || auth.uid()::text || '_cover_letter_%'
    )
);

-- ============================================
-- 3. POLICY UNTUK READ FILE SENDIRI
-- ============================================
-- User dapat membaca file mereka sendiri
CREATE POLICY "Users can read own application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'applications' AND
    (
        -- CV files: cvs/{user_id}_cv_{timestamp}.pdf
        name LIKE 'cvs/' || auth.uid()::text || '_cv_%'
    ) OR (
        -- Cover letter files: cover-letters/{user_id}_cover_letter_{timestamp}.pdf
        name LIKE 'cover-letters/' || auth.uid()::text || '_cover_letter_%'
    )
);

-- ============================================
-- 4. POLICY UNTUK HRD READ SEMUA FILE
-- ============================================
-- HRD yang terverifikasi dapat membaca semua file aplikasi
CREATE POLICY "HRD can read all application files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'applications' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'HRD'
        AND is_verified = TRUE
    )
);

-- ============================================
-- 5. POLICY UNTUK DELETE FILE SENDIRI
-- ============================================
-- User dapat menghapus file mereka sendiri
CREATE POLICY "Users can delete own application files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'applications' AND
    (
        -- CV files: cvs/{user_id}_cv_{timestamp}.pdf
        name LIKE 'cvs/' || auth.uid()::text || '_cv_%'
    ) OR (
        -- Cover letter files: cover-letters/{user_id}_cover_letter_{timestamp}.pdf
        name LIKE 'cover-letters/' || auth.uid()::text || '_cover_letter_%'
    )
);

-- ============================================
-- VERIFIKASI
-- ============================================
-- Cek policies yang sudah dibuat
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%application%'
ORDER BY policyname;

