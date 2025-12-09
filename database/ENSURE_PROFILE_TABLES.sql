-- ============================================
-- ENSURE PROFILE TABLES - Pastikan Tabel Profile Ada
-- ============================================
-- Script ini akan memastikan semua tabel dan policies untuk profile ada
-- Jalankan script ini jika tidak bisa menyimpan data profile (jabatan, pendidikan, lisensi)
-- 
-- Tabel yang dibuat:
-- - career_history: Riwayat karier/jabatan
-- - education: Riwayat pendidikan
-- - licenses: Lisensi dan sertifikasi
-- 
-- INSTRUKSI:
-- 1. Copy seluruh isi file ini
-- 2. Paste ke Supabase SQL Editor
-- 3. Klik RUN
-- 4. Refresh aplikasi (Ctrl+F5)

-- ============================================
-- STEP 1: CEK TABEL YANG ADA
-- ============================================
SELECT 
    'Tables BEFORE' as check_type,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('career_history', 'education', 'licenses')
ORDER BY table_name;

-- ============================================
-- STEP 2: BUAT TABEL CAREER_HISTORY (jika belum ada)
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: BUAT TABEL EDUCATION (jika belum ada)
-- ============================================
CREATE TABLE IF NOT EXISTS public.education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    institution_name TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: BUAT TABEL LICENSES (jika belum ada)
-- ============================================
CREATE TABLE IF NOT EXISTS public.licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    credential_id TEXT,
    credential_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: BUAT INDEX UNTUK PERFORMA
-- ============================================
CREATE INDEX IF NOT EXISTS idx_career_history_user_id ON public.career_history(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.education(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON public.licenses(user_id);

-- ============================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: HAPUS POLICY LAMA (jika ada) DAN BUAT ULANG
-- ============================================
-- Career History Policies
DROP POLICY IF EXISTS "Users can view own career history" ON public.career_history;
DROP POLICY IF EXISTS "Users can insert own career history" ON public.career_history;
DROP POLICY IF EXISTS "Users can update own career history" ON public.career_history;
DROP POLICY IF EXISTS "Users can delete own career history" ON public.career_history;

CREATE POLICY "Users can view own career history" ON public.career_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own career history" ON public.career_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own career history" ON public.career_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career history" ON public.career_history
    FOR DELETE USING (auth.uid() = user_id);

-- Education Policies
DROP POLICY IF EXISTS "Users can view own education" ON public.education;
DROP POLICY IF EXISTS "Users can insert own education" ON public.education;
DROP POLICY IF EXISTS "Users can update own education" ON public.education;
DROP POLICY IF EXISTS "Users can delete own education" ON public.education;

CREATE POLICY "Users can view own education" ON public.education
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education" ON public.education
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education" ON public.education
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own education" ON public.education
    FOR DELETE USING (auth.uid() = user_id);

-- Licenses Policies
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can insert own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can update own licenses" ON public.licenses;
DROP POLICY IF EXISTS "Users can delete own licenses" ON public.licenses;

CREATE POLICY "Users can view own licenses" ON public.licenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own licenses" ON public.licenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licenses" ON public.licenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own licenses" ON public.licenses
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: PASTIKAN FUNCTION UPDATE_UPDATED_AT ADA
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- STEP 9: BUAT TRIGGERS UNTUK UPDATED_AT
-- ============================================
DROP TRIGGER IF EXISTS update_career_history_updated_at ON public.career_history;
CREATE TRIGGER update_career_history_updated_at BEFORE UPDATE ON public.career_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_education_updated_at ON public.education;
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON public.education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_licenses_updated_at ON public.licenses;
CREATE TRIGGER update_licenses_updated_at BEFORE UPDATE ON public.licenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFIKASI FINAL
-- ============================================
-- Cek tabel
SELECT 
    'Tables AFTER' as check_type,
    table_name,
    '✅ EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('career_history', 'education', 'licenses')
ORDER BY table_name;

-- Cek RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd as command,
    '✅ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('career_history', 'education', 'licenses')
ORDER BY tablename, policyname;

-- ============================================
-- PENTING!
-- ============================================
-- Pastikan hasil verifikasi menunjukkan:
-- ✅ 3 tabel ada: career_history, education, licenses
-- ✅ Setiap tabel memiliki 4 policies: SELECT, INSERT, UPDATE, DELETE
-- 
-- Jika semua ✅, maka form profile seharusnya sudah bisa menyimpan data!

-- ============================================
-- SELESAI!
-- ============================================
-- Setelah script selesai:
-- 1. Refresh aplikasi (Ctrl+F5)
-- 2. Coba tambah jabatan/pendidikan/lisensi
-- 3. Seharusnya sudah bisa disimpan!

