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
        document.getElementById('profileFullName').value = profile.full_name || '';
        document.getElementById('profileUsername').value = profile.username || '';
        document.getElementById('profileEmail').value = authManager.currentUser?.email || '';
        document.getElementById('profilePhone').value = profile.phone || '';
        document.getElementById('profileCompany').value = profile.company_name || '';
        
        // Update profile image
        if (profile.full_name) {
            const initials = profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
            document.getElementById('profileImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=150&background=1A3D64&color=fff`;
        }
    }
}

function cancelProfileEdit() {
    loadProfile();
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
                };
                
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .update(profileData)
                    .eq('id', authManager.currentUser.id);
                
                if (error) throw error;
                
                showAlert('Profil berhasil diperbarui!', 'success');
                
                // Update user name in header
                document.getElementById('userName').textContent = profileData.full_name || profileData.username;
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

