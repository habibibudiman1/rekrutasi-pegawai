// Pelamar Dashboard JavaScript

let currentApplyJobId = null;

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
            role: 'Pelamar', // Default role
            is_verified: true,
            email: authManager.currentUser.email
        };
        
        // Show a non-blocking warning instead of alert
        if (typeof showAlert === 'function') {
            showAlert('Profil pengguna belum lengkap. Silakan lengkapi profil Anda di halaman Profile.', 'warning');
        }
    }

    // Check role - redirect if not Pelamar
    if (profile.role !== 'Pelamar') {
        console.warn('⚠️ User role is not Pelamar:', profile.role, '- Redirecting...');
        if (profile.role === 'HRD') {
            console.log('🔄 Redirecting HRD to dashboard-hrd.html');
            window.location.href = 'dashboard-hrd.html';
            return;
        } else {
            console.log('🔄 Unknown role, redirecting to home');
            window.location.href = 'index.html';
            return;
        }
    }
    
    console.log('✅ User is Pelamar, continuing to Pelamar dashboard');

    // Update user name
    document.getElementById('userName').textContent = profile.full_name || profile.username;

    // Setup navigation
    setupNavigation();
    
    // Load initial data
    await loadOverview();
    
    // Setup event listeners
    setupEventListeners();
    setupProfileForm();
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
                // Set up enter key listeners for search
                setTimeout(() => {
                    const searchKeyword = document.getElementById('searchKeyword');
                    const searchLocation = document.getElementById('searchLocation');
                    if (searchKeyword) {
                        searchKeyword.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                searchJobs();
                            }
                        });
                    }
                    if (searchLocation) {
                        searchLocation.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                searchJobs();
                            }
                        });
                    }
                }, 100);
                break;
            case 'applications':
                loadApplications();
                break;
            case 'recommendations':
                loadRecommendations();
                break;
            case 'profile':
                console.log('Loading profile page...');
                loadProfile();
                loadCareerHistory();
                loadEducation();
                loadLicenses();
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
        document.getElementById('profileHeaderName').textContent = profile.full_name || profile.username || 'User';
        document.getElementById('profileHeaderLocation').textContent = profile.address || 'Belum ditambahkan';
        document.getElementById('profileHeaderEmail').textContent = authManager.currentUser?.email || '';
        
        // Update profile avatar
        if (profile.full_name) {
            const initials = profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            document.getElementById('profileHeaderImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=1A3D64&color=fff&bold=true`;
        }
        
        // Update form fields (for modal)
        document.getElementById('profileFullName').value = profile.full_name || '';
        document.getElementById('profileUsername').value = profile.username || '';
        document.getElementById('profileEmail').value = authManager.currentUser?.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileAddress').value = profile.address || '';
        document.getElementById('profileBio').value = profile.bio || '';
        document.getElementById('profileLinkedIn').value = profile.linkedin_url || '';
        document.getElementById('profilePortfolio').value = profile.portfolio_url || '';
        
        // Update personal summary if exists
        if (profile.bio) {
            document.getElementById('personalSummaryText').textContent = profile.bio;
            document.getElementById('personalSummaryContent').style.display = 'block';
            document.getElementById('addPersonalSummaryBtn').style.display = 'none';
        } else {
            document.getElementById('personalSummaryContent').style.display = 'none';
            document.getElementById('addPersonalSummaryBtn').style.display = 'block';
        }
        
        // Calculate profile strength
        updateProfileStrength(profile);
    }
}

function updateProfileStrength(profile) {
    let strength = 0;
    let total = 5; // Total fields: name, email, phone, address, bio
    
    if (profile.full_name) strength++;
    if (authManager.currentUser?.email) strength++;
    if (profile.phone) strength++;
    if (profile.address) strength++;
    if (profile.bio) strength++;
    
    const percentage = (strength / total) * 100;
    document.getElementById('profileStrengthBar').style.width = percentage + '%';
}

function cancelProfileEdit() {
    loadProfile();
}

// Handle profile form submission
function setupProfileForm() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
            modal.show();
        });
    }
}

async function saveProfile() {
    const submitBtn = document.querySelector('#editProfileModal button[onclick="saveProfile()"]');
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
            address: document.getElementById('profileAddress').value,
            bio: document.getElementById('profileBio').value,
            linkedin_url: document.getElementById('profileLinkedIn').value || null,
            portfolio_url: document.getElementById('profilePortfolio').value || null,
        };
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update(profileData)
            .eq('id', authManager.currentUser.id);
        
        if (error) throw error;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        if (modal) modal.hide();
        
        showAlert('Profil berhasil diperbarui!', 'success');
        
        // Reload profile data
        await loadProfile();
        
        // Update user name in header
        document.getElementById('userName').textContent = profileData.full_name || profileData.username;
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Gagal memperbarui profil: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function addPersonalSummary() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
    // Focus on bio field
    setTimeout(() => {
        document.getElementById('profileBio').focus();
    }, 500);
}

function editPersonalSummary() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

// ========== Career History CRUD ==========
let careerHistory = [];
let educationList = [];
let licensesList = [];

async function loadCareerHistory() {
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) return;
        
        const { data, error } = await supabaseClient
            .from('career_history')
            .select('*')
            .eq('user_id', authManager.currentUser.id)
            .order('start_date', { ascending: false });
        
        if (error) throw error;
        
        careerHistory = data || [];
        displayCareerHistory();
    } catch (error) {
        console.error('Error loading career history:', error);
        showAlert('Gagal memuat riwayat karier: ' + error.message, 'danger');
    }
}

function displayCareerHistory() {
    const container = document.getElementById('careerHistoryList');
    if (!container) return;
    
    if (careerHistory.length === 0) {
        container.innerHTML = '<div class="empty-state-profile">Belum ada riwayat karier</div>';
        return;
    }
    
    container.innerHTML = careerHistory.map(career => `
        <div class="profile-item">
            <div class="profile-item-header">
                <div>
                    <div class="profile-item-title">${career.job_title}</div>
                    <div class="profile-item-subtitle">${career.company_name}</div>
                    <div class="profile-item-meta">
                        ${career.location ? `<span><i class="bi bi-geo-alt"></i> ${career.location}</span>` : ''}
                        <span><i class="bi bi-calendar"></i> ${formatDateRange(career.start_date, career.end_date, career.is_current)}</span>
                        ${career.is_current ? '<span class="profile-item-badge current">Saat Ini</span>' : ''}
                    </div>
                    ${career.description ? `<div class="profile-item-description">${career.description}</div>` : ''}
                </div>
            </div>
            <div class="profile-item-actions">
                <button class="btn btn-item-action btn-edit" onclick="editCareer('${career.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-item-action btn-delete" onclick="deleteCareer('${career.id}')" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openCareerModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('careerModal'));
    const form = document.getElementById('careerForm');
    
    if (id) {
        const career = careerHistory.find(c => c.id === id);
        if (career) {
            document.getElementById('careerModalTitle').textContent = 'Edit Jabatan';
            document.getElementById('careerId').value = career.id;
            document.getElementById('careerJobTitle').value = career.job_title;
            document.getElementById('careerCompany').value = career.company_name;
            document.getElementById('careerLocation').value = career.location || '';
            document.getElementById('careerStartDate').value = career.start_date || '';
            document.getElementById('careerEndDate').value = career.end_date || '';
            document.getElementById('careerIsCurrent').checked = career.is_current || false;
            document.getElementById('careerDescription').value = career.description || '';
        }
    } else {
        document.getElementById('careerModalTitle').textContent = 'Tambah Jabatan';
        form.reset();
        document.getElementById('careerId').value = '';
    }
    
    // Handle is_current checkbox
    document.getElementById('careerIsCurrent').addEventListener('change', function() {
        document.getElementById('careerEndDate').disabled = this.checked;
        if (this.checked) {
            document.getElementById('careerEndDate').value = '';
        }
    });
    
    modal.show();
}

async function saveCareer() {
    // Validate form
    const form = document.getElementById('careerForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const submitBtn = document.querySelector('#careerModal button[onclick="saveCareer()"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    
    try {
        const id = document.getElementById('careerId').value;
        const isCurrent = document.getElementById('careerIsCurrent').checked;
        
        // Validate required fields
        const jobTitle = document.getElementById('careerJobTitle').value.trim();
        const company = document.getElementById('careerCompany').value.trim();
        const startDate = document.getElementById('careerStartDate').value;
        
        if (!jobTitle || !company || !startDate) {
            throw new Error('Mohon lengkapi semua field yang wajib diisi');
        }
        
        const careerData = {
            job_title: jobTitle,
            company_name: company,
            location: document.getElementById('careerLocation').value.trim() || null,
            start_date: startDate,
            end_date: isCurrent ? null : (document.getElementById('careerEndDate').value || null),
            is_current: isCurrent,
            description: document.getElementById('careerDescription').value.trim() || null,
        };
        
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) {
            throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
        }
        
        // Check if user is authenticated
        if (!authManager.currentUser || !authManager.currentUser.id) {
            throw new Error('Anda belum login. Silakan login kembali.');
        }
        
        let result;
        if (id) {
            const { data, error } = await supabaseClient
                .from('career_history')
                .update(careerData)
                .eq('id', id)
                .eq('user_id', authManager.currentUser.id) // Ensure user owns this record
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal memperbarui data');
            }
            result = data;
        } else {
            careerData.user_id = authManager.currentUser.id;
            const { data, error } = await supabaseClient
                .from('career_history')
                .insert(careerData)
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal menyimpan data');
            }
            result = data;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('careerModal'));
        if (modal) modal.hide();
        
        showAlert(id ? 'Jabatan berhasil diperbarui!' : 'Jabatan berhasil ditambahkan!', 'success');
        await loadCareerHistory();
        await loadProfile(); // Update profile strength
    } catch (error) {
        console.error('Error saving career:', error);
        let errorMessage = error.message || 'Terjadi kesalahan saat menyimpan data';
        
        // Provide more specific error messages
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            errorMessage = 'Tabel career_history belum dibuat. Silakan hubungi administrator untuk menjalankan script database.';
        } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
            errorMessage = 'Anda tidak memiliki izin untuk menyimpan data. Pastikan Anda sudah login dan policy database sudah dibuat.';
        } else if (error.message?.includes('violates foreign key')) {
            errorMessage = 'Data tidak valid. Pastikan semua field wajib sudah diisi.';
        }
        
        showAlert('Gagal menyimpan: ' + errorMessage, 'danger');
        console.error('Full error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function editCareer(id) {
    openCareerModal(id);
}

async function deleteCareer(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus jabatan ini?')) return;
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        const { error } = await supabaseClient
            .from('career_history')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Jabatan berhasil dihapus!', 'success');
        await loadCareerHistory();
        await loadProfile();
    } catch (error) {
        console.error('Error deleting career:', error);
        showAlert('Gagal menghapus: ' + error.message, 'danger');
    }
}

// ========== Education CRUD ==========
async function loadEducation() {
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) return;
        
        const { data, error } = await supabaseClient
            .from('education')
            .select('*')
            .eq('user_id', authManager.currentUser.id)
            .order('start_date', { ascending: false });
        
        if (error) throw error;
        
        educationList = data || [];
        displayEducation();
    } catch (error) {
        console.error('Error loading education:', error);
        showAlert('Gagal memuat pendidikan: ' + error.message, 'danger');
    }
}

function displayEducation() {
    const container = document.getElementById('educationList');
    if (!container) return;
    
    if (educationList.length === 0) {
        container.innerHTML = '<div class="empty-state-profile">Belum ada data pendidikan</div>';
        return;
    }
    
    container.innerHTML = educationList.map(edu => `
        <div class="profile-item">
            <div class="profile-item-header">
                <div>
                    <div class="profile-item-title">${edu.degree}</div>
                    <div class="profile-item-subtitle">${edu.institution_name}</div>
                    <div class="profile-item-meta">
                        ${edu.field_of_study ? `<span><i class="bi bi-book"></i> ${edu.field_of_study}</span>` : ''}
                        <span><i class="bi bi-calendar"></i> ${formatDateRange(edu.start_date, edu.end_date, edu.is_current)}</span>
                        ${edu.is_current ? '<span class="profile-item-badge current">Sedang Berlangsung</span>' : ''}
                    </div>
                    ${edu.description ? `<div class="profile-item-description">${edu.description}</div>` : ''}
                </div>
            </div>
            <div class="profile-item-actions">
                <button class="btn btn-item-action btn-edit" onclick="editEducation('${edu.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-item-action btn-delete" onclick="deleteEducation('${edu.id}')" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openEducationModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('educationModal'));
    const form = document.getElementById('educationForm');
    
    if (id) {
        const edu = educationList.find(e => e.id === id);
        if (edu) {
            document.getElementById('educationModalTitle').textContent = 'Edit Pendidikan';
            document.getElementById('educationId').value = edu.id;
            document.getElementById('educationInstitution').value = edu.institution_name;
            document.getElementById('educationDegree').value = edu.degree;
            document.getElementById('educationField').value = edu.field_of_study || '';
            document.getElementById('educationStartDate').value = edu.start_date || '';
            document.getElementById('educationEndDate').value = edu.end_date || '';
            document.getElementById('educationIsCurrent').checked = edu.is_current || false;
            document.getElementById('educationDescription').value = edu.description || '';
        }
    } else {
        document.getElementById('educationModalTitle').textContent = 'Tambah Pendidikan';
        form.reset();
        document.getElementById('educationId').value = '';
    }
    
    document.getElementById('educationIsCurrent').addEventListener('change', function() {
        document.getElementById('educationEndDate').disabled = this.checked;
        if (this.checked) {
            document.getElementById('educationEndDate').value = '';
        }
    });
    
    modal.show();
}

async function saveEducation() {
    // Validate form
    const form = document.getElementById('educationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const submitBtn = document.querySelector('#educationModal button[onclick="saveEducation()"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    
    try {
        const id = document.getElementById('educationId').value;
        const isCurrent = document.getElementById('educationIsCurrent').checked;
        
        // Validate required fields
        const institution = document.getElementById('educationInstitution').value.trim();
        const degree = document.getElementById('educationDegree').value.trim();
        
        if (!institution || !degree) {
            throw new Error('Mohon lengkapi semua field yang wajib diisi');
        }
        
        const eduData = {
            institution_name: institution,
            degree: degree,
            field_of_study: document.getElementById('educationField').value.trim() || null,
            start_date: document.getElementById('educationStartDate').value || null,
            end_date: isCurrent ? null : (document.getElementById('educationEndDate').value || null),
            is_current: isCurrent,
            description: document.getElementById('educationDescription').value.trim() || null,
        };
        
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) {
            throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
        }
        
        if (!authManager.currentUser || !authManager.currentUser.id) {
            throw new Error('Anda belum login. Silakan login kembali.');
        }
        
        let result;
        if (id) {
            const { data, error } = await supabaseClient
                .from('education')
                .update(eduData)
                .eq('id', id)
                .eq('user_id', authManager.currentUser.id)
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal memperbarui data');
            }
            result = data;
        } else {
            eduData.user_id = authManager.currentUser.id;
            const { data, error } = await supabaseClient
                .from('education')
                .insert(eduData)
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal menyimpan data');
            }
            result = data;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('educationModal'));
        if (modal) modal.hide();
        
        showAlert(id ? 'Pendidikan berhasil diperbarui!' : 'Pendidikan berhasil ditambahkan!', 'success');
        await loadEducation();
        await loadProfile();
    } catch (error) {
        console.error('Error saving education:', error);
        let errorMessage = error.message || 'Terjadi kesalahan saat menyimpan data';
        
        // Provide more specific error messages
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            errorMessage = 'Tabel education belum dibuat. Silakan hubungi administrator untuk menjalankan script database.';
        } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
            errorMessage = 'Anda tidak memiliki izin untuk menyimpan data. Pastikan Anda sudah login dan policy database sudah dibuat.';
        } else if (error.message?.includes('violates foreign key')) {
            errorMessage = 'Data tidak valid. Pastikan semua field wajib sudah diisi.';
        }
        
        showAlert('Gagal menyimpan: ' + errorMessage, 'danger');
        console.error('Full error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function editEducation(id) {
    openEducationModal(id);
}

async function deleteEducation(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus pendidikan ini?')) return;
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        const { error } = await supabaseClient
            .from('education')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Pendidikan berhasil dihapus!', 'success');
        await loadEducation();
        await loadProfile();
    } catch (error) {
        console.error('Error deleting education:', error);
        showAlert('Gagal menghapus: ' + error.message, 'danger');
    }
}

// ========== Licenses CRUD ==========
async function loadLicenses() {
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) return;
        
        const { data, error } = await supabaseClient
            .from('licenses')
            .select('*')
            .eq('user_id', authManager.currentUser.id)
            .order('issue_date', { ascending: false });
        
        if (error) throw error;
        
        licensesList = data || [];
        displayLicenses();
    } catch (error) {
        console.error('Error loading licenses:', error);
        showAlert('Gagal memuat lisensi: ' + error.message, 'danger');
    }
}

function displayLicenses() {
    const container = document.getElementById('licensesList');
    if (!container) return;
    
    if (licensesList.length === 0) {
        container.innerHTML = '<div class="empty-state-profile">Belum ada lisensi atau sertifikat</div>';
        return;
    }
    
    container.innerHTML = licensesList.map(license => `
        <div class="profile-item">
            <div class="profile-item-header">
                <div>
                    <div class="profile-item-title">${license.name}</div>
                    <div class="profile-item-subtitle">${license.issuing_organization}</div>
                    <div class="profile-item-meta">
                        ${license.issue_date ? `<span><i class="bi bi-calendar-check"></i> Diterbitkan: ${formatDate(license.issue_date)}</span>` : ''}
                        ${license.expiry_date ? `<span><i class="bi bi-calendar-x"></i> Kedaluwarsa: ${formatDate(license.expiry_date)}</span>` : ''}
                        ${license.credential_id ? `<span><i class="bi bi-hash"></i> ID: ${license.credential_id}</span>` : ''}
                    </div>
                    ${license.credential_url ? `<div class="profile-item-description"><a href="${license.credential_url}" target="_blank" class="text-primary"><i class="bi bi-link-45deg"></i> Lihat Kredensial</a></div>` : ''}
                </div>
            </div>
            <div class="profile-item-actions">
                <button class="btn btn-item-action btn-edit" onclick="editLicense('${license.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-item-action btn-delete" onclick="deleteLicense('${license.id}')" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openLicenseModal(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('licenseModal'));
    const form = document.getElementById('licenseForm');
    
    if (id) {
        const license = licensesList.find(l => l.id === id);
        if (license) {
            document.getElementById('licenseModalTitle').textContent = 'Edit Lisensi';
            document.getElementById('licenseId').value = license.id;
            document.getElementById('licenseName').value = license.name;
            document.getElementById('licenseOrganization').value = license.issuing_organization;
            document.getElementById('licenseIssueDate').value = license.issue_date || '';
            document.getElementById('licenseExpiryDate').value = license.expiry_date || '';
            document.getElementById('licenseCredentialId').value = license.credential_id || '';
            document.getElementById('licenseCredentialUrl').value = license.credential_url || '';
        }
    } else {
        document.getElementById('licenseModalTitle').textContent = 'Tambah Lisensi';
        form.reset();
        document.getElementById('licenseId').value = '';
    }
    
    modal.show();
}

async function saveLicense() {
    // Validate form
    const form = document.getElementById('licenseForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const submitBtn = document.querySelector('#licenseModal button[onclick="saveLicense()"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    
    try {
        const id = document.getElementById('licenseId').value;
        
        // Validate required fields
        const name = document.getElementById('licenseName').value.trim();
        const organization = document.getElementById('licenseOrganization').value.trim();
        
        if (!name || !organization) {
            throw new Error('Mohon lengkapi semua field yang wajib diisi');
        }
        
        const licenseData = {
            name: name,
            issuing_organization: organization,
            issue_date: document.getElementById('licenseIssueDate').value || null,
            expiry_date: document.getElementById('licenseExpiryDate').value || null,
            credential_id: document.getElementById('licenseCredentialId').value.trim() || null,
            credential_url: document.getElementById('licenseCredentialUrl').value.trim() || null,
        };
        
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) {
            throw new Error('Supabase client tidak tersedia. Silakan refresh halaman.');
        }
        
        if (!authManager.currentUser || !authManager.currentUser.id) {
            throw new Error('Anda belum login. Silakan login kembali.');
        }
        
        let result;
        if (id) {
            const { data, error } = await supabaseClient
                .from('licenses')
                .update(licenseData)
                .eq('id', id)
                .eq('user_id', authManager.currentUser.id)
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal memperbarui data');
            }
            result = data;
        } else {
            licenseData.user_id = authManager.currentUser.id;
            const { data, error } = await supabaseClient
                .from('licenses')
                .insert(licenseData)
                .select()
                .single();
            if (error) {
                console.error('Supabase error:', error);
                throw new Error(error.message || 'Gagal menyimpan data');
            }
            result = data;
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('licenseModal'));
        if (modal) modal.hide();
        
        showAlert(id ? 'Lisensi berhasil diperbarui!' : 'Lisensi berhasil ditambahkan!', 'success');
        await loadLicenses();
        await loadProfile();
    } catch (error) {
        console.error('Error saving license:', error);
        let errorMessage = error.message || 'Terjadi kesalahan saat menyimpan data';
        
        // Provide more specific error messages
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            errorMessage = 'Tabel licenses belum dibuat. Silakan hubungi administrator untuk menjalankan script database.';
        } else if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
            errorMessage = 'Anda tidak memiliki izin untuk menyimpan data. Pastikan Anda sudah login dan policy database sudah dibuat.';
        } else if (error.message?.includes('violates foreign key')) {
            errorMessage = 'Data tidak valid. Pastikan semua field wajib sudah diisi.';
        }
        
        showAlert('Gagal menyimpan: ' + errorMessage, 'danger');
        console.error('Full error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function editLicense(id) {
    openLicenseModal(id);
}

async function deleteLicense(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus lisensi ini?')) return;
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        const { error } = await supabaseClient
            .from('licenses')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showAlert('Lisensi berhasil dihapus!', 'success');
        await loadLicenses();
        await loadProfile();
    } catch (error) {
        console.error('Error deleting license:', error);
        showAlert('Gagal menghapus: ' + error.message, 'danger');
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateRange(startDate, endDate, isCurrent) {
    const start = formatDate(startDate);
    if (isCurrent) {
        return `${start} - Saat Ini`;
    }
    const end = formatDate(endDate);
    return end ? `${start} - ${end}` : start;
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
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await authManager.logout();
            window.location.href = 'index.html';
        });
    }

    // Submit application
    const submitApplicationBtn = document.getElementById('submitApplicationBtn');
    if (submitApplicationBtn) {
        submitApplicationBtn.addEventListener('click', async () => {
            await submitApplication();
        });
    }

    // Search on enter (only if element exists)
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchJobs();
            }
        });
    }
}

async function loadOverview() {
    const manager = window.applicationsManager || applicationsManager;
    if (!manager) {
        console.error('applicationsManager is not defined');
        return;
    }
    const applications = await manager.getUserApplications();
    
    // Update statistics
    document.getElementById('totalApplications').textContent = applications.length;
    document.getElementById('pendingApplications').textContent = 
        applications.filter(app => app.status === 'Pending' || app.status === 'Lolos Administrasi' || app.status === 'Lolos Test Tulis' || app.status === 'Lolos Wawancara').length;
    document.getElementById('acceptedApplications').textContent = 
        applications.filter(app => app.status === 'Diterima').length;

    // Show recent applications
    displayRecentApplications(applications.slice(0, 5));
}

function displayRecentApplications(applications) {
    const container = document.getElementById('recentApplicationsList');
    
    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada lamaran</p></div>';
        return;
    }

    container.innerHTML = applications.map(app => {
        const statusClass = {
            'Pending': 'status-pending',
            'Lolos Administrasi': 'status-info',
            'Lolos Test Tulis': 'status-info',
            'Lolos Wawancara': 'status-info',
            'Diterima': 'status-accepted',
            'Ditolak': 'status-rejected'
        }[app.status] || 'status-pending';

        return `
            <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <div>
                    <h6 class="fw-bold mb-1">${app.jobs?.title || 'N/A'}</h6>
                    <p class="text-muted mb-1">${app.jobs?.company || 'N/A'} - ${app.jobs?.location || 'N/A'}</p>
                    <small class="text-muted">Dilamar: ${formatDate(app.created_at)}</small>
                </div>
                <div>
                    <span class="status-badge ${statusClass}">${app.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function loadJobs() {
    const jobs = await jobsManager.getAllJobs();
    displayJobs(jobs);
}

function displayJobs(jobs) {
    const container = document.getElementById('jobsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Tidak ada lowongan ditemukan</p></div>';
        return;
    }

    // Wait for all async operations
    Promise.all(jobs.map(async job => {
        const manager = window.applicationsManager || applicationsManager;
        const hasApplied = manager ? await manager.getApplicationByJob(job.id) : null;
        return { job, hasApplied };
    })).then(results => {
        container.innerHTML = results.map(({ job, hasApplied }) => `
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
                                ${job.salary_min ? `<span class="job-badge bg-success text-white">${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max || job.salary_min)}</span>` : ''}
                            </div>
                            <p class="text-muted mb-0">${job.description.substring(0, 150)}...</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <div class="d-flex flex-column gap-2 align-items-end">
                                ${hasApplied 
                                    ? '<span class="badge bg-info px-3 py-2">Sudah Dilamar</span>'
                                    : `<button class="btn btn-primary" onclick="openApplyModal('${job.id}')">
                                        <i class="bi bi-send me-2"></i>Lamar Sekarang
                                    </button>`
                                }
                                <a href="job-detail.html?id=${job.id}" class="btn btn-outline-primary">
                                    <i class="bi bi-eye me-2"></i>Lihat Detail
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

async function searchJobs() {
    const search = document.getElementById('searchKeyword')?.value || '';
    const category = document.getElementById('searchCategory')?.value || '';
    const location = document.getElementById('searchLocation')?.value || '';

    const filters = {};
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (location) filters.location = location;

    const jobs = await jobsManager.getAllJobs(filters);
    displayJobs(jobs);
}

async function loadApplications() {
    const manager = window.applicationsManager || applicationsManager;
    const applications = manager ? await manager.getUserApplications() : [];
    displayApplications(applications);
}

function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    
    if (applications.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Belum ada lamaran</p></div>';
        return;
    }

    container.innerHTML = applications.map(app => {
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
                        <div class="col-md-6">
                            <h5 class="fw-bold mb-2">${app.jobs?.title || 'N/A'}</h5>
                            <p class="text-muted mb-1">
                                <i class="bi bi-building me-2"></i>${app.jobs?.company || 'N/A'}<br>
                                <i class="bi bi-geo-alt me-2"></i>${app.jobs?.location || 'N/A'}
                            </p>
                            <small class="text-muted">Dilamar: ${formatDate(app.created_at)}</small>
                        </div>
                        <div class="col-md-3 text-center">
                            <span class="status-badge ${statusClass}">${app.status}</span>
                        </div>
                        <div class="col-md-3 text-end">
                            <a href="job-detail.html?id=${app.job_id}" class="btn btn-outline-primary">
                                <i class="bi bi-eye me-2"></i>Lihat Lowongan
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadRecommendations() {
    // For now, show all active jobs as recommendations
    // In a real app, this would use ML or matching algorithm
    const jobs = await jobsManager.getAllJobs();
    displayRecommendations(jobs.slice(0, 10));
}

function displayRecommendations(jobs) {
    const container = document.getElementById('recommendationsList');
    
    if (jobs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="bi bi-inbox"></i><p>Tidak ada rekomendasi</p></div>';
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
                    </div>
                    <div class="col-md-4 text-end">
                        <div class="d-flex flex-column gap-2 align-items-end">
                            <a href="job-detail.html?id=${job.id}" class="btn btn-outline-primary">
                                <i class="bi bi-eye me-2"></i>Lihat Detail
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openApplyModal(jobId) {
    currentApplyJobId = jobId;
    const modal = new bootstrap.Modal(document.getElementById('applyModal'));
    document.getElementById('applyForm').reset();
    document.getElementById('applyJobId').value = jobId;
    modal.show();
}

async function submitApplication() {
    const jobId = document.getElementById('applyJobId').value;
    if (!jobId) {
        showAlert('Error: Job ID tidak ditemukan', 'danger');
        return;
    }

    const submitBtn = document.getElementById('submitApplicationBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengirim...';

    try {
        const manager = window.applicationsManager || applicationsManager;
        if (!manager) {
            showAlert('Error: applicationsManager tidak tersedia', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Get form values
        const coverLetterFile = document.getElementById('coverLetterFile').files[0] || null;
        const cvFile = document.getElementById('cvFile').files[0] || null;

        // Validate CV is required
        if (!cvFile) {
            showAlert('Mohon upload CV Anda (PDF, maksimal 5MB)', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Validate CV file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (cvFile.size > maxSize) {
            showAlert('Ukuran file CV terlalu besar. Maksimal 5MB', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Validate cover letter file if provided
        if (coverLetterFile) {
            if (coverLetterFile.size > maxSize) {
                showAlert('Ukuran file Surat Lamaran terlalu besar. Maksimal 5MB', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (coverLetterFile.type !== 'application/pdf') {
                showAlert('Format file Surat Lamaran harus PDF', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
        }

        const applicationData = {
            coverLetter: null,
            coverLetterFile: coverLetterFile,
            cvFile: cvFile
        };
        
        const result = await manager.applyForJob(jobId, applicationData);

        if (result.success) {
            showAlert('Lamaran berhasil dikirim!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('applyModal'));
            if (modal) modal.hide();
            
            // Reset form
            document.getElementById('applyForm').reset();
            
            loadOverview();
            loadJobs();
        } else {
            showAlert('Error: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        showAlert('Gagal mengirim lamaran: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

