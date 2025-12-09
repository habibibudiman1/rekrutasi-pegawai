-- Database Schema untuk Website Rekrutasi Pegawai
-- Jalankan script ini di Supabase SQL Editor

-- Tabel Users (menggunakan Supabase Auth, tabel ini untuk metadata tambahan)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    bio TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    company_name TEXT, -- Hanya untuk HRD
    role TEXT CHECK (role IN ('HRD', 'Pelamar')) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE, -- Verifikasi untuk HRD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    category TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    employment_type TEXT, -- Full-time, Part-time, Contract, etc.
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabel Applications
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('Pending', 'Lolos Administrasi', 'Lolos Test Tulis', 'Lolos Wawancara', 'Diterima', 'Ditolak')) DEFAULT 'Pending',
    cv_url TEXT,
    cover_letter TEXT,
    notes TEXT, -- Catatan dari HRD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, job_id) -- Satu pelamar hanya bisa melamar sekali per lowongan
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON public.jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policies untuk user_profiles
-- Users dapat membuat profil mereka sendiri saat registrasi
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users dapat melihat profil mereka sendiri
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users dapat update profil mereka sendiri
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies untuk jobs
-- Semua orang dapat melihat jobs yang aktif
CREATE POLICY "Anyone can view active jobs" ON public.jobs
    FOR SELECT USING (is_active = TRUE);

-- HRD dapat melihat semua jobs mereka (termasuk yang tidak aktif)
CREATE POLICY "HRD can view own jobs" ON public.jobs
    FOR SELECT USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
        )
    );

-- HRD yang terverifikasi dapat membuat jobs
CREATE POLICY "Verified HRD can create jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
        )
    );

-- HRD dapat update jobs mereka sendiri
CREATE POLICY "HRD can update own jobs" ON public.jobs
    FOR UPDATE USING (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
        )
    );

-- HRD dapat delete jobs mereka sendiri
CREATE POLICY "HRD can delete own jobs" ON public.jobs
    FOR DELETE USING (
        auth.uid() = created_by AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
        )
    );

-- Policies untuk applications
-- Pelamar dapat melihat aplikasi mereka sendiri
CREATE POLICY "Users can view own applications" ON public.applications
    FOR SELECT USING (auth.uid() = user_id);

-- HRD dapat melihat aplikasi untuk jobs mereka
CREATE POLICY "HRD can view applications for their jobs" ON public.applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.created_by = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
            )
        )
    );

-- Pelamar dapat membuat aplikasi
CREATE POLICY "Pelamar can create applications" ON public.applications
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'Pelamar'
        )
    );

-- HRD dapat update status aplikasi untuk jobs mereka
CREATE POLICY "HRD can update application status" ON public.applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.jobs 
            WHERE jobs.id = applications.job_id 
            AND jobs.created_by = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE id = auth.uid() AND role = 'HRD' AND is_verified = TRUE
            )
        )
    );

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers untuk updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

