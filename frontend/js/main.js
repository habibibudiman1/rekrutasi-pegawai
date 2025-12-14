// Main JavaScript for general functionality

// Suppress non-critical errors (WebSocket from Live Server, source maps, etc.)
window.addEventListener('error', (event) => {
    // Suppress WebSocket errors from Live Server (any port)
    if (event.message && (
        event.message.includes('WebSocket') || 
        event.message.includes('ws://') ||
        event.message.includes('reload.js')
    )) {
        event.preventDefault();
        return false;
    }
    // Suppress 404 errors for source maps and non-existent resources
    if (event.filename && (
        event.filename.includes('pages:1') ||
        event.filename.includes('.map') ||
        event.filename.includes('cv.html') ||
        event.filename.includes('reload.js')
    )) {
        event.preventDefault();
        return false;
    }
}, true);

// Suppress unhandled promise rejections for WebSocket
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && (
        event.reason.toString().includes('WebSocket') ||
        event.reason.toString().includes('ws://') ||
        event.reason.toString().includes('reload.js')
    )) {
        event.preventDefault();
        return false;
    }
});

// Check authentication status and redirect if needed
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be ready
    await authManager.waitForSupabase(5000);
    
    // Wait a bit for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update navigation based on auth status
    await updateNavigation();

    // Check if user is on protected page
    const protectedPages = ['dashboard-hrd.html', 'dashboard-pelamar.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const isAuthenticated = await authManager.isAuthenticated();
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return;
        }

        // Note: Role-specific checks are handled in individual dashboard files
        // This prevents double-checking and potential race conditions
        // Only do basic authentication check here
    }
});

// Also update navigation when auth state changes
if (typeof authManager !== 'undefined') {
    // Listen for auth state changes
    authManager.getSupabaseClient()?.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            console.log('Auth state changed:', event);
            await new Promise(resolve => setTimeout(resolve, 200));
            await updateNavigation();
        }
    });
}

async function updateNavigation(retryCount = 0) {
    try {
        const isAuthenticated = await authManager.isAuthenticated();
        console.log('updateNavigation: isAuthenticated =', isAuthenticated, 'retryCount =', retryCount);
        
        // Try multiple ways to find the navigation links
        // Strategy 1: Find by ID (most reliable)
        let loginLink = null;
        let registerLink = null;
        
        const authNav = document.getElementById('authNav');
        const registerNav = document.getElementById('registerNav');
        
        if (authNav) {
            loginLink = authNav.querySelector('a');
        }
        if (registerNav) {
            registerLink = registerNav.querySelector('a');
        }
        
        // Strategy 2: Find by href (fallback)
        if (!loginLink) {
            loginLink = document.querySelector('a[href="login.html"]');
            // Exclude links in forms or modals
            if (loginLink && (loginLink.closest('form') || loginLink.closest('.modal'))) {
                loginLink = null;
            }
        }
        if (!registerLink) {
            registerLink = document.querySelector('a[href="register.html"]');
            // Exclude links in forms or modals
            if (registerLink && (registerLink.closest('form') || registerLink.closest('.modal'))) {
                registerLink = null;
            }
        }
        
        // Strategy 3: Find by text content in navbar (last resort)
        if (!loginLink) {
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .nav-link');
            for (const link of navLinks) {
                const text = link.textContent.trim();
                // Check if it's in navbar and matches login/dashboard text
                if (link.closest('.navbar') && (text === 'Masuk' || text === 'Dashboard')) {
                    loginLink = link;
                    break;
                }
            }
        }
        if (!registerLink) {
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .nav-link');
            for (const link of navLinks) {
                const text = link.textContent.trim();
                // Check if it's in navbar and matches register/logout text
                if (link.closest('.navbar') && (text === 'Daftar' || text === 'Logout')) {
                    registerLink = link;
                    break;
                }
            }
        }
        
        // Strategy 4: Skip update if we're on login/register page and elements not found
        const currentPage = window.location.pathname.split('/').pop();
        if ((currentPage === 'login.html' || currentPage === 'register.html') && (!loginLink || !registerLink)) {
            console.log('On login/register page, navigation elements not needed');
            return; // Don't update navigation on login/register pages if elements don't exist
        }
        
        // If elements not found and we haven't retried, wait and retry
        if ((!loginLink || !registerLink) && retryCount < 3) {
            console.log('Navigation elements not found, retrying...', { loginLink: !!loginLink, registerLink: !!registerLink });
            await new Promise(resolve => setTimeout(resolve, 200));
            return await updateNavigation(retryCount + 1);
        }
        
        // If still not found, log warning but don't fail completely
        if (!loginLink || !registerLink) {
            console.warn('Navigation elements not found after retries:', { 
                loginLink: !!loginLink, 
                registerLink: !!registerLink,
                currentPage: window.location.pathname.split('/').pop()
            });
            // Don't return - continue with what we have
        }

        if (isAuthenticated) {
            // Get user profile to determine correct dashboard
            try {
                const profile = await authManager.getCurrentUserProfile();
                console.log('updateNavigation: profile =', profile);
                
                // Replace login/register with dashboard/logout
                if (loginLink) {
                    loginLink.textContent = 'Dashboard';
                    // Set correct dashboard based on role
                    if (profile && profile.role === 'HRD') {
                        loginLink.href = 'dashboard-hrd.html';
                    } else {
                        loginLink.href = 'dashboard-pelamar.html';
                    }
                    // Remove onclick if exists
                    loginLink.onclick = null;
                    // Remove from active state if exists
                    loginLink.classList.remove('active');
                    console.log('Login link updated to Dashboard:', loginLink.href);
                }
                
                if (registerLink) {
                    // Force update by removing all classes first, then add nav-link
                    registerLink.className = 'nav-link';
                    registerLink.textContent = 'Logout';
                    registerLink.href = '#';
                    // Remove any existing onclick and event listeners
                    registerLink.onclick = null;
                    // Remove old event listeners by cloning
                    const newRegisterLink = registerLink.cloneNode(true);
                    registerLink.parentNode.replaceChild(newRegisterLink, registerLink);
                    registerLink = newRegisterLink;
                    // Add new event listener
                    registerLink.addEventListener('click', handleLogout, { once: false });
                    console.log('Register link updated to Logout');
                }
            } catch (error) {
                console.warn('Error getting profile for navigation:', error);
                // Default to pelamar dashboard if profile can't be loaded
                if (loginLink) {
                    loginLink.textContent = 'Dashboard';
                    loginLink.href = 'dashboard-pelamar.html';
                    loginLink.onclick = null;
                    loginLink.classList.remove('active');
                }
                if (registerLink) {
                    // Force update by removing all classes first
                    registerLink.className = 'nav-link';
                    registerLink.textContent = 'Logout';
                    registerLink.href = '#';
                    registerLink.onclick = null;
                    // Remove old event listeners
                    const newRegisterLink = registerLink.cloneNode(true);
                    registerLink.parentNode.replaceChild(newRegisterLink, registerLink);
                    registerLink = newRegisterLink;
                    registerLink.addEventListener('click', handleLogout, { once: false });
                }
            }
        } else {
            // Reset to login/register if not authenticated
            if (loginLink) {
                loginLink.textContent = 'Masuk';
                loginLink.href = 'login.html';
                loginLink.onclick = null;
                loginLink.classList.remove('active');
            }
            if (registerLink) {
                // Force update by setting classes directly
                registerLink.className = 'nav-link btn btn-primary text-white px-3 rounded-pill ms-2';
                registerLink.textContent = 'Daftar';
                registerLink.href = 'register.html';
                registerLink.onclick = null;
            }
        }
    } catch (error) {
        console.error('Error updating navigation:', error);
    }
}

async function handleLogout(e) {
    e.preventDefault();
    const result = await authManager.logout();
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        alert('Error logging out: ' + result.error);
    }
}

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Loading spinner
function showLoading(element) {
    element.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function hideLoading(element, content) {
    element.innerHTML = content;
}

