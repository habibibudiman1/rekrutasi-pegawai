// Supabase Initialization Script - TEMPLATE
// ============================================
// INSTRUKSI:
// 1. Copy file ini menjadi supabase-init.js
// 2. Ganti YOUR_SUPABASE_URL_HERE dengan Project URL dari Supabase
// 3. Ganti YOUR_SUPABASE_ANON_KEY_HERE dengan anon key dari Supabase
// 4. File supabase-init.js sudah di .gitignore, jadi tidak akan ter-commit
// ============================================

(function() {
    // GANTI DENGAN SUPABASE URL DAN API KEY ANDA
    const SUPABASE_URL = 'masukan ini dengan url supabase anda';  // Contoh: 'https://xxxxx.supabase.co'
    const SUPABASE_ANON_KEY = 'masukan ini dengan anon key supabase anda';  // Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    
    function findSupabaseLibrary() {
        // Try all possible ways the UMD build might expose the library
        const checks = [
            // Check global supabaseJs (most common for UMD)
            () => {
                if (typeof supabaseJs !== 'undefined' && typeof supabaseJs.createClient === 'function') {
                    return supabaseJs;
                }
                return null;
            },
            // Check window.supabaseJs
            () => {
                if (typeof window !== 'undefined' && typeof window.supabaseJs !== 'undefined' && typeof window.supabaseJs.createClient === 'function') {
                    return window.supabaseJs;
                }
                return null;
            },
            // Check global supabase (if library exposes as 'supabase')
            () => {
                if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
                    return supabase;
                }
                return null;
            },
            // Check window.supabase
            () => {
                if (typeof window !== 'undefined' && typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                    return window.supabase;
                }
                return null;
            },
            // Check globalThis
            () => {
                if (typeof globalThis !== 'undefined' && globalThis.supabaseJs && typeof globalThis.supabaseJs.createClient === 'function') {
                    return globalThis.supabaseJs;
                }
                return null;
            },
            // Check if it's in window with a different name
            () => {
                if (typeof window !== 'undefined') {
                    for (let key in window) {
                        if (key.toLowerCase().includes('supabase') && window[key] && typeof window[key].createClient === 'function') {
                            return window[key];
                        }
                    }
                }
                return null;
            }
        ];
        
        for (let check of checks) {
            try {
                const lib = check();
                if (lib && typeof lib.createClient === 'function') {
                    console.log('✅ Found Supabase library');
                    return lib;
                }
            } catch (e) {
                // Continue checking
            }
        }
        
        return null;
    }
    
    function initSupabase() {
        const supabaseLib = findSupabaseLibrary();
        
        if (!supabaseLib) {
            return false;
        }
        
        try {
            const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            
            // Validate client - check for essential methods
            if (client && client.auth) {
                // If client already exists and is the same, consider it valid
                if (window.supabase === client) {
                    return true;
                }
                
                // Set client first
                window.supabase = client;
                
                // Check if client has basic auth methods (more lenient check)
                const hasAuthMethods = typeof client.auth.signInWithPassword === 'function' || 
                                      typeof client.auth.signUp === 'function' ||
                                      typeof client.auth.signOut === 'function' ||
                                      typeof client.auth.getSession === 'function';
                
                if (hasAuthMethods) {
                    console.log('✅ Supabase client initialized successfully');
                    return true;
                } else {
                    // Client exists but methods not ready yet - accept it anyway
                    // The methods might be available later via prototype chain
                    console.log('✅ Supabase client created (methods available via prototype)');
                    return true;
                }
            } else {
                console.error('❌ Supabase client created but auth is missing');
                return false;
            }
        } catch (error) {
            console.error('❌ Error creating Supabase client:', error);
            return false;
        }
    }
    
    // Create Promise for Supabase readiness
    function createSupabaseReadyPromise() {
        return new Promise((resolve, reject) => {
            // Check if already initialized
            if (window.supabase && window.supabase.auth) {
                console.log('✅ Supabase ready immediately');
                resolve(window.supabase);
                return;
            }
            
            // Try immediate initialization
            if (initSupabase()) {
                console.log('✅ Supabase ready immediately');
                resolve(window.supabase);
                return;
            }
            
            // If not ready, poll until ready
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max (50 * 100ms) - reduced since validation is more lenient
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                // Check if client already exists (from previous attempt)
                if (window.supabase && window.supabase.auth) {
                    clearInterval(checkInterval);
                    console.log('✅ Supabase ready after', attempts, 'attempts');
                    resolve(window.supabase);
                    return;
                }
                
                if (initSupabase()) {
                    clearInterval(checkInterval);
                    console.log('✅ Supabase ready after', attempts, 'attempts');
                    resolve(window.supabase);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (window.supabase) {
                        // Client exists, use it - validation might have been too strict
                        console.log('✅ Supabase client ready (using existing client after', maxAttempts, 'attempts)');
                        resolve(window.supabase);
                    } else {
                        // Try one more time with a longer wait
                        console.warn('⚠️ Supabase not ready after', maxAttempts, 'attempts. Retrying...');
                        setTimeout(() => {
                            if (initSupabase() || window.supabase) {
                                resolve(window.supabase);
                            } else {
                                console.error('❌ Failed to initialize Supabase after retry');
                                resolve(null);
                            }
                        }, 1000);
                    }
                }
            }, 100);
        });
    }
    
    // Initialize when DOM is ready
    function initializeWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeWhenReady);
            return;
        }
        
        window.supabaseReady = createSupabaseReadyPromise();
        initSupabase();
    }
    
    // Start initialization
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initializeWhenReady();
    } else {
        window.addEventListener('load', initializeWhenReady);
        setTimeout(initializeWhenReady, 0);
    }
    
    // Fallback: try again after a short delay
    setTimeout(() => {
        if (!window.supabase && !window.supabaseReady) {
            console.warn('⚠️ Supabase not initialized yet, retrying...');
            window.supabaseReady = createSupabaseReadyPromise();
        }
    }, 2000);
})();
