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
    // Setup character counters on page load
    setupCharacterCounters();
}

async function saveProfile() {
    const submitBtn = document.querySelector('#editProfileModal button[onclick*="saveProfile"]');
    if (!submitBtn) {
        console.error('Save button not found');
        showAlert('Tombol simpan tidak ditemukan', 'danger');
        return;
    }
    
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    
    try {
        const supabaseClient = authManager.getSupabaseClient();
        if (!supabaseClient) throw new Error('Supabase client tidak tersedia');
        
        if (!authManager.currentUser || !authManager.currentUser.id) {
            throw new Error('User tidak terautentikasi');
        }
        
        const profileData = {
            full_name: document.getElementById('profileFullName').value.trim(),
            username: document.getElementById('profileUsername').value.trim(),
            phone: document.getElementById('profilePhone').value.trim() || null,
            address: document.getElementById('profileAddress').value.trim() || null,
            bio: document.getElementById('profileBio').value.trim() || null,
            linkedin_url: document.getElementById('profileLinkedIn').value.trim() || null,
            portfolio_url: document.getElementById('profilePortfolio').value.trim() || null,
            updated_at: new Date().toISOString()
        };
        
        // Update database and get updated data
        const { data: updatedData, error } = await supabaseClient
            .from('user_profiles')
            .update(profileData)
            .eq('id', authManager.currentUser.id)
            .select()
            .single();
        
        if (error) {
            console.error('Database update error:', error);
            throw error;
        }
        
        if (!updatedData) {
            throw new Error('Data tidak ter-update');
        }
        
        // Close modal immediately
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        if (modal) modal.hide();
        
        // Show success message
        showAlert('Profil berhasil diperbarui!', 'success');
        
        // Update UI directly with the returned data (no need to query again)
        // Update profile header immediately
        const headerNameEl = document.getElementById('profileHeaderName');
        if (headerNameEl) {
            headerNameEl.textContent = updatedData.full_name || updatedData.username || 'User';
        }
        
        const headerLocationEl = document.getElementById('profileHeaderLocation');
        if (headerLocationEl) {
            headerLocationEl.textContent = updatedData.address || 'Belum ditambahkan';
        }
        
        // Update profile avatar
        if (updatedData.full_name) {
            const initials = updatedData.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const profileImageEl = document.getElementById('profileHeaderImage');
            if (profileImageEl) {
                profileImageEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=1A3D64&color=fff&bold=true`;
            }
        }
        
        // Update form fields
        const profileFullNameEl = document.getElementById('profileFullName');
        if (profileFullNameEl) profileFullNameEl.value = updatedData.full_name || '';
        
        const profileUsernameEl = document.getElementById('profileUsername');
        if (profileUsernameEl) profileUsernameEl.value = updatedData.username || '';
        
        const profilePhoneEl = document.getElementById('profilePhone');
        if (profilePhoneEl) profilePhoneEl.value = updatedData.phone || '';
        
        const profileAddressEl = document.getElementById('profileAddress');
        if (profileAddressEl) profileAddressEl.value = updatedData.address || '';
        
        const profileBioEl = document.getElementById('profileBio');
        if (profileBioEl) profileBioEl.value = updatedData.bio || '';
        
        const profileLinkedInEl = document.getElementById('profileLinkedIn');
        if (profileLinkedInEl) profileLinkedInEl.value = updatedData.linkedin_url || '';
        
        const profilePortfolioEl = document.getElementById('profilePortfolio');
        if (profilePortfolioEl) profilePortfolioEl.value = updatedData.portfolio_url || '';
        
        // Update personal summary display
        const personalSummaryTextEl = document.getElementById('personalSummaryText');
        const personalSummaryContentEl = document.getElementById('personalSummaryContent');
        const addPersonalSummaryBtnEl = document.getElementById('addPersonalSummaryBtn');
        
        if (updatedData.bio) {
            if (personalSummaryTextEl) personalSummaryTextEl.textContent = updatedData.bio;
            if (personalSummaryContentEl) personalSummaryContentEl.style.display = 'block';
            if (addPersonalSummaryBtnEl) addPersonalSummaryBtnEl.style.display = 'none';
        } else {
            if (personalSummaryContentEl) personalSummaryContentEl.style.display = 'none';
            if (addPersonalSummaryBtnEl) addPersonalSummaryBtnEl.style.display = 'block';
        }
        
        // Update user name in header
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = updatedData.full_name || updatedData.username;
        }
        
        // Update profile strength
        updateProfileStrength(updatedData);
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Gagal memperbarui profil: ' + (error.message || 'Terjadi kesalahan'), 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function addPersonalSummary() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
    // Setup character counters and focus on bio field
    setTimeout(() => {
        setupCharacterCounters();
        document.getElementById('profileBio').focus();
    }, 100);
}

function editPersonalSummary() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
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
    
    // Setup character counters when modal opens
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
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
    
    // Setup character counters when modal opens
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
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
    
    // Setup character counters when modal opens
    setTimeout(() => {
        setupCharacterCounters();
    }, 100);
    
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
    // Prevent form submission for profileForm
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }
    
    // Also add click handler to save button as backup
    const saveProfileBtn = document.querySelector('#editProfileModal .btn-primary[onclick*="saveProfile"]');
    if (saveProfileBtn) {
        // Keep onclick but also add event listener as backup
        saveProfileBtn.addEventListener('click', (e) => {
            // Don't prevent default if onclick is working
            console.log('Save profile button clicked via addEventListener');
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
                                ${job.id ? `<a href="job-detail.html?id=${encodeURIComponent(job.id)}" class="btn btn-outline-primary" onclick="sessionStorage.setItem('lastViewedJobId', '${job.id}')">
                                    <i class="bi bi-eye me-2"></i>Lihat Detail
                                </a>` : '<span class="text-muted">ID tidak tersedia</span>'}
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

        // Check if can update/delete (can't if already accepted or rejected)
        const canUpdate = app.status !== 'Diterima' && app.status !== 'Ditolak';

        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-5">
                            <h5 class="fw-bold mb-2">${app.jobs?.title || 'N/A'}</h5>
                            <p class="text-muted mb-1">
                                <i class="bi bi-building me-2"></i>${app.jobs?.company || 'N/A'}<br>
                                <i class="bi bi-geo-alt me-2"></i>${app.jobs?.location || 'N/A'}
                            </p>
                            <small class="text-muted">Dilamar: ${formatDate(app.created_at)}</small>
                        </div>
                        <div class="col-md-2 text-center">
                            <span class="status-badge ${statusClass}">${app.status}</span>
                        </div>
                        <div class="col-md-5 text-end">
                            <div class="d-flex gap-2 justify-content-end flex-wrap">
                                ${app.job_id ? `<a href="job-detail.html?id=${encodeURIComponent(app.job_id)}" class="btn btn-outline-primary btn-sm" onclick="sessionStorage.setItem('lastViewedJobId', '${app.job_id}')">
                                    <i class="bi bi-eye me-1"></i>Lihat Lowongan
                                </a>` : ''}
                                ${canUpdate ? `
                                    <button class="btn btn-outline-warning btn-sm" onclick="openUpdateApplicationModal('${app.id}')" title="Update Berkas">
                                        <i class="bi bi-pencil me-1"></i>Update Berkas
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="withdrawApplication('${app.id}')" title="Mengundurkan Diri">
                                        <i class="bi bi-x-circle me-1"></i>Undur Diri
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== Update Application Functions ==========
async function openUpdateApplicationModal(applicationId) {
    try {
        const manager = window.applicationsManager || applicationsManager;
        if (!manager) {
            showAlert('Error: applicationsManager tidak tersedia', 'danger');
            return;
        }

        const application = await manager.getApplicationById(applicationId);
        if (!application) {
            showAlert('Lamaran tidak ditemukan', 'danger');
            return;
        }

        // Check if can update
        if (application.status === 'Diterima' || application.status === 'Ditolak') {
            showAlert('Tidak dapat mengupdate lamaran yang sudah diterima atau ditolak', 'warning');
            return;
        }

        // Set application ID
        document.getElementById('updateApplicationId').value = applicationId;
        
        // Show current documents info
        const currentDocsInfo = document.getElementById('currentDocumentsInfo');
        if (currentDocsInfo) {
            let infoHtml = '<small class="text-muted">Dokumen saat ini:</small><ul class="mb-0 mt-2">';
            if (application.cv_url) {
                infoHtml += `<li><a href="${application.cv_url}" target="_blank" class="text-decoration-none"><i class="bi bi-file-pdf me-1"></i>CV (PDF)</a></li>`;
            }
            if (application.cover_letter_url) {
                infoHtml += `<li><a href="${application.cover_letter_url}" target="_blank" class="text-decoration-none"><i class="bi bi-file-pdf me-1"></i>Surat Lamaran (PDF)</a></li>`;
            } else if (application.cover_letter) {
                infoHtml += `<li><i class="bi bi-file-text me-1"></i>Surat Lamaran (Teks)</li>`;
            }
            infoHtml += '</ul>';
            currentDocsInfo.innerHTML = infoHtml;
        }

        // Reset form
        document.getElementById('updateApplicationForm').reset();
        document.getElementById('updateApplicationId').value = applicationId;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('updateApplicationModal'));
        modal.show();
    } catch (error) {
        console.error('Error opening update modal:', error);
        showAlert('Gagal membuka form update: ' + error.message, 'danger');
    }
}

async function updateApplicationDocuments() {
    const applicationId = document.getElementById('updateApplicationId').value;
    if (!applicationId) {
        showAlert('Error: Application ID tidak ditemukan', 'danger');
        return;
    }

    const submitBtn = document.getElementById('updateApplicationBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';

    try {
        const manager = window.applicationsManager || applicationsManager;
        if (!manager) {
            showAlert('Error: applicationsManager tidak tersedia', 'danger');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Get form values
        const coverLetterFile = document.getElementById('updateCoverLetterFile').files[0] || null;
        const cvFile = document.getElementById('updateCvFile').files[0] || null;

        // At least one file must be provided
        if (!cvFile && !coverLetterFile) {
            showAlert('Mohon pilih minimal satu file untuk diupdate (CV atau Surat Lamaran)', 'warning');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        // Validate file sizes (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024;

        if (cvFile) {
            if (cvFile.size > maxSize) {
                showAlert('Ukuran file CV terlalu besar. Maksimal 5MB', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            if (cvFile.type !== 'application/pdf') {
                showAlert('Format file CV harus PDF', 'danger');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
        }

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
            cvFile: cvFile,
            coverLetterFile: coverLetterFile
        };
        
        const result = await manager.updateApplicationDocuments(applicationId, applicationData);

        if (result.success) {
            showAlert('Berkas lamaran berhasil diupdate!', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('updateApplicationModal'));
            if (modal) modal.hide();
            
            // Reset form
            document.getElementById('updateApplicationForm').reset();
            
            // Reload applications
            await loadApplications();
        } else {
            showAlert('Error: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error updating application:', error);
        showAlert('Gagal mengupdate berkas: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ========== Delete Application Functions ==========
async function withdrawApplication(applicationId) {
    if (!confirm('Apakah Anda yakin ingin mengundurkan diri dari lamaran ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }

    try {
        const manager = window.applicationsManager || applicationsManager;
        if (!manager) {
            showAlert('Error: applicationsManager tidak tersedia', 'danger');
            return;
        }

        const result = await manager.deleteApplication(applicationId);

        if (result.success) {
            showAlert('Anda telah mengundurkan diri dari lamaran ini', 'success');
            // Reload applications
            await loadApplications();
            // Reload overview
            await loadOverview();
        } else {
            showAlert('Error: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        showAlert('Gagal mengundurkan diri: ' + error.message, 'danger');
    }
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
                            ${job.id ? `<a href="job-detail.html?id=${encodeURIComponent(job.id)}" class="btn btn-outline-primary">
                                <i class="bi bi-eye me-2"></i>Lihat Detail
                            </a>` : '<span class="text-muted">ID tidak tersedia</span>'}
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

// ========== Character Counter Functions ==========
function setupCharacterCounters() {
    // Define all fields with their counter IDs and max lengths
    const fields = [
        { inputId: 'profileFullName', counterId: 'profileFullNameCounter', maxLength: 100 },
        { inputId: 'profileUsername', counterId: 'profileUsernameCounter', maxLength: 50 },
        { inputId: 'profilePhone', counterId: 'profilePhoneCounter', maxLength: 20 },
        { inputId: 'profileAddress', counterId: 'profileAddressCounter', maxLength: 500 },
        { inputId: 'profileBio', counterId: 'profileBioCounter', maxLength: 2000 },
        { inputId: 'profileLinkedIn', counterId: 'profileLinkedInCounter', maxLength: 200 },
        { inputId: 'profilePortfolio', counterId: 'profilePortfolioCounter', maxLength: 200 },
        { inputId: 'careerJobTitle', counterId: 'careerJobTitleCounter', maxLength: 100 },
        { inputId: 'careerCompany', counterId: 'careerCompanyCounter', maxLength: 100 },
        { inputId: 'careerLocation', counterId: 'careerLocationCounter', maxLength: 100 },
        { inputId: 'careerDescription', counterId: 'careerDescriptionCounter', maxLength: 2000 },
        { inputId: 'educationInstitution', counterId: 'educationInstitutionCounter', maxLength: 200 },
        { inputId: 'educationDegree', counterId: 'educationDegreeCounter', maxLength: 100 },
        { inputId: 'educationField', counterId: 'educationFieldCounter', maxLength: 100 },
        { inputId: 'educationDescription', counterId: 'educationDescriptionCounter', maxLength: 1000 },
        { inputId: 'licenseName', counterId: 'licenseNameCounter', maxLength: 200 },
        { inputId: 'licenseOrganization', counterId: 'licenseOrganizationCounter', maxLength: 200 },
        { inputId: 'licenseCredentialId', counterId: 'licenseCredentialIdCounter', maxLength: 100 },
        { inputId: 'licenseCredentialUrl', counterId: 'licenseCredentialUrlCounter', maxLength: 200 },
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

