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
    const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';  // Contoh: 'https://xxxxx.supabase.co'
    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';  // Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    
    function findSupabaseLibrary() {
        // Try all possible ways the UMD build might expose the library
        const checks = [
            () => typeof supabaseJs !== 'undefined' ? supabaseJs : null,
            () => typeof window.supabaseJs !== 'undefined' ? window.supabaseJs : null,
            () => typeof supabase !== 'undefined' && supabase.createClient ? supabase : null,
            () => typeof window.supabase !== 'undefined' && window.supabase.createClient ? window.supabase : null,
            () => typeof globalThis !== 'undefined' && globalThis.supabaseJs ? globalThis.supabaseJs : null,
            // Check if it's in window with a different name
            () => {
                for (let key in window) {
                    if (key.toLowerCase().includes('supabase') && window[key] && typeof window[key].createClient === 'function') {
                        return window[key];
                    }
                }
                return null;
            }
        ];
        
        for (let check of checks) {
            try {
                const lib = check();
                if (lib && typeof lib.createClient === 'function') {
                    console.log('✅ Found Supabase library:', typeof lib);
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
            
            if (client && client.auth && typeof client.auth.signInWithPassword === 'function') {
                window.supabase = client;
                console.log('✅ Supabase client initialized successfully');
                return true;
            } else {
                console.error('❌ Supabase client created but auth methods are missing');
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
            // Try immediate initialization
            if (initSupabase()) {
                console.log('✅ Supabase ready immediately');
                resolve(window.supabase);
                return;
            }
            
            // If not ready, poll until ready
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max (50 * 100ms)
            
            const checkInterval = setInterval(() => {
                attempts++;
                if (initSupabase()) {
                    clearInterval(checkInterval);
                    console.log('✅ Supabase ready after', attempts, 'attempts');
                    resolve(window.supabase);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    if (window.supabase) {
                        console.warn('⚠️ Supabase client exists but validation failed after', maxAttempts, 'attempts. Using existing client.');
                        resolve(window.supabase);
                    } else {
                        console.warn('⚠️ Failed to initialize Supabase after', maxAttempts, 'attempts');
                        resolve(null);
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
