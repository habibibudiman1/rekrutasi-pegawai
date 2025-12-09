// Applications Management Module

// Helper function to get Supabase client
function getSupabaseClient() {
    return typeof supabase !== 'undefined' ? supabase : window.supabase;
}

class ApplicationsManager {
    constructor() {
        this.applications = [];
    }

    async applyForJob(jobId, applicationData) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'Pelamar') {
                throw new Error('Hanya pelamar yang dapat melamar pekerjaan');
            }

            // Check if user is authenticated
            if (!authManager.currentUser || !authManager.currentUser.id) {
                throw new Error('Anda belum login. Silakan login kembali.');
            }

            // Check if already applied
            const existing = await this.getApplicationByJob(jobId);
            if (existing) {
                throw new Error('Anda sudah melamar untuk lowongan ini');
            }

            // CV is required
            if (!applicationData.cvFile) {
                throw new Error('CV wajib diupload');
            }

            // Upload CV (required)
            let cvUrl = null;
            const uploadCVResult = await this.uploadCV(applicationData.cvFile);
            if (uploadCVResult.success) {
                cvUrl = uploadCVResult.url;
            } else {
                throw new Error('Gagal mengunggah CV: ' + uploadCVResult.error);
            }

            // Upload Cover Letter PDF if provided
            let coverLetterUrl = null;
            if (applicationData.coverLetterFile) {
                const uploadResult = await this.uploadCoverLetter(applicationData.coverLetterFile);
                if (uploadResult.success) {
                    coverLetterUrl = uploadResult.url;
                } else {
                    throw new Error('Gagal mengunggah Surat Lamaran: ' + uploadResult.error);
                }
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) throw new Error('Supabase client is not initialized');
            
            // If cover letter file is uploaded, use URL instead of text
            const coverLetterText = coverLetterUrl ? null : (applicationData.coverLetter || null);
            
            const { data, error } = await supabaseClient
                .from('applications')
                .insert({
                    user_id: authManager.currentUser.id,
                    job_id: jobId,
                    cv_url: cvUrl,
                    cover_letter: coverLetterText,
                    cover_letter_url: coverLetterUrl,
                    status: 'Pending'
                })
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                throw new Error(error.message || 'Gagal menyimpan aplikasi');
            }
            
            return { success: true, application: data };
        } catch (error) {
            console.error('Error applying for job:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadCV(file) {
        try {
            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                throw new Error('Ukuran file CV terlalu besar. Maksimal 5MB');
            }

            // Validate file type
            if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                throw new Error('Format file CV harus PDF');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) throw new Error('Supabase client is not initialized');
            
            if (!authManager.currentUser || !authManager.currentUser.id) {
                throw new Error('Anda belum login. Silakan login kembali.');
            }
            
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `${authManager.currentUser.id}_cv_${Date.now()}.${fileExt}`;
            const filePath = `cvs/${fileName}`;
            
            console.log('Uploading CV:', { fileName, filePath, size: file.size, userId: authManager.currentUser.id });
            
            const { data, error } = await supabaseClient.storage
                .from('applications')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Storage upload error:', error);
                if (error.message && error.message.includes('row-level security')) {
                    throw new Error('Gagal upload: Storage policies belum disetup dengan benar. Pastikan script setup_storage_policies.sql sudah dijalankan di Supabase SQL Editor.');
                }
                throw error;
            }

            const { data: { publicUrl } } = supabaseClient.storage
                .from('applications')
                .getPublicUrl(filePath);

            console.log('CV uploaded successfully:', publicUrl);
            return { success: true, url: publicUrl };
        } catch (error) {
            console.error('Error uploading CV:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadCoverLetter(file) {
        try {
            // Validate file
            if (!file) {
                throw new Error('File Surat Lamaran tidak ditemukan');
            }

            // Validate file size (5MB max)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                throw new Error('Ukuran file Surat Lamaran terlalu besar. Maksimal 5MB');
            }

            // Validate file type
            if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                throw new Error('Format file Surat Lamaran harus PDF');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
            }

            if (!authManager.currentUser || !authManager.currentUser.id) {
                throw new Error('Anda belum login. Silakan login kembali.');
            }
            
            const fileExt = file.name.split('.').pop() || 'pdf';
            const fileName = `${authManager.currentUser.id}_cover_letter_${Date.now()}.${fileExt}`;
            const filePath = `cover-letters/${fileName}`;
            
            console.log('Uploading Cover Letter:', { fileName, filePath, size: file.size });
            
            const { data, error } = await supabaseClient.storage
                .from('applications')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Storage upload error:', error);
                if (error.message.includes('row-level security')) {
                    throw new Error('Gagal upload: Storage policies belum disetup. Pastikan script setup_storage_policies.sql sudah dijalankan di Supabase.');
                }
                throw error;
            }

            const { data: { publicUrl } } = supabaseClient.storage
                .from('applications')
                .getPublicUrl(filePath);

            console.log('Cover Letter uploaded successfully:', publicUrl);
            return { success: true, url: publicUrl };
        } catch (error) {
            console.error('Error uploading cover letter:', error);
            return { success: false, error: error.message };
        }
    }

    async getApplicationByJob(jobId) {
        try {
            if (!authManager.isAuthenticated()) return null;

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            const { data, error } = await supabaseClient
                .from('applications')
                .select('*')
                .eq('user_id', authManager.currentUser.id)
                .eq('job_id', jobId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Error fetching application:', error);
            return null;
        }
    }

    async getUserApplications() {
        try {
            if (!authManager.isAuthenticated()) return [];

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            const { data, error } = await supabaseClient
                .from('applications')
                .select(`
                    *,
                    jobs (
                        id,
                        title,
                        company,
                        location
                    )
                `)
                .eq('user_id', authManager.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching user applications:', error);
            return [];
        }
    }

    async getJobApplications(jobId) {
        try {
            console.log('getJobApplications called for jobId:', jobId);
            
            const profile = await authManager.getCurrentUserProfile();
            console.log('Current user profile:', profile);
            
            if (!profile || profile.role !== 'HRD') {
                console.warn('User is not HRD or profile not found');
                throw new Error('Anda tidak memiliki izin. Pastikan Anda login sebagai HRD.');
            }

            if (!profile.is_verified) {
                console.warn('HRD is not verified');
                throw new Error('Akun HRD Anda belum diverifikasi. Silakan hubungi administrator.');
            }

            // Verify job ownership
            // Check if jobsManager is available, if not, query directly
            let job;
            if (typeof jobsManager !== 'undefined') {
                job = await jobsManager.getJobById(jobId);
            } else {
                const supabaseClient = getSupabaseClient();
                if (!supabaseClient) throw new Error('Supabase client is not initialized');
                
                const { data: jobData, error: jobError } = await supabaseClient
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .maybeSingle();
                if (jobError) {
                    console.error('Error fetching job:', jobError);
                    throw jobError;
                }
                job = jobData;
            }
            
            console.log('Job found:', job);
            
            if (!job) {
                console.warn('Job not found for jobId:', jobId);
                return [];
            }
            
            if (job.created_by !== authManager.currentUser.id) {
                console.warn('Job does not belong to current user. Job created_by:', job.created_by, 'Current user:', authManager.currentUser.id);
                // Don't throw error, just return empty array
                return [];
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client is not initialized');
            }
            
            console.log('Fetching applications for job:', jobId);
            
            // First, try simple query without join to avoid RLS/foreign key issues
            let { data: applications, error } = await supabaseClient
                .from('applications')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching applications (simple query):', error);
                // Try with join as fallback
                console.log('Trying query with join...');
                const result = await supabaseClient
                    .from('applications')
                    .select(`
                        *,
                        user_profiles (
                            id,
                            full_name,
                            email,
                            phone
                        )
                    `)
                    .eq('job_id', jobId)
                    .order('created_at', { ascending: false });
                
                applications = result.data;
                error = result.error;
                
                if (error) {
                    console.error('Error fetching applications (with join):', error);
                    return [];
                }
            }

            if (!applications || applications.length === 0) {
                console.log(`Found 0 applications for job ${jobId}`);
                return [];
            }

            console.log(`Found ${applications.length} applications, checking user_profiles...`);
            
            // Always fetch user_profiles separately to ensure we have the data
            // Check if we need to fetch profiles
            const needsProfileFetch = !applications[0].user_profiles || 
                                    !applications[0].user_profiles.full_name ||
                                    applications.some(app => !app.user_profiles);
            
            // Always try to fetch user_profiles separately to ensure we have the data
            // Even if it seems like profiles are included, they might be incomplete
            console.log('Fetching user profiles separately...');
            const userIds = [...new Set(applications.map(app => app.user_id).filter(id => id))];
            console.log('User IDs to fetch:', userIds);
            
            if (userIds.length > 0) {
                console.log('Attempting to fetch profiles for user IDs:', userIds);
                
                try {
                    // Fetch user_profiles (including email if column exists)
                    // Try with all columns first
                    let { data: profiles, error: profilesError } = await supabaseClient
                        .from('user_profiles')
                        .select('id, username, full_name, email, phone, role')
                        .in('id', userIds);

                    // If that fails or returns empty, try with minimal columns
                    if (profilesError || !profiles || profiles.length === 0) {
                        console.warn('First query failed or returned empty, trying with minimal columns...');
                        const minimalResult = await supabaseClient
                            .from('user_profiles')
                            .select('id, username, full_name, phone')
                            .in('id', userIds);
                        
                        if (!minimalResult.error && minimalResult.data && minimalResult.data.length > 0) {
                            profiles = minimalResult.data;
                            profilesError = null;
                            console.log('Minimal query succeeded, got profiles:', profiles);
                        }
                    }

                    if (profilesError) {
                        console.error('Error fetching user profiles:', profilesError);
                        console.error('Error details:', {
                            code: profilesError.code,
                            message: profilesError.message,
                            details: profilesError.details,
                            hint: profilesError.hint
                        });
                        
                        // If error is RLS related, log detailed info
                        if (profilesError.message && (profilesError.message.includes('policy') || profilesError.message.includes('recursion'))) {
                            console.warn('RLS policy error detected. This means HRD cannot read user_profiles.');
                            console.warn('SOLUTION: Run database/COMPLETE_FIX.sql in Supabase SQL Editor to fix RLS policies.');
                        }
                    } else {
                        console.log(`Fetched ${profiles?.length || 0} user profiles:`, profiles);
                        
                        if (profiles && profiles.length > 0) {
                            // Map profiles to applications
                            const profileMap = {};
                            profiles.forEach(profile => {
                                profileMap[profile.id] = profile;
                            });

                            applications = applications.map(app => {
                                const profile = profileMap[app.user_id];
                                return {
                                    ...app,
                                    user_profiles: profile || app.user_profiles || null
                                };
                            });
                            
                            console.log('Mapped profiles to applications successfully');
                            console.log('Mapped applications:', applications.map(app => ({
                                app_id: app.id,
                                user_id: app.user_id,
                                has_profile: !!app.user_profiles,
                                profile_name: app.user_profiles?.full_name || app.user_profiles?.username
                            })));
                        } else {
                            console.warn('No profiles found for user IDs:', userIds);
                            console.warn('This usually means RLS policy is blocking access.');
                            console.warn('SOLUTION: Run database/COMPLETE_FIX.sql in Supabase SQL Editor.');
                            // Try to use existing user_profiles if available
                            console.log('Using existing user_profiles from applications if available');
                        }
                    }
                } catch (fetchError) {
                    console.error('Exception while fetching user profiles:', fetchError);
                    console.error('Exception details:', fetchError.message, fetchError.stack);
                    // Continue with existing data
                }
            } else {
                console.warn('No user IDs found in applications');
            }
            
            // Log final data structure
            console.log(`Final applications data:`, applications.map(app => ({
                id: app.id,
                user_id: app.user_id,
                has_user_profiles: !!app.user_profiles,
                user_name: app.user_profiles?.full_name || 'N/A'
            })));
            
            return applications;
        } catch (error) {
            console.error('Error fetching job applications:', error);
            // Return empty array instead of throwing to allow other jobs to load
            return [];
        }
    }

    async updateApplicationStatus(applicationId, status, notes = null) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                throw new Error('Anda tidak memiliki izin');
            }

            // Verify application belongs to HRD's job
            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) throw new Error('Supabase client is not initialized');
            
            const { data: application, error: fetchError } = await supabaseClient
                .from('applications')
                .select('*, jobs!inner(created_by)')
                .eq('id', applicationId)
                .single();

            if (fetchError) throw fetchError;

            if (application.jobs.created_by !== authManager.currentUser.id) {
                throw new Error('Anda tidak memiliki izin untuk mengupdate aplikasi ini');
            }

            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            };

            if (notes) {
                updateData.notes = notes;
            }
            
            const { data, error } = await supabaseClient
                .from('applications')
                .update(updateData)
                .eq('id', applicationId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, application: data };
        } catch (error) {
            console.error('Error updating application status:', error);
            return { success: false, error: error.message };
        }
    }

    async getApplicationStats(jobId = null) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                return null;
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            let query = supabaseClient
                .from('applications')
                .select('status, jobs!inner(created_by)');

            if (jobId) {
                query = query.eq('job_id', jobId);
            } else {
                query = query.eq('jobs.created_by', authManager.currentUser.id);
            }

            const { data, error } = await query;

            if (error) throw error;

            const stats = {
                total: data.length,
                pending: data.filter(a => a.status === 'Pending').length,
                accepted: data.filter(a => a.status === 'Diterima').length,
                rejected: data.filter(a => a.status === 'Ditolak').length,
                lolosAdministrasi: data.filter(a => a.status === 'Lolos Administrasi').length,
                lolosTestTulis: data.filter(a => a.status === 'Lolos Test Tulis').length,
                lolosWawancara: data.filter(a => a.status === 'Lolos Wawancara').length
            };

            return stats;
        } catch (error) {
            console.error('Error fetching application stats:', error);
            return null;
        }
    }
}

const applicationsManager = new ApplicationsManager();
// Make it globally available
window.applicationsManager = applicationsManager;

