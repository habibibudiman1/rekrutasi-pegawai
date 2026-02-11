// HRD Dashboard JavaScript

let currentJobId = null;
let allApplications = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication - wait for Supabase to be ready first
    await authManager.waitForSupabase(5000);
    
    const isAuthenticated = await authManager.isAuthenticated();
    if (!isAuthenticated) {
        window.location.href = 'login.html';
        return;
    }

    // Try to get profile with retry and fallback
    let profile = await authManager.getCurrentUserProfile();
    
    // If profile is null, try direct query as fallback
    if (!profile && authManager.currentUser) {
        try {
            const supabaseClient = authManager.getSupabaseClient();
            if (supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .eq('id', authManager.currentUser.id)
                    .maybeSingle();
                
                if (!error && data) {
                    profile = data;
                    console.log('Profile loaded via direct query:', profile);
                }
            }
        } catch (error) {
            console.error('Error loading profile via direct query:', error);
        }
    }

    // If still no profile, try to continue with minimal functionality
    // This allows dashboard to load even if profile has issues
    if (!profile) {
        console.error('Profile not found for user:', authManager.currentUser?.id);
        console.warn('Continuing with limited functionality - profile will be created on first save');
        
        // Create a minimal profile object to allow dashboard to function
        profile = {
            id: authManager.currentUser.id,
            username: authManager.currentUser.email?.split('@')[0] || 'user',
            full_name: authManager.currentUser.email?.split('@')[0] || 'User',
            role: 'HRD', // Default role
            is_verified: false, // HRD needs verification
            email: authManager.currentUser.email
        };
        
        // Show a non-blocking warning instead of alert
        if (typeof showAlert === 'function') {
            showAlert('Profil pengguna belum lengkap. Silakan lengkapi profil Anda di halaman Profile.', 'warning');
        } else {
            // If showAlert not available, show alert but don't block
            setTimeout(() => {
                alert('Profil pengguna belum lengkap. Silakan lengkapi profil Anda.');
            }, 1000);
        }
    }

    // Check role - redirect if not HRD
    if (profile.role !== 'HRD') {
        console.warn('⚠️ User role is not HRD:', profile.role, '- Redirecting...');
        if (profile.role === 'Pelamar') {
            console.log('🔄 Redirecting Pelamar to dashboard-pelamar.html');
            window.location.href = 'dashboard-pelamar.html';
            return;
        } else {
            console.log('🔄 Unknown role, redirecting to home');
            window.location.href = 'index.html';
            return;
        }
    }
    
    console.log('✅ User is HRD, continuing to HRD dashboard');

    // Check verification - but allow dashboard to load with warning
    if (!profile.is_verified) {
        console.warn('HRD account not verified');
        if (typeof showAlert === 'function') {
            showAlert('Akun HRD Anda belum terverifikasi. Beberapa fitur mungkin terbatas.', 'warning');
        } else {
            setTimeout(() => {
                alert('Akun HRD Anda belum terverifikasi. Beberapa fitur mungkin terbatas.');
            }, 1000);
        }
        // Don't redirect - let user see dashboard with limited functionality
        // They can still view but can't create jobs until verified
    }

    // Update user name
    document.getElementById('userName').textContent = profile.full_name || profile.username;

    // Setup navigation
    setupNavigation();
    
    // Load initial data
    await loadOverview();
    
    // Setup event listeners
    setupEventListeners();
    setupProfileForm();
    setupCharacterCounters();
});

function setupNavigation() {
    document.querySelectorAll('.navbar-nav .nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
            
            // Update active state
            document.querySelectorAll('.navbar-nav .nav-link[data-page]').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

function showPage(page) {
    console.log('showPage called with:', page);
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    console.log('Page element:', pageElement);
    if (pageElement) {
        pageElement.style.display = 'block';
        
        // Load page data
        switch(page) {
            case 'overview':
                loadOverview();
                break;
            case 'jobs':
                loadJobs();
                break;
            case 'applicants':
                loadApplicants();
                break;
            case 'statistics':
                loadStatistics();
                break;
            case 'profile':
                console.log('Loading profile page...');
                loadProfile();
                break;
            default:
                console.warn('Unknown page:', page);
        }
    } else {
        console.error('Page element not found for:', page + 'Page');
    }
}

async function loadProfile() {
    // Force refresh by querying directly from database to bypass cache
    let profile = null;
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (supabaseClient && authManager.currentUser) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', authManager.currentUser.id)
                .maybeSingle();
            
            if (!error && data) {
                profile = data;
            } else if (error) {
                // Fallback to authManager method
                profile = await authManager.getCurrentUserProfile();
            }
        } else {
            // Fallback to authManager method
            profile = await authManager.getCurrentUserProfile();
        }
    } catch (error) {
        // Fallback to authManager method
        profile = await authManager.getCurrentUserProfile();
    }
    if (profile) {
        // Update profile header
        const companyName = profile.company_name || profile.full_name || 'Nama Perusahaan';
        document.getElementById('profileHeaderCompanyName').textContent = companyName;
        document.getElementById('profileHeaderLocation').textContent = profile.address || 'Lokasi Perusahaan';
        document.getElementById('profileHeaderEmail').textContent = authManager.currentUser?.email || 'email@perusahaan.com';
        
        // Update profile image/logo
        const initials = companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=1A3D64&color=fff`;
        document.getElementById('profileHeaderImage').src = avatarUrl;
        
        // Update form fields
        document.getElementById('profileFullName').value = profile.full_name || '';
        document.getElementById('profileUsername').value = profile.username || '';
        document.getElementById('profileEmail').value = authManager.currentUser?.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        
        // Load company about
        if (profile.bio && !profile.bio.includes('VISI:')) {
            document.getElementById('companyAboutText').textContent = profile.bio;
            document.getElementById('companyAboutContent').style.display = 'block';
            document.getElementById('addCompanyAboutBtn').style.display = 'none';
        } else {
            document.getElementById('companyAboutContent').style.display = 'none';
            document.getElementById('addCompanyAboutBtn').style.display = 'block';
        }
        
        // Load vision & mission
        if (profile.bio && profile.bio.includes('VISI:')) {
            const parts = profile.bio.split('MISI:');
            const vision = parts[0].replace('VISI:', '').trim();
            const mission = parts[1] ? parts[1].trim() : '';
            document.getElementById('visionMissionText').innerHTML = `
                <div class="mb-3">
                    <strong>Visi:</strong>
                    <p>${vision}</p>
                </div>
                <div>
                    <strong>Misi:</strong>
                    <p>${mission}</p>
                </div>
            `;
            document.getElementById('visionMissionContent').style.display = 'block';
            document.getElementById('addVisionMissionBtn').style.display = 'none';
        } else {
            document.getElementById('visionMissionContent').style.display = 'none';
            document.getElementById('addVisionMissionBtn').style.display = 'block';
        }
        
        // Update contact info sidebar
        document.getElementById('contactEmail').textContent = authManager.currentUser?.email || '-';
        document.getElementById('contactPhone').textContent = profile.phone || '-';
        document.getElementById('contactAddress').textContent = profile.address || '-';
        
        // Update verification status
        const verificationStatus = document.getElementById('verificationStatus');
        if (profile.is_verified) {
            verificationStatus.textContent = 'Terverifikasi';
            verificationStatus.className = 'profile-status-value mb-2 text-success';
            document.getElementById('verifyCompanyBtn').style.display = 'none';
        } else {
            verificationStatus.textContent = 'Belum Terverifikasi';
            verificationStatus.className = 'profile-status-value mb-2 text-warning';
            document.getElementById('verifyCompanyBtn').style.display = 'block';
        }
        
        // Calculate profile completeness
        calculateProfileCompleteness(profile);
        
        // Load company info display
        loadCompanyInfo(profile);
    }
}

function calculateProfileCompleteness(profile) {
    let completed = 0;
    let total = 7;
    
    if (profile.company_name) completed++;
    if (profile.full_name) completed++;
    if (profile.phone) completed++;
    if (profile.address) completed++;
    if (profile.bio) completed++;
    if (profile.linkedin_url || profile.portfolio_url) completed++;
    if (profile.is_verified) completed++;
    
    const percentage = Math.round((completed / total) * 100);
    document.getElementById('profileStrengthBar').style.width = percentage + '%';
}

function cancelProfileEdit() {
    loadProfile();
}

// ============================================
// CHARACTER COUNTER FUNCTIONS
// ============================================

function setupCharacterCounters() {
    // Define all fields with their counter IDs and max lengths
    const fields = [
        { inputId: 'profileFullName', counterId: 'profileFullNameCounter', maxLength: 100 },
        { inputId: 'profileUsername', counterId: 'profileUsernameCounter', maxLength: 50 },
        { inputId: 'profilePhone', counterId: 'profilePhoneCounter', maxLength: 20 },
        { inputId: 'companyAbout', counterId: 'companyAboutCounter', maxLength: 2000 },
        { inputId: 'companyVision', counterId: 'companyVisionCounter', maxLength: 1000 },
        { inputId: 'companyMission', counterId: 'companyMissionCounter', maxLength: 1000 },
        { inputId: 'companyInfoName', counterId: 'companyInfoNameCounter', maxLength: 100 },
        { inputId: 'companyInfoAddress', counterId: 'companyInfoAddressCounter', maxLength: 500 },
        { inputId: 'companyInfoWebsite', counterId: 'companyInfoWebsiteCounter', maxLength: 200 },
        { inputId: 'companyInfoIndustry', counterId: 'companyInfoIndustryCounter', maxLength: 50 },
        { inputId: 'companyInfoLinkedIn', counterId: 'companyInfoLinkedInCounter', maxLength: 200 },
        { inputId: 'jobTitle', counterId: 'jobTitleCounter', maxLength: 100 },
        { inputId: 'jobCompany', counterId: 'jobCompanyCounter', maxLength: 100 },
        { inputId: 'jobLocation', counterId: 'jobLocationCounter', maxLength: 100 },
        { inputId: 'jobDescription', counterId: 'jobDescriptionCounter', maxLength: 2000 },
        { inputId: 'jobRequirements', counterId: 'jobRequirementsCounter', maxLength: 2000 },
    ];
    
    // Setup counter for each field
    fields.forEach(field => {
        const input = document.getElementById(field.inputId);
        const counter = document.getElementById(field.counterId);
        
        if (input && counter) {
            // Check if listener already exists (avoid duplicates)
            if (!input.dataset.counterSetup) {
                // Update counter on input
                input.addEventListener('input', () => {
                    updateCharacterCounter(input, counter, field.maxLength);
                });
                
                // Update counter on focus (for edit mode)
                input.addEventListener('focus', () => {
                    updateCharacterCounter(input, counter, field.maxLength);
                });
                
                // Mark as setup
                input.dataset.counterSetup = 'true';
            }
            
            // Initial update
            updateCharacterCounter(input, counter, field.maxLength);
        }
    });
}

function updateCharacterCounter(input, counter, maxLength) {
    if (!input || !counter) return;
    
    const currentLength = input.value.length;
    counter.textContent = `${currentLength}/${maxLength}`;
    
    // Get parent small element
    const parentSmall = counter.parentElement;
    
    // Change color if approaching limit
    if (currentLength >= maxLength * 0.9) {
        parentSmall.classList.add('text-danger');
        parentSmall.classList.remove('text-muted', 'text-warning');
    } else if (currentLength >= maxLength * 0.75) {
        parentSmall.classList.add('text-warning');
        parentSmall.classList.remove('text-danger', 'text-muted');
    } else {
        parentSmall.classList.remove('text-danger', 'text-warning');
        parentSmall.classList.add('text-muted');
    }
}

// Company About Functions
function addCompanyAbout() {
    const modal = new bootstrap.Modal(document.getElementById('companyAboutModal'));
    document.getElementById('companyAboutModalTitle').textContent = 'Tambah Deskripsi Perusahaan';
    document.getElementById('companyAbout').value = '';
    
    // Update counter
    setTimeout(() => {
        const input = document.getElementById('companyAbout');
        const counter = document.getElementById('companyAboutCounter');
        if (input && counter) {
            updateCharacterCounter(input, counter, 2000);
        }
    }, 100);
    
    modal.show();
}

async function editCompanyAbout() {
    const modal = new bootstrap.Modal(document.getElementById('companyAboutModal'));
    document.getElementById('companyAboutModalTitle').textContent = 'Edit Deskripsi Perusahaan';
    
    // Load existing about text
    try {
        const profile = await authManager.getCurrentUserProfile();
        if (profile && profile.bio && !profile.bio.includes('VISI:')) {
            document.getElementById('companyAbout').value = profile.bio;
        } else {
            document.getElementById('companyAbout').value = '';
        }
    } catch (error) {
        console.error('Error loading company about:', error);
        const currentText = document.getElementById('companyAboutText')?.textContent || '';
        document.getElementById('companyAbout').value = currentText;
    }
    
    // Update counter
    setTimeout(() => {
        const input = document.getElementById('companyAbout');
        const counter = document.getElementById('companyAboutCounter');
        if (input && counter) {
            updateCharacterCounter(input, counter, 2000);
        }
    }, 100);
    
    modal.show();
}

async function saveCompanyAbout() {
    const aboutText = document.getElementById('companyAbout').value.trim();
    if (!aboutText) {
        showAlert('Deskripsi perusahaan tidak boleh kosong', 'warning');
        return;
    }
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        // Get current profile to preserve vision & mission if exists
        const { data: currentProfile } = await supabaseClient
            .from('user_profiles')
            .select('bio')
            .eq('id', authManager.currentUser.id)
            .maybeSingle();
        
        let bioToSave = aboutText;
        
        // If vision & mission exists, preserve it
        if (currentProfile?.bio && currentProfile.bio.includes('VISI:')) {
            // Keep vision & mission, replace only the about part
            // For simplicity, we'll store about separately or combine them
            // For now, we'll just save the about text
            // In a real app, you might want separate fields
            bioToSave = aboutText;
        }
        
        const { data: updatedData, error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave, updated_at: new Date().toISOString() })
            .eq('id', authManager.currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (!updatedData) {
            throw new Error('Data tidak ter-update');
        }
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('companyAboutModal')).hide();
        
        // Show success message
        showAlert('Deskripsi perusahaan berhasil disimpan!', 'success');
        
        // Update UI directly
        const companyAboutTextEl = document.getElementById('companyAboutText');
        const companyAboutContentEl = document.getElementById('companyAboutContent');
        const addCompanyAboutBtnEl = document.getElementById('addCompanyAboutBtn');
        
        if (updatedData.bio && !updatedData.bio.includes('VISI:')) {
            if (companyAboutTextEl) companyAboutTextEl.textContent = updatedData.bio;
            if (companyAboutContentEl) companyAboutContentEl.style.display = 'block';
            if (addCompanyAboutBtnEl) addCompanyAboutBtnEl.style.display = 'none';
        } else {
            if (companyAboutContentEl) companyAboutContentEl.style.display = 'none';
            if (addCompanyAboutBtnEl) addCompanyAboutBtnEl.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error saving company about:', error);
        showAlert('Gagal menyimpan deskripsi: ' + (error.message || 'Terjadi kesalahan'), 'danger');
    }
}

// DELETE - Delete company about
async function deleteCompanyAbout() {
    if (!confirm('Apakah Anda yakin ingin menghapus deskripsi perusahaan?')) {
        return;
    }
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        // Get current profile to preserve vision & mission if exists
        const { data: currentProfile } = await supabaseClient
            .from('user_profiles')
            .select('bio')
            .eq('id', authManager.currentUser.id)
            .single();
        
        let bioToSave = null;
        
        // If vision & mission exists, preserve it
        if (currentProfile?.bio && currentProfile.bio.includes('VISI:')) {
            // Keep only vision & mission
            bioToSave = currentProfile.bio;
        } else {
            // Delete all bio
            bioToSave = null;
        }
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave })
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Deskripsi perusahaan berhasil dihapus!', 'success');
        await loadProfile();
    } catch (error) {
        console.error('Error deleting company about:', error);
        showAlert('Gagal menghapus deskripsi: ' + error.message, 'danger');
    }
}

// Vision & Mission Functions
function addVisionMission() {
    const modal = new bootstrap.Modal(document.getElementById('visionMissionModal'));
    document.getElementById('visionMissionModalTitle').textContent = 'Tambah Visi & Misi';
    document.getElementById('companyVision').value = '';
    document.getElementById('companyMission').value = '';
    
    // Update counters
    setTimeout(() => {
        const visionInput = document.getElementById('companyVision');
        const visionCounter = document.getElementById('companyVisionCounter');
        const missionInput = document.getElementById('companyMission');
        const missionCounter = document.getElementById('companyMissionCounter');
        if (visionInput && visionCounter) {
            updateCharacterCounter(visionInput, visionCounter, 1000);
        }
        if (missionInput && missionCounter) {
            updateCharacterCounter(missionInput, missionCounter, 1000);
        }
    }, 100);
    
    modal.show();
}

async function editVisionMission() {
    const modal = new bootstrap.Modal(document.getElementById('visionMissionModal'));
    document.getElementById('visionMissionModalTitle').textContent = 'Edit Visi & Misi';
    
    // Load existing vision & mission
    try {
        const profile = await authManager.getCurrentUserProfile();
        if (profile && profile.bio && profile.bio.includes('VISI:')) {
            const parts = profile.bio.split('MISI:');
            const vision = parts[0].replace('VISI:', '').trim();
            const mission = parts[1] ? parts[1].trim() : '';
            document.getElementById('companyVision').value = vision;
            document.getElementById('companyMission').value = mission;
        } else {
            document.getElementById('companyVision').value = '';
            document.getElementById('companyMission').value = '';
        }
    } catch (error) {
        console.error('Error loading vision mission:', error);
        document.getElementById('companyVision').value = '';
        document.getElementById('companyMission').value = '';
    }
    
    // Update counters
    setTimeout(() => {
        const visionInput = document.getElementById('companyVision');
        const visionCounter = document.getElementById('companyVisionCounter');
        const missionInput = document.getElementById('companyMission');
        const missionCounter = document.getElementById('companyMissionCounter');
        if (visionInput && visionCounter) {
            updateCharacterCounter(visionInput, visionCounter, 1000);
        }
        if (missionInput && missionCounter) {
            updateCharacterCounter(missionInput, missionCounter, 1000);
        }
    }, 100);
    
    modal.show();
}

async function saveVisionMission() {
    const vision = document.getElementById('companyVision').value.trim();
    const mission = document.getElementById('companyMission').value.trim();
    
    if (!vision && !mission) {
        showAlert('Visi atau Misi harus diisi', 'warning');
        return;
    }
    
    // Store as formatted text in bio
    const visionMissionText = `VISI:\n${vision}\n\nMISI:\n${mission}`;
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        // Get current profile to preserve company about if exists
        const { data: currentProfile } = await supabaseClient
            .from('user_profiles')
            .select('bio')
            .eq('id', authManager.currentUser.id)
            .maybeSingle();
        
        // If there's existing about text (without VISI:), we'll replace it with vision & mission
        // In a real app, you might want separate fields for about, vision, and mission
        let bioToSave = visionMissionText;
        
        // If there's existing about that's not vision/mission, we could combine them
        // For now, we'll just save vision & mission
        if (currentProfile?.bio && !currentProfile.bio.includes('VISI:')) {
            // Option: Combine them or replace
            // For simplicity, we'll replace with vision & mission
            bioToSave = visionMissionText;
        }
        
        const { data: updatedData, error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave, updated_at: new Date().toISOString() })
            .eq('id', authManager.currentUser.id)
            .select()
            .single();
        
        if (error) throw error;
        
        if (!updatedData) {
            throw new Error('Data tidak ter-update');
        }
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('visionMissionModal')).hide();
        
        // Show success message
        showAlert('Visi & Misi berhasil disimpan!', 'success');
        
        // Update UI directly
        const visionMissionTextEl = document.getElementById('visionMissionText');
        const visionMissionContentEl = document.getElementById('visionMissionContent');
        const addVisionMissionBtnEl = document.getElementById('addVisionMissionBtn');
        
        if (updatedData.bio && updatedData.bio.includes('VISI:')) {
            const parts = updatedData.bio.split('MISI:');
            const visionPart = parts[0].replace('VISI:', '').trim();
            const missionPart = parts[1] ? parts[1].trim() : '';
            if (visionMissionTextEl) {
                visionMissionTextEl.innerHTML = `
                    <div class="mb-3">
                        <strong>Visi:</strong>
                        <p>${visionPart}</p>
                    </div>
                    <div>
                        <strong>Misi:</strong>
                        <p>${missionPart}</p>
                    </div>
                `;
            }
            if (visionMissionContentEl) visionMissionContentEl.style.display = 'block';
            if (addVisionMissionBtnEl) addVisionMissionBtnEl.style.display = 'none';
        } else {
            if (visionMissionContentEl) visionMissionContentEl.style.display = 'none';
            if (addVisionMissionBtnEl) addVisionMissionBtnEl.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error saving vision mission:', error);
        showAlert('Gagal menyimpan visi & misi: ' + (error.message || 'Terjadi kesalahan'), 'danger');
    }
}

// DELETE - Delete vision & mission
async function deleteVisionMission() {
    if (!confirm('Apakah Anda yakin ingin menghapus visi & misi perusahaan?')) {
        return;
    }
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        // Get current profile to preserve company about if exists
        const { data: currentProfile } = await supabaseClient
            .from('user_profiles')
            .select('bio')
            .eq('id', authManager.currentUser.id)
            .single();
        
        let bioToSave = null;
        
        // If there's existing about text (without VISI:), preserve it
        if (currentProfile?.bio && !currentProfile.bio.includes('VISI:')) {
            bioToSave = currentProfile.bio;
        } else {
            // Delete all bio
            bioToSave = null;
        }
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave })
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Visi & Misi berhasil dihapus!', 'success');
        await loadProfile();
    } catch (error) {
        console.error('Error deleting vision mission:', error);
        showAlert('Gagal menghapus visi & misi: ' + error.message, 'danger');
    }
}

function editContactInfo() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

// ============================================
// CRUD FUNCTIONS FOR COMPANY INFO
// ============================================

function loadCompanyInfo(profile) {
    if (!profile) {
        console.warn('loadCompanyInfo: No profile provided');
        return;
    }
    
    console.log('loadCompanyInfo called with:', {
        company_name: profile.company_name,
        address: profile.address,
        portfolio_url: profile.portfolio_url,
        linkedin_url: profile.linkedin_url
    });
    
    // Check if company has any info
    const hasCompanyInfo = profile.company_name || 
                          profile.address || 
                          profile.portfolio_url || 
                          profile.linkedin_url;
    
    if (hasCompanyInfo) {
        // Display company info
        const nameEl = document.getElementById('displayCompanyName');
        const addressEl = document.getElementById('displayCompanyAddress');
        const websiteEl = document.getElementById('displayCompanyWebsite');
        const linkedInEl = document.getElementById('displayCompanyLinkedIn');
        
        if (nameEl) {
            nameEl.textContent = profile.company_name || '-';
            console.log('Updated displayCompanyName:', profile.company_name);
        } else {
            console.error('displayCompanyName element not found!');
        }
        
        if (addressEl) {
            addressEl.textContent = profile.address || '-';
            console.log('Updated displayCompanyAddress:', profile.address);
        } else {
            console.error('displayCompanyAddress element not found!');
        }
        
        // Extract company metadata from bio if exists
        let companyMetadata = {};
        if (profile.bio && profile.bio.includes('COMPANY_METADATA:')) {
            try {
                const parts = profile.bio.split('COMPANY_METADATA:');
                const metadataJson = parts[1].trim();
                companyMetadata = JSON.parse(metadataJson);
            } catch (e) {
                console.warn('Error parsing company metadata:', e);
            }
        }
        
        // Industry and Size - load from metadata or use fallback
        const industryEl = document.getElementById('displayCompanyIndustry');
        const sizeEl = document.getElementById('displayCompanySize');
        if (industryEl) {
            industryEl.textContent = companyMetadata.industry || profile.company_industry || 'Belum diisi';
            console.log('Updated displayCompanyIndustry:', companyMetadata.industry || profile.company_industry);
        }
        if (sizeEl) {
            sizeEl.textContent = companyMetadata.size || profile.company_size || 'Belum diisi';
            console.log('Updated displayCompanySize:', companyMetadata.size || profile.company_size);
        }
        
        // Website
        if (websiteEl) {
            if (profile.portfolio_url) {
                websiteEl.textContent = profile.portfolio_url;
                websiteEl.href = profile.portfolio_url;
                websiteEl.style.display = 'inline';
                console.log('Updated displayCompanyWebsite:', profile.portfolio_url);
            } else {
                websiteEl.textContent = '-';
                websiteEl.href = '#';
                websiteEl.style.display = 'none';
            }
        } else {
            console.error('displayCompanyWebsite element not found!');
        }
        
        // LinkedIn
        if (linkedInEl) {
            if (profile.linkedin_url) {
                linkedInEl.textContent = profile.linkedin_url;
                linkedInEl.href = profile.linkedin_url;
                linkedInEl.style.display = 'inline';
                console.log('Updated displayCompanyLinkedIn:', profile.linkedin_url);
            } else {
                linkedInEl.textContent = '-';
                linkedInEl.href = '#';
                linkedInEl.style.display = 'none';
            }
        } else {
            console.error('displayCompanyLinkedIn element not found!');
        }
        
        // Show display, hide add button
        const displayEl = document.getElementById('companyInfoDisplay');
        const addBtn = document.getElementById('addCompanyInfoBtn');
        if (displayEl) {
            displayEl.style.display = 'block';
            console.log('Company info display shown');
        } else {
            console.error('companyInfoDisplay element not found!');
        }
        if (addBtn) {
            addBtn.style.display = 'none';
        }
    } else {
        // Hide display, show add button
        const displayEl = document.getElementById('companyInfoDisplay');
        const addBtn = document.getElementById('addCompanyInfoBtn');
        if (displayEl) displayEl.style.display = 'none';
        if (addBtn) addBtn.style.display = 'block';
    }
}

// CREATE - Add new company info
async function addCompanyInfo() {
    const modal = new bootstrap.Modal(document.getElementById('companyInfoModal'));
    document.getElementById('companyInfoModalTitle').textContent = 'Tambah Informasi Perusahaan';
    document.getElementById('deleteCompanyInfoBtn').style.display = 'none';
    
    // Clear form
    document.getElementById('companyInfoForm').reset();
    
    // Pre-fill with existing data if any (load fresh from database)
    try {
        const supabaseClient = authManager.getSupabaseClient();
        let profile = null;
        
        if (supabaseClient && authManager.currentUser) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', authManager.currentUser.id)
                .maybeSingle();
            
            if (!error && data) {
                profile = data;
            }
        }
        
        // Fallback to authManager if direct query fails
        if (!profile) {
            profile = await authManager.getCurrentUserProfile();
        }
        
        if (profile) {
            document.getElementById('companyInfoName').value = profile.company_name || '';
            document.getElementById('companyInfoAddress').value = profile.address || '';
            document.getElementById('companyInfoWebsite').value = profile.portfolio_url || '';
            document.getElementById('companyInfoLinkedIn').value = profile.linkedin_url || '';
            
            // Extract company metadata from bio if exists
            let companyMetadata = {};
            if (profile.bio && profile.bio.includes('COMPANY_METADATA:')) {
                try {
                    const parts = profile.bio.split('COMPANY_METADATA:');
                    const metadataJson = parts[1].trim();
                    companyMetadata = JSON.parse(metadataJson);
                } catch (e) {
                    console.warn('Error parsing company metadata:', e);
                }
            }
            
            // Load industry and size from metadata or profile
            document.getElementById('companyInfoIndustry').value = companyMetadata.industry || profile.company_industry || '';
            document.getElementById('companyInfoSize').value = companyMetadata.size || profile.company_size || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
    
    // Update counters after setting values
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
    modal.show();
}

// READ & UPDATE - Edit existing company info
async function editCompanyInfo() {
    const modal = new bootstrap.Modal(document.getElementById('companyInfoModal'));
    document.getElementById('companyInfoModalTitle').textContent = 'Edit Informasi Perusahaan';
    document.getElementById('deleteCompanyInfoBtn').style.display = 'inline-block';
    
    try {
        // Load fresh data from database
        const supabaseClient = authManager.getSupabaseClient();
        let profile = null;
        
        if (supabaseClient && authManager.currentUser) {
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', authManager.currentUser.id)
                .maybeSingle();
            
            if (!error && data) {
                profile = data;
            }
        }
        
        // Fallback to authManager if direct query fails
        if (!profile) {
            profile = await authManager.getCurrentUserProfile();
        }
        
        if (profile) {
            document.getElementById('companyInfoName').value = profile.company_name || '';
            document.getElementById('companyInfoAddress').value = profile.address || '';
            document.getElementById('companyInfoWebsite').value = profile.portfolio_url || '';
            document.getElementById('companyInfoLinkedIn').value = profile.linkedin_url || '';
            
            // Extract company metadata from bio if exists
            let companyMetadata = {};
            if (profile.bio && profile.bio.includes('COMPANY_METADATA:')) {
                try {
                    const parts = profile.bio.split('COMPANY_METADATA:');
                    const metadataJson = parts[1].trim();
                    companyMetadata = JSON.parse(metadataJson);
                } catch (e) {
                    console.warn('Error parsing company metadata:', e);
                }
            }
            
            // Load industry and size from metadata or profile
            document.getElementById('companyInfoIndustry').value = companyMetadata.industry || profile.company_industry || '';
            document.getElementById('companyInfoSize').value = companyMetadata.size || profile.company_size || '';
        }
    } catch (error) {
        console.error('Error loading company info:', error);
    }
    
    // Update counters after setting values
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
    modal.show();
}

// CREATE/UPDATE - Save company info
async function saveCompanyInfo() {
    console.log('=== saveCompanyInfo FUNCTION CALLED ===');
    
    const form = document.getElementById('companyInfoForm');
    if (!form) {
        console.error('Form not found');
        showAlert('Form tidak ditemukan', 'danger');
        return;
    }
    
    console.log('Form found, checking validity...');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const companyName = document.getElementById('companyInfoName').value.trim();
    if (!companyName) {
        showAlert('Nama perusahaan wajib diisi', 'warning');
        return;
    }
    
    // Get save button and disable it during save
    const saveBtn = document.querySelector('#companyInfoModal .btn-primary');
    const originalBtnText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    }
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        if (!authManager.currentUser || !authManager.currentUser.id) {
            throw new Error('User tidak terautentikasi');
        }
        
        // Get all form values
        const companyWebsite = document.getElementById('companyInfoWebsite').value.trim() || null;
        const companyLinkedIn = document.getElementById('companyInfoLinkedIn').value.trim() || null;
        const companyIndustry = document.getElementById('companyInfoIndustry').value.trim() || null;
        const companySize = document.getElementById('companyInfoSize').value.trim() || null;
        
        const companyData = {
            company_name: companyName,
            address: document.getElementById('companyInfoAddress').value.trim() || null,
            portfolio_url: companyWebsite,
            linkedin_url: companyLinkedIn,
            updated_at: new Date().toISOString()
        };
        
        // Store industry and size in bio as JSON if they exist
        // Format: If bio exists and has VISI:, preserve it. Otherwise, store as JSON
        if (companyIndustry || companySize) {
            try {
                const { data: currentProfile } = await supabaseClient
                    .from('user_profiles')
                    .select('bio')
                    .eq('id', authManager.currentUser.id)
                    .maybeSingle();
                
                let existingBio = currentProfile?.bio || '';
                let companyMetadata = {};
                
                // Extract existing metadata if exists
                if (existingBio && existingBio.includes('COMPANY_METADATA:')) {
                    try {
                        const parts = existingBio.split('COMPANY_METADATA:');
                        existingBio = parts[0].trim();
                        const metadataJson = parts[1].trim();
                        companyMetadata = JSON.parse(metadataJson);
                    } catch (e) {
                        // If parsing fails, start fresh
                        companyMetadata = {};
                    }
                }
                
                // Update metadata
                if (companyIndustry) companyMetadata.industry = companyIndustry;
                if (companySize) companyMetadata.size = companySize;
                
                // Combine bio with metadata
                if (existingBio && !existingBio.includes('VISI:')) {
                    companyData.bio = existingBio + '\n\nCOMPANY_METADATA:' + JSON.stringify(companyMetadata);
                } else if (existingBio && existingBio.includes('VISI:')) {
                    // Preserve VISI:MISI: and add metadata
                    companyData.bio = existingBio + '\n\nCOMPANY_METADATA:' + JSON.stringify(companyMetadata);
                } else {
                    companyData.bio = 'COMPANY_METADATA:' + JSON.stringify(companyMetadata);
                }
                
                console.log('Storing company metadata:', companyMetadata);
            } catch (error) {
                console.warn('Error storing company metadata:', error);
            }
        } else {
            // If no industry/size, preserve existing bio but remove metadata if exists
            try {
                const { data: currentProfile } = await supabaseClient
                    .from('user_profiles')
                    .select('bio')
                    .eq('id', authManager.currentUser.id)
                    .maybeSingle();
                
                if (currentProfile?.bio && currentProfile.bio.includes('COMPANY_METADATA:')) {
                    // Remove metadata but keep the rest
                    const parts = currentProfile.bio.split('COMPANY_METADATA:');
                    const existingBio = parts[0].trim();
                    if (existingBio) {
                        companyData.bio = existingBio;
                    }
                }
            } catch (error) {
                console.warn('Error cleaning company metadata:', error);
            }
        }
        
        console.log('Company data to save:', companyData);
        console.log('User ID:', authManager.currentUser.id);
        
        // Update database
        const { data: updatedData, error } = await supabaseClient
            .from('user_profiles')
            .update(companyData)
            .eq('id', authManager.currentUser.id)
            .select()
            .single();
        
        if (error) {
            console.error('Database update error:', error);
            throw error;
        }
        
        if (!updatedData) {
            console.error('updatedData is null or undefined');
            throw new Error('Data tidak ter-update');
        }
        
        console.log('=== DATA UPDATED SUCCESSFULLY ===');
        console.log('Updated data:', updatedData);
        console.log('Company name in response:', updatedData.company_name);
        console.log('Address in response:', updatedData.address);
        
        // Close modal immediately
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('companyInfoModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
        
        // Show success message
        showAlert('Informasi perusahaan berhasil disimpan!', 'success');
        
        // Update UI directly with the returned data (no need to query again)
        // Update profile header immediately
        const savedCompanyName = updatedData.company_name || updatedData.full_name || 'Nama Perusahaan';
        const headerNameEl = document.getElementById('profileHeaderCompanyName');
        if (headerNameEl) {
            headerNameEl.textContent = savedCompanyName;
            console.log('Updated profileHeaderCompanyName:', savedCompanyName);
        }
        
        const headerLocationEl = document.getElementById('profileHeaderLocation');
        if (headerLocationEl) {
            headerLocationEl.textContent = updatedData.address || 'Lokasi Perusahaan';
            console.log('Updated profileHeaderLocation:', updatedData.address);
        }
        
        // Update profile image/logo
        const initials = savedCompanyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=1A3D64&color=fff`;
        const profileImageEl = document.getElementById('profileHeaderImage');
        if (profileImageEl) {
            profileImageEl.src = avatarUrl;
        }
        
        // Update profile form fields
        // Extract company metadata from bio if exists
        let companyMetadata = {};
        if (updatedData.bio && updatedData.bio.includes('COMPANY_METADATA:')) {
            try {
                const parts = updatedData.bio.split('COMPANY_METADATA:');
                const metadataJson = parts[1].trim();
                companyMetadata = JSON.parse(metadataJson);
            } catch (e) {
                console.warn('Error parsing company metadata:', e);
            }
        }
        
        // Add metadata to updatedData for loadCompanyInfo
        if (companyMetadata.industry) updatedData.company_industry = companyMetadata.industry;
        if (companyMetadata.size) updatedData.company_size = companyMetadata.size;
        
        // Update company info display directly - THIS IS CRITICAL
        console.log('Calling loadCompanyInfo with updatedData:', updatedData);
        loadCompanyInfo(updatedData);
        
        // Update contact info sidebar
        const contactAddressEl = document.getElementById('contactAddress');
        if (contactAddressEl) {
            contactAddressEl.textContent = updatedData.address || '-';
        }
        
        // Update profile completeness
        calculateProfileCompleteness(updatedData);
        
        console.log('All UI elements updated successfully');
        
        // Re-enable button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
        
    } catch (error) {
        console.error('Error saving company info:', error);
        showAlert('Gagal menyimpan informasi perusahaan: ' + (error.message || 'Terjadi kesalahan'), 'danger');
        
        // Re-enable button on error
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    }
}

// DELETE - Delete company info
function confirmDeleteCompanyInfo() {
    if (!confirm('Apakah Anda yakin ingin menghapus semua informasi perusahaan?\n\nData yang dihapus tidak dapat dikembalikan.')) {
        return;
    }
    deleteCompanyInfo();
}

async function deleteCompanyInfo() {
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        // Clear company info fields
        const companyData = {
            company_name: null,
            address: null,
            portfolio_url: null,
            linkedin_url: null,
        };
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update(companyData)
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Informasi perusahaan berhasil dihapus!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('companyInfoModal')).hide();
        
        // Reload profile to update display
        await loadProfile();
    } catch (error) {
        console.error('Error deleting company info:', error);
        showAlert('Gagal menghapus informasi perusahaan: ' + error.message, 'danger');
    }
}

// Legacy function - redirect to add
function openCompanyInfoModal() {
    addCompanyInfo();
}

// Handle profile form submission
function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
            
            try {
                const supabaseClient = authManager.getSupabaseClient();
                if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
                
                const profileData = {
                    full_name: document.getElementById('profileFullName').value,
                    username: document.getElementById('profileUsername').value,
                    phone: document.getElementById('profilePhone').value,
                };
                
                // Also update company info if fields exist
                const companyInfoName = document.getElementById('companyInfoName');
                if (companyInfoName && companyInfoName.value) {
                    profileData.company_name = companyInfoName.value;
                }
                
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .update(profileData)
                    .eq('id', authManager.currentUser.id);
                
                if (error) throw error;
                
                showAlert('Profil berhasil diperbarui!', 'success');
                
                // Update user name in header
                document.getElementById('userName').textContent = profileData.full_name || profileData.username;
                
                // Reload profile to update header and sidebar
                await loadProfile();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
                if (modal) modal.hide();
            } catch (error) {
                console.error('Error updating profile:', error);
                showAlert('Gagal memperbarui profil: ' + error.message, 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

function setupEventListeners() {
    // Prevent form submission for companyInfoForm
    const companyInfoForm = document.getElementById('companyInfoForm');
    if (companyInfoForm) {
        companyInfoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveCompanyInfo();
        });
    }
    
    // Also add click handler to save button as backup (in case onclick doesn't work)
    const saveCompanyInfoBtn = document.querySelector('#companyInfoModal .btn-primary[onclick*="saveCompanyInfo"]');
    if (saveCompanyInfoBtn) {
        // Remove existing onclick and use addEventListener instead
        saveCompanyInfoBtn.removeAttribute('onclick');
        saveCompanyInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Save button clicked via addEventListener');
            saveCompanyInfo();
        });
    }
    
    // Profile link
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Profile link clicked');
            showPage('profile');
            // Update navigation active state
            document.querySelectorAll('.navbar-nav .nav-link[data-page]').forEach(l => l.classList.remove('active'));
        });
    } else {
        console.error('Profile link not found!');
    }
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        await authManager.logout();
        window.location.href = 'index.html';
    });

    // Add job buttons
    document.getElementById('addJobBtn').addEventListener('click', () => openJobModal());
    document.getElementById('addJobBtn2').addEventListener('click', () => openJobModal());

    // Save job
    document.getElementById('saveJobBtn').addEventListener('click', async () => {
        await saveJob();
    });

    // Filter applicants by job
    document.getElementById('applicantJobFilter').addEventListener('change', (e) => {
        filterApplicants(e.target.value);
    });
}

async function loadOverview() {
    // Load statistics
    const stats = await applicationsManager.getApplicationStats();
    if (stats) {
        document.getElementById('totalApplicants').textContent = stats.total;
        document.getElementById('pendingApplications').textContent = stats.pending;
        document.getElementById('acceptedApplications').textContent = stats.accepted;
    }

    // Load jobs
    const jobs = await jobsManager.getHRDJobs();
    document.getElementById('totalJobs').textContent = jobs.length;

    // Show recent jobs
    displayRecentJobs(jobs.slice(0, 5));
}

function displayRecentJobs(jobs) {
    const container = document.getElementById('recentJobsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada lowongan</p></div>';
        return;
    }

    container.innerHTML = jobs.map(job => `
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
            <div>
                <h6 class="fw-bold mb-1">${job.title}</h6>
                <p class="text-muted mb-0">${job.company} - ${job.location || 'N/A'}</p>
                <small class="text-muted">${formatDate(job.created_at)}</small>
            </div>
            <div>
                <button class="btn btn-sm btn-outline-primary me-2" onclick="editJob('${job.id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${job.id}')">
                    <i class="bi bi-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

async function loadJobs() {
    const jobs = await jobsManager.getHRDJobs();
    displayJobs(jobs);
}

function displayJobs(jobs) {
    const container = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada lowongan. Klik "Tambah Lowongan" untuk membuat lowongan baru.</p></div>';
        return;
    }

    container.innerHTML = jobs.map(job => `
        <div class="card job-card mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="fw-bold mb-2">${job.title}</h5>
                        <p class="text-muted mb-2">
                            <i class="bi bi-building me-2"></i>${job.company}
                            <span class="ms-3"><i class="bi bi-geo-alt me-2"></i>${job.location || 'N/A'}</span>
                        </p>
                        <div class="mb-2">
                            <span class="job-badge bg-primary text-white me-2">${job.category || 'N/A'}</span>
                            <span class="job-badge bg-secondary text-white">${job.employment_type || 'N/A'}</span>
                        </div>
                        <p class="text-muted mb-0">Dibuat: ${formatDate(job.created_at)}</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-primary me-2" onclick="viewJobApplicants('${job.id}')">
                            <i class="bi bi-people me-2"></i>Lihat Pelamar
                        </button>
                        <button class="btn btn-outline-primary me-2" onclick="editJob('${job.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteJob('${job.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadApplicants() {
    try {
        const container = document.getElementById('applicantsList');
        if (container) {
            container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }

        const jobs = await jobsManager.getHRDJobs();
        console.log('HRD Jobs loaded:', jobs);
        
        // Populate job filter
        const filterSelect = document.getElementById('applicantJobFilter');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Semua Lowongan</option>' + 
                jobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
        }

        // Load all applications
        allApplications = [];
        for (const job of jobs) {
            try {
                console.log(`Loading applications for job ${job.id} (${job.title})`);
                const applications = await applicationsManager.getJobApplications(job.id);
                console.log(`Found ${applications?.length || 0} applications for job ${job.id}`);
                if (applications && applications.length > 0) {
                    allApplications.push(...applications.map(app => ({ ...app, job_title: job.title })));
                }
            } catch (error) {
                console.error(`Error loading applications for job ${job.id}:`, error);
                // Continue with other jobs even if one fails
            }
        }

        console.log('Total applications loaded:', allApplications.length);
        displayApplicants(allApplications);
    } catch (error) {
        console.error('Error in loadApplicants:', error);
        const container = document.getElementById('applicantsList');
        if (container) {
            container.innerHTML = `<div class="alert alert-danger">Error memuat data pelamar: ${error.message}</div>`;
        }
    }
}

function filterApplicants(jobId) {
    if (!jobId) {
        displayApplicants(allApplications);
        return;
    }

    const filtered = allApplications.filter(app => app.job_id === jobId);
    displayApplicants(filtered);
}

function displayApplicants(applications) {
    const container = document.getElementById('applicantsList');
    
    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada pelamar</p></div>';
        return;
    }

    container.innerHTML = applications.map(app => {
        const user = app.user_profiles;
        console.log('Displaying applicant:', { 
            app_id: app.id, 
            user_id: app.user_id, 
            has_user: !!user, 
            user_name: user?.full_name,
            user_username: user?.username,
            user_email: user?.email,
            user_phone: user?.phone,
            full_user_object: user
        });
        
        // Determine display name
        const displayName = user?.full_name || user?.username || `User ${app.user_id?.substring(0, 8)}` || 'N/A';
        
        const statusClass = {
            'Pending': 'status-pending',
            'Lolos Administrasi': 'status-info',
            'Lolos Test Tulis': 'status-info',
            'Lolos Wawancara': 'status-info',
            'Diterima': 'status-accepted',
            'Ditolak': 'status-rejected'
        }[app.status] || 'status-pending';

        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <h6 class="fw-bold mb-1">${displayName}</h6>
                            <p class="text-muted mb-1">
                                ${user?.email ? `<i class="bi bi-envelope me-2"></i>${user.email}<br>` : ''}
                                <i class="bi bi-telephone me-2"></i>${user?.phone || 'Belum ditambahkan'}
                            </p>
                            <p class="mb-0"><strong>Lowongan:</strong> ${app.job_title || 'N/A'}</p>
                            ${user?.role ? `<small class="text-muted d-block mt-1">Role: ${user.role}</small>` : ''}
                            ${!user ? `<small class="text-warning d-block mt-1">⚠️ Profil tidak ditemukan (User ID: ${app.user_id?.substring(0, 8)}...)</small>` : ''}
                        </div>
                        <div class="col-md-3">
                            <span class="status-badge ${statusClass}">${app.status}</span>
                            ${app.cv_url ? `<a href="${app.cv_url}" target="_blank" class="btn btn-sm btn-outline-primary mt-2 d-block">
                                <i class="bi bi-file-earmark-pdf me-2"></i>Lihat CV
                            </a>` : ''}
                        </div>
                        <div class="col-md-5">
                            <div class="mb-2">
                                <label class="form-label small">Update Status:</label>
                                <select class="form-select form-select-sm" onchange="updateApplicationStatus('${app.id}', this.value)">
                                    <option value="Pending" ${app.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Lolos Administrasi" ${app.status === 'Lolos Administrasi' ? 'selected' : ''}>Lolos Administrasi</option>
                                    <option value="Lolos Test Tulis" ${app.status === 'Lolos Test Tulis' ? 'selected' : ''}>Lolos Test Tulis</option>
                                    <option value="Lolos Wawancara" ${app.status === 'Lolos Wawancara' ? 'selected' : ''}>Lolos Wawancara</option>
                                    <option value="Diterima" ${app.status === 'Diterima' ? 'selected' : ''}>Diterima</option>
                                    <option value="Ditolak" ${app.status === 'Ditolak' ? 'selected' : ''}>Ditolak</option>
                                </select>
                            </div>
                            ${app.cover_letter ? `<button class="btn btn-sm btn-outline-info" onclick="viewCoverLetter('${app.id}')">
                                <i class="bi bi-file-text me-2"></i>Lihat Surat Lamaran
                            </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadStatistics() {
    const stats = await applicationsManager.getApplicationStats();
    
    if (stats) {
        // Create chart
        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Interview', 'Accepted', 'Rejected'],
                datasets: [{
                    data: [stats.pending, stats.interview, stats.accepted, stats.rejected],
                    backgroundColor: ['#ffc107', '#0dcaf0', '#198754', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    // Load applicants per job
    const jobs = await jobsManager.getHRDJobs();
    const applicantsPerJob = [];
    
    for (const job of jobs) {
        const jobApps = await applicationsManager.getJobApplications(job.id);
        applicantsPerJob.push({ job: job.title, count: jobApps.length });
    }

    displayApplicantsPerJob(applicantsPerJob);
}

function displayApplicantsPerJob(data) {
    const container = document.getElementById('applicantsPerJob');
    
    if (data.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada data</p></div>';
        return;
    }

    container.innerHTML = data.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <span>${item.job}</span>
            <span class="badge bg-primary">${item.count} pelamar</span>
        </div>
    `).join('');
}

function openJobModal(jobId = null) {
    currentJobId = jobId;
    const modal = new bootstrap.Modal(document.getElementById('jobModal'));
    const form = document.getElementById('jobForm');
    
    if (jobId) {
        document.getElementById('jobModalTitle').textContent = 'Edit Lowongan Pekerjaan';
        // Load job data
        loadJobData(jobId);
    } else {
        document.getElementById('jobModalTitle').textContent = 'Tambah Lowongan Pekerjaan';
        form.reset();
        document.getElementById('jobId').value = '';
    }
    
    // Update counters after modal is shown
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
    modal.show();
}

async function loadJobData(jobId) {
    const job = await jobsManager.getJobById(jobId);
    if (job) {
        document.getElementById('jobId').value = job.id;
        document.getElementById('jobTitle').value = job.title;
        document.getElementById('jobCompany').value = job.company;
        document.getElementById('jobLocation').value = job.location || '';
        document.getElementById('jobCategory').value = job.category || '';
        document.getElementById('jobSalaryMin').value = job.salary_min || '';
        document.getElementById('jobSalaryMax').value = job.salary_max || '';
        document.getElementById('jobEmploymentType').value = job.employment_type || 'Full-time';
        document.getElementById('jobDescription').value = job.description;
        document.getElementById('jobRequirements').value = job.requirements;
    }
}

async function saveJob() {
    const form = document.getElementById('jobForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const jobData = {
        title: document.getElementById('jobTitle').value,
        company: document.getElementById('jobCompany').value,
        location: document.getElementById('jobLocation').value,
        category: document.getElementById('jobCategory').value,
        salaryMin: parseInt(document.getElementById('jobSalaryMin').value) || null,
        salaryMax: parseInt(document.getElementById('jobSalaryMax').value) || null,
        employmentType: document.getElementById('jobEmploymentType').value,
        description: document.getElementById('jobDescription').value,
        requirements: document.getElementById('jobRequirements').value
    };

    const jobId = document.getElementById('jobId').value;
    const result = jobId 
        ? await jobsManager.updateJob(jobId, jobData)
        : await jobsManager.createJob(jobData);

    if (result.success) {
        showAlert('Lowongan berhasil ' + (jobId ? 'diupdate' : 'dibuat'), 'success');
        bootstrap.Modal.getInstance(document.getElementById('jobModal')).hide();
        loadJobs();
        loadOverview();
    } else {
        showAlert('Error: ' + result.error, 'danger');
    }
}

async function editJob(jobId) {
    openJobModal(jobId);
}

async function deleteJob(jobId) {
    if (!confirm('Apakah Anda yakin ingin menghapus lowongan ini?\n\nLowongan yang dihapus tidak dapat dikembalikan.')) return;

    try {
        const result = await jobsManager.deleteJob(jobId);
        if (result.success) {
            showAlert('Lowongan berhasil dihapus', 'success');
            loadJobs();
            loadOverview();
        } else {
            showAlert('Gagal menghapus lowongan: ' + result.error, 'danger');
            console.error('Delete job error:', result.error);
        }
    } catch (error) {
        console.error('Error in deleteJob:', error);
        showAlert('Gagal menghapus lowongan: ' + error.message, 'danger');
    }
}

function viewJobApplicants(jobId) {
    showPage('applicants');
    document.getElementById('applicantJobFilter').value = jobId;
    filterApplicants(jobId);
}

async function updateApplicationStatus(applicationId, status) {
    const result = await applicationsManager.updateApplicationStatus(applicationId, status);
    if (result.success) {
        showAlert('Status aplikasi berhasil diupdate', 'success');
        loadApplicants();
        loadOverview();
    } else {
        showAlert('Error: ' + result.error, 'danger');
    }
}

function viewCoverLetter(applicationId) {
    const application = allApplications.find(app => app.id === applicationId);
    if (application && application.cover_letter) {
        alert(application.cover_letter);
    }
}

