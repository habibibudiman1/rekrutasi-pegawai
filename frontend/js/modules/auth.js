// Authentication Module
// Handle login, register, logout, and session management

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        // Wait for Supabase to be ready
        await this.waitForSupabase();
        
        const supabaseClient = this.getSupabaseClient();
        if (!supabaseClient) {
            console.warn('Supabase client not ready yet, will retry later');
            // Retry after a delay
            setTimeout(() => this.init(), 500);
            return;
        }
        
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                this.currentUser = session.user;
                // Load profile but don't fail if it errors (especially 406 errors)
                try {
                    await this.loadUserProfile();
                } catch (profileError) {
                    // Ignore profile loading errors during init (non-critical)
                    if (!profileError.message?.includes('406') && profileError.status !== 406) {
                        console.warn('Profile load error during init (non-critical):', profileError.message);
                    }
                }
            }

            // Listen for auth changes
            supabaseClient.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    try {
                        await this.loadUserProfile();
                    } catch (profileError) {
                        // Ignore profile loading errors (non-critical)
                        if (!profileError.message?.includes('406') && profileError.status !== 406) {
                            console.warn('Profile load error (non-critical):', profileError.message);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                }
            });
            
            this.initialized = true;
        } catch (error) {
            // Ignore 406 errors during init
            if (error.message?.includes('406') || error.status === 406) {
                console.warn('406 error during auth init (non-critical)');
                this.initialized = true;
                return;
            }
            console.error('Error initializing auth:', error);
            this.initialized = true; // Mark as initialized even on error
        }
    }
    
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initPromise;
        }
        // Wait a bit more to ensure session is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    async waitForSupabase(maxWait = 5000) {
        // First check if already available
        if (this.getSupabaseClient()) {
            return;
        }
        
        // Try using window.supabaseReady Promise if available
        if (typeof window !== 'undefined' && window.supabaseReady) {
            try {
                const client = await Promise.race([
                    window.supabaseReady,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), maxWait))
                ]);
                if (client && client.auth && typeof client.auth.signInWithPassword === 'function') {
                    return;
                }
            } catch (error) {
                console.warn('Error waiting for supabaseReady:', error);
            }
        }
        
        // Fallback: poll for supabase
        const startTime = Date.now();
        while (!this.getSupabaseClient() && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Final check
        if (!this.getSupabaseClient()) {
            throw new Error('Supabase client tidak tersedia setelah menunggu ' + maxWait + 'ms');
        }
    }
    
    getSupabaseClient() {
        // Check window.supabase first (most reliable)
        if (typeof window !== 'undefined' && window.supabase) {
            // Verify it has auth method
            if (window.supabase.auth && typeof window.supabase.auth.signInWithPassword === 'function') {
                return window.supabase;
            }
        }
        // Fallback to global supabase
        if (typeof supabase !== 'undefined' && supabase.auth) {
            return supabase;
        }
        return null;
    }

    async loadUserProfile() {
        if (!this.currentUser) {
            console.warn('loadUserProfile: No current user');
            return null;
        }

        const supabaseClient = this.getSupabaseClient();
        if (!supabaseClient) {
            console.warn('loadUserProfile: No Supabase client');
            return null;
        }

        try {
            // Try with .maybeSingle() first (more lenient)
            let { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .maybeSingle();

            // If maybeSingle fails, try with regular select (might return array)
            if (error || !data) {
                console.log('maybeSingle failed, trying regular select...');
                const { data: dataArray, error: arrayError } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('id', this.currentUser.id)
                    .limit(1);

                if (!arrayError && dataArray && dataArray.length > 0) {
                    data = dataArray[0];
                    error = null;
                    console.log('✅ Profile loaded via regular select');
                } else if (arrayError) {
                    error = arrayError;
                }
            }

            if (error) {
                // Ignore 406 errors and PGRST116 (not found) - both are non-critical
                if (error.code === 'PGRST116' || 
                    error.message?.includes('406') || 
                    error.status === 406 ||
                    error.message?.includes('Cannot coerce')) {
                    console.warn('Profile not found or 406 error (non-critical):', error.message);
                    return null;
                }
                console.error('Error loading user profile:', error.message, error.code);
                return null;
            }

            if (data) {
                console.log('✅ Profile loaded successfully:', { 
                    id: data.id, 
                    role: data.role,
                    is_verified: data.is_verified 
                });
            }

            return data;
        } catch (error) {
            // Ignore 406 errors and coercion errors silently
            if (error.message?.includes('406') || 
                error.status === 406 ||
                error.message?.includes('Cannot coerce') ||
                error.message?.includes('single JSON object')) {
                console.warn('406 or coercion error (non-critical)');
                return null;
            }
            console.error('Error in loadUserProfile:', error);
            return null;
        }
    }

    async register(email, password, userData) {
        try {
            // Wait for Supabase to be ready
            await this.waitForSupabase(5000);
            
            const supabaseClient = this.getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client belum terinisialisasi. Silakan refresh halaman dan coba lagi.');
            }
            
            // Register user with Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email,
                password,
            });

            if (authError) {
                console.error('Auth signup error:', authError);
                throw authError;
            }

            // Check if user is created (might be null if email confirmation is required)
            if (!authData || !authData.user) {
                throw new Error('Gagal membuat akun. Silakan coba lagi.');
            }

            // Create user profile
            const { data: profileData, error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert({
                    id: authData.user.id,
                    username: userData.username,
                    full_name: userData.fullName,
                    phone: userData.phone,
                    company_name: userData.companyName || null,
                    role: userData.role,
                    is_verified: userData.role === 'Pelamar' ? true : false, // Pelamar auto-verified
                })
                .select()
                .single();

            if (profileError) {
                console.error('Profile insert error:', profileError);
                throw profileError;
            }

            console.log('Registration successful:', { userId: authData.user.id, profileId: profileData?.id });

            return { success: true, user: authData.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Terjadi kesalahan saat registrasi' };
        }
    }

    async login(email, password) {
        try {
            // Wait for Supabase to be ready
            await this.waitForSupabase(5000);
            
            const supabaseClient = this.getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client belum terinisialisasi. Silakan refresh halaman dan coba lagi.');
            }
            
            if (!supabaseClient.auth || !supabaseClient.auth.signInWithPassword) {
                throw new Error('Supabase auth method tidak tersedia. Pastikan Supabase sudah terinisialisasi dengan benar.');
            }
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Update currentUser and ensure session is set
            this.currentUser = data.user;
            
            // Verify session is saved by getting it again
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                this.currentUser = session.user;
            }
            
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Terjadi kesalahan saat login' };
        }
    }

    async logout() {
        try {
            const supabaseClient = this.getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client is not initialized');
            }
            
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUserProfile(retryCount = 0) {
        if (!this.currentUser) {
            console.warn('getCurrentUserProfile: No current user');
            return null;
        }
        
        const supabaseClient = this.getSupabaseClient();
        if (!supabaseClient) {
            console.warn('getCurrentUserProfile: No Supabase client');
            return null;
        }

        // Try loading profile using loadUserProfile
        let profile = await this.loadUserProfile();
        
        // If profile is null, try direct query as fallback
        if (!profile) {
            try {
                console.log('Profile null, trying direct query...');
                const { data, error } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('id', this.currentUser.id)
                    .maybeSingle();

                if (!error && data) {
                    profile = data;
                    console.log('✅ Profile loaded via direct query fallback:', { 
                        id: profile.id, 
                        role: profile.role 
                    });
                } else if (error) {
                    // Log error but don't fail completely
                    console.warn('Direct query error:', error.message, error.code);
                }
            } catch (error) {
                console.warn('Direct query exception:', error.message);
            }
        }
        
        // If profile is still null and we haven't retried yet, wait a bit and retry
        // This handles cases where profile was just created or there's a timing issue
        if (!profile && retryCount < 3) {
            console.log(`Profile masih null, retry ${retryCount + 1}/3...`);
            await new Promise(resolve => setTimeout(resolve, 800));
            return await this.getCurrentUserProfile(retryCount + 1);
        }
        
        if (profile) {
            console.log('✅ getCurrentUserProfile berhasil:', { 
                id: profile.id, 
                role: profile.role 
            });
        } else {
            console.warn('⚠️ getCurrentUserProfile: Profile tidak ditemukan setelah semua retry');
        }
        
        return profile;
    }

    async isAuthenticated() {
        // Ensure initialization is complete
        await this.ensureInitialized();
        
        // Check if currentUser is set
        if (this.currentUser !== null) {
            return true;
        }
        
        // Also check session from Supabase (in case currentUser is not set yet)
        try {
            const supabaseClient = this.getSupabaseClient();
            if (!supabaseClient) {
                return false;
            }
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                // Update currentUser if session exists
                this.currentUser = session.user;
                return true;
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        }
        
        return false;
    }

    async isHRDVerified() {
        const profile = await this.getCurrentUserProfile();
        return profile && profile.role === 'HRD' && profile.is_verified === true;
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

