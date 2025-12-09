// Jobs Management Module

// Helper function to get Supabase client
function getSupabaseClient() {
    return typeof supabase !== 'undefined' ? supabase : window.supabase;
}

class JobsManager {
    constructor() {
        this.jobs = [];
    }

    async getAllJobs(filters = {}) {
        try {
            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                console.warn('getAllJobs: No Supabase client');
                return [];
            }
            
            // Try with join first
            let query = supabaseClient
                .from('jobs')
                .select('*, user_profiles!jobs_created_by_fkey(full_name, company_name)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.location) {
                query = query.ilike('location', `%${filters.location}%`);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
            }

            let { data, error } = await query;

            // If join fails, try without join
            if (error || !data) {
                console.warn('Join query failed, trying without join...');
                query = supabaseClient
                    .from('jobs')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                // Apply filters again
                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.location) {
                    query = query.ilike('location', `%${filters.location}%`);
                }
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
                }

                const { data: simpleData, error: simpleError } = await query;
                
                if (!simpleError && simpleData) {
                    data = simpleData;
                    error = null;
                } else if (simpleError) {
                    error = simpleError;
                }
            }

            if (error) {
                // Ignore PGRST116 (not found) - it's expected if no jobs exist
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching jobs:', error);
                }
                return [];
            }

            this.jobs = data || [];
            console.log('Jobs loaded:', this.jobs.length);
            return this.jobs;
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return [];
        }
    }

    async getJobById(jobId) {
        try {
            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                console.warn('getJobById: No Supabase client');
                return null;
            }
            
            // Try with join first
            let { data, error } = await supabaseClient
                .from('jobs')
                .select('*, user_profiles!jobs_created_by_fkey(full_name, company_name)')
                .eq('id', jobId)
                .eq('is_active', true)
                .maybeSingle();

            // If join fails, try without join
            if (error || !data) {
                console.warn('Join query failed, trying without join...');
                const { data: simpleData, error: simpleError } = await supabaseClient
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .eq('is_active', true)
                    .maybeSingle();
                
                if (!simpleError && simpleData) {
                    data = simpleData;
                    error = null;
                } else if (simpleError) {
                    error = simpleError;
                }
            }

            if (error) {
                // Ignore PGRST116 (not found) - it's expected for non-existent jobs
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching job:', error);
                }
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching job:', error);
            return null;
        }
    }

    async createJob(jobData) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                throw new Error('Anda tidak memiliki izin untuk membuat lowongan pekerjaan');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            const { data, error } = await supabaseClient
                .from('jobs')
                .insert({
                    title: jobData.title,
                    description: jobData.description,
                    requirements: jobData.requirements,
                    company: jobData.company,
                    location: jobData.location,
                    category: jobData.category,
                    salary_min: jobData.salaryMin,
                    salary_max: jobData.salaryMax,
                    employment_type: jobData.employmentType,
                    created_by: authManager.currentUser.id
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, job: data };
        } catch (error) {
            console.error('Error creating job:', error);
            return { success: false, error: error.message };
        }
    }

    async updateJob(jobId, jobData) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                throw new Error('Anda tidak memiliki izin untuk mengupdate lowongan pekerjaan');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            const { data, error } = await supabaseClient
                .from('jobs')
                .update({
                    title: jobData.title,
                    description: jobData.description,
                    requirements: jobData.requirements,
                    company: jobData.company,
                    location: jobData.location,
                    category: jobData.category,
                    salary_min: jobData.salaryMin,
                    salary_max: jobData.salaryMax,
                    employment_type: jobData.employmentType,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('created_by', authManager.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, job: data };
        } catch (error) {
            console.error('Error updating job:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteJob(jobId) {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                throw new Error('Anda tidak memiliki izin untuk menghapus lowongan pekerjaan');
            }

            if (!authManager.currentUser || !authManager.currentUser.id) {
                throw new Error('Anda belum login. Silakan login kembali.');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
            }
            
            // First verify the job belongs to the user
            const { data: job, error: fetchError } = await supabaseClient
                .from('jobs')
                .select('id, created_by')
                .eq('id', jobId)
                .single();

            if (fetchError) throw fetchError;

            if (!job || job.created_by !== authManager.currentUser.id) {
                throw new Error('Anda tidak memiliki izin untuk menghapus lowongan ini');
            }

            // Delete the job (hard delete)
            const { error } = await supabaseClient
                .from('jobs')
                .delete()
                .eq('id', jobId)
                .eq('created_by', authManager.currentUser.id);

            if (error) {
                console.error('Supabase delete error:', error);
                throw new Error(error.message || 'Gagal menghapus lowongan');
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting job:', error);
            return { success: false, error: error.message };
        }
    }

    async getHRDJobs() {
        try {
            const profile = await authManager.getCurrentUserProfile();
            if (!profile || profile.role !== 'HRD' || !profile.is_verified) {
                throw new Error('Anda tidak memiliki izin');
            }

            const supabaseClient = getSupabaseClient();
            if (!supabaseClient) return null;
            
            const { data, error } = await supabaseClient
                .from('jobs')
                .select('*')
                .eq('created_by', authManager.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching HRD jobs:', error);
            return [];
        }
    }
}

const jobsManager = new JobsManager();

