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
    console.log('loadProfile called');
    const profile = await authManager.getCurrentUserProfile();
    console.log('Profile data:', profile);
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
        document.getElementById('profileCompany').value = profile.company_name || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profileCompanyWebsite').value = profile.portfolio_url || '';
        document.getElementById('profileCompanyLinkedIn').value = profile.linkedin_url || '';
        
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
        { inputId: 'profileCompany', counterId: 'profileCompanyCounter', maxLength: 100 },
        { inputId: 'profileAddress', counterId: 'profileAddressCounter', maxLength: 500 },
        { inputId: 'profileCompanyWebsite', counterId: 'profileCompanyWebsiteCounter', maxLength: 200 },
        { inputId: 'profileCompanyIndustry', counterId: 'profileCompanyIndustryCounter', maxLength: 50 },
        { inputId: 'profileCompanyLinkedIn', counterId: 'profileCompanyLinkedInCounter', maxLength: 200 },
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
            .single();
        
        let bioToSave = aboutText;
        
        // If vision & mission exists, preserve it
        if (currentProfile?.bio && currentProfile.bio.includes('VISI:')) {
            // Keep vision & mission, replace only the about part
            // For simplicity, we'll store about separately or combine them
            // For now, we'll just save the about text
            // In a real app, you might want separate fields
            bioToSave = aboutText;
        }
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave })
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Deskripsi perusahaan berhasil disimpan!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('companyAboutModal')).hide();
        await loadProfile();
    } catch (error) {
        console.error('Error saving company about:', error);
        showAlert('Gagal menyimpan deskripsi: ' + error.message, 'danger');
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
            .single();
        
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
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ bio: bioToSave })
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Visi & Misi berhasil disimpan!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('visionMissionModal')).hide();
        await loadProfile();
    } catch (error) {
        console.error('Error saving vision mission:', error);
        showAlert('Gagal menyimpan visi & misi: ' + error.message, 'danger');
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
    if (!profile) return;
    
    // Check if company has any info
    const hasCompanyInfo = profile.company_name || 
                          profile.address || 
                          profile.portfolio_url || 
                          profile.linkedin_url;
    
    if (hasCompanyInfo) {
        // Display company info
        document.getElementById('displayCompanyName').textContent = profile.company_name || '-';
        document.getElementById('displayCompanyIndustry').textContent = 'Belum diisi'; // Can be stored in separate field
        document.getElementById('displayCompanySize').textContent = 'Belum diisi'; // Can be stored in separate field
        document.getElementById('displayCompanyAddress').textContent = profile.address || '-';
        
        // Website
        const websiteEl = document.getElementById('displayCompanyWebsite');
        if (profile.portfolio_url) {
            websiteEl.textContent = profile.portfolio_url;
            websiteEl.href = profile.portfolio_url;
            websiteEl.style.display = 'inline';
        } else {
            websiteEl.textContent = '-';
            websiteEl.href = '#';
            websiteEl.style.display = 'none';
        }
        
        // LinkedIn
        const linkedInEl = document.getElementById('displayCompanyLinkedIn');
        if (profile.linkedin_url) {
            linkedInEl.textContent = profile.linkedin_url;
            linkedInEl.href = profile.linkedin_url;
            linkedInEl.style.display = 'inline';
        } else {
            linkedInEl.textContent = '-';
            linkedInEl.href = '#';
            linkedInEl.style.display = 'none';
        }
        
        // Show display, hide add button
        document.getElementById('companyInfoDisplay').style.display = 'block';
        document.getElementById('addCompanyInfoBtn').style.display = 'none';
    } else {
        // Hide display, show add button
        document.getElementById('companyInfoDisplay').style.display = 'none';
        document.getElementById('addCompanyInfoBtn').style.display = 'block';
    }
}

// CREATE - Add new company info
async function addCompanyInfo() {
    const modal = new bootstrap.Modal(document.getElementById('companyInfoModal'));
    document.getElementById('companyInfoModalTitle').textContent = 'Tambah Informasi Perusahaan';
    document.getElementById('deleteCompanyInfoBtn').style.display = 'none';
    
    // Clear form
    document.getElementById('companyInfoForm').reset();
    
    // Pre-fill with existing data if any
    try {
        const profile = await authManager.getCurrentUserProfile();
        if (profile) {
            document.getElementById('companyInfoName').value = profile.company_name || '';
            document.getElementById('companyInfoAddress').value = profile.address || '';
            document.getElementById('companyInfoWebsite').value = profile.portfolio_url || '';
            document.getElementById('companyInfoLinkedIn').value = profile.linkedin_url || '';
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
        const profile = await authManager.getCurrentUserProfile();
        if (profile) {
            document.getElementById('companyInfoName').value = profile.company_name || '';
            document.getElementById('companyInfoAddress').value = profile.address || '';
            document.getElementById('companyInfoWebsite').value = profile.portfolio_url || '';
            document.getElementById('companyInfoLinkedIn').value = profile.linkedin_url || '';
            document.getElementById('companyInfoIndustry').value = ''; // Store in separate field if needed
            document.getElementById('companyInfoSize').value = ''; // Store in separate field if needed
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
    const form = document.getElementById('companyInfoForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const companyName = document.getElementById('companyInfoName').value.trim();
    if (!companyName) {
        showAlert('Nama perusahaan wajib diisi', 'warning');
        return;
    }
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        const companyData = {
            company_name: companyName,
            address: document.getElementById('companyInfoAddress').value.trim(),
            portfolio_url: document.getElementById('companyInfoWebsite').value.trim(),
            linkedin_url: document.getElementById('companyInfoLinkedIn').value.trim(),
        };
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update(companyData)
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        showAlert('Informasi perusahaan berhasil disimpan!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('companyInfoModal')).hide();
        
        // Reload profile to update display
        await loadProfile();
    } catch (error) {
        console.error('Error saving company info:', error);
        showAlert('Gagal menyimpan informasi perusahaan: ' + error.message, 'danger');
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
                    company_name: document.getElementById('profileCompany').value,
                    address: document.getElementById('profileAddress').value,
                    portfolio_url: document.getElementById('profileCompanyWebsite').value,
                    linkedin_url: document.getElementById('profileCompanyLinkedIn').value,
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

