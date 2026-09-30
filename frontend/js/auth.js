/* ============================================================
   RCP - Complete Authentication, Data Binding & Live API Engine
   Connects all features to Spring Boot (port 8080) & MySQL
   Includes Academic Team Collaboration, Invite Modal & Constraints
   ============================================================ */

const API_BASE = 'http://localhost:8080/api';

// Core HTTP Helper
async function apiCall(method, endpoint, body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + endpoint, opts);
    return await res.json();
  } catch (err) {
    console.warn('[RCP API] Error on ' + endpoint + ':', err.message);
    return { success: false, message: err.message, data: null };
  }
}

// Global Toast notification helper
function showToast(msg, isError = false, isWarning = false) {
  let toast = document.getElementById('rcpGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'rcpGlobalToast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 20px;border-radius:10px;font-size:0.875rem;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:opacity 0.3s;max-width:440px;line-height:1.4;';
    document.body.appendChild(toast);
  }
  toast.style.background = isError ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
  toast.style.color = '#ffffff';
  const icon = isError ? 'exclamation-circle' : isWarning ? 'exclamation-triangle-fill' : 'check-circle-fill';
  toast.innerHTML = `<i class="bi bi-${icon}" style="font-size:1.1rem;flex-shrink:0;"></i> <span>${msg}</span>`;
  toast.style.display = 'flex';
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.style.display = 'none', 300); }, 4000);
}

// Global DOM initialization
document.addEventListener('DOMContentLoaded', async () => {
  const path = window.location.pathname.replace(/\\/g, '/');
  const isPublicPage = path.endsWith('/index.html') || 
                       path.endsWith('/login.html') || 
                       path.endsWith('/register.html') ||
                       path.endsWith('/frontend/') ||
                       path.endsWith('/AOOP/') ||
                       path.endsWith('/rcp/') ||
                       path.endsWith('/rcp');

  const userJson = localStorage.getItem('rcp_user');
  if (!userJson && !isPublicPage) {
    return;
  }

  if (userJson) {
    try {
      let currentUser = JSON.parse(userJson);
      
      updateUserUI(currentUser);

      // Fetch fresh profile from DB
      if (currentUser.id) {
        const freshRes = await apiCall('GET', '/users/' + currentUser.id);
        if (freshRes && freshRes.success && freshRes.data) {
          currentUser = freshRes.data;
          localStorage.setItem('rcp_user', JSON.stringify(currentUser));
          updateUserUI(currentUser);
        }
      }

      // Feature specific initializations based on URL
      if (path.includes('profile.html')) {
        initProfilePage(currentUser);
      } else if (path.includes('dashboard.html')) {
        initDashboardPage(currentUser);
      } else if (path.includes('create-project.html')) {
        initCreateProjectPage(currentUser);
      } else if (path.includes('projects.html')) {
        initProjectsPage(currentUser);
      } else if (path.includes('project-details.html')) {
        initProjectDetailsPage(currentUser);
      } else if (path.includes('tasks.html')) {
        initTasksPage(currentUser);
      } else if (path.includes('researchers.html')) {
        initResearchersPage(currentUser);
      } else if (path.includes('discussions.html')) {
        initDiscussionsPage(currentUser);
      } else if (path.includes('files.html')) {
        initFilesPage(currentUser);
      } else if (path.includes('notifications.html')) {
        initNotificationsPage(currentUser);
      } else if (path.includes('admin/users.html')) {
        initAdminUsersPage(currentUser);
      }

    } catch (e) {
      console.error('[RCP] Session error:', e);
    }
  }
});

/* ============================================================
   UI SYNC — Header, Avatars, Roles
   ============================================================ */
function updateUserUI(user) {
  if (!user) return;

  const initials = user.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';
  
  document.querySelectorAll('.user-avatar-mini, .topbar .avatar, .avatar-sm, .profile-avatar-lg').forEach(av => {
    if (!av.classList.contains('logo-icon')) {
      av.textContent = initials;
    }
  });

  document.querySelectorAll('#sbUserName, .sidebar-footer .user-avatar-mini + div > div:first-child').forEach(el => {
    el.textContent = user.name || 'Researcher';
  });

  const roleTitle = user.role === 'SUPERVISOR' ? 'Faculty Supervisor' :
                    user.role === 'ADMIN' ? 'Platform Administrator' : 'Student Researcher';
  document.querySelectorAll('#sbUserRole, .sidebar-footer .user-avatar-mini + div > div:last-child').forEach(el => {
    el.textContent = roleTitle;
  });

  const firstName = user.name ? user.name.split(' ')[0] : 'Researcher';
  const greetingHeading = document.querySelector('.greeting-text h2, .greeting-text h1, #greetingHeading, .supervisor-greeting h2');
  if (greetingHeading) {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    greetingHeading.innerHTML = `${timeOfDay}, ${firstName} 👋`;
  }
}

/* ============================================================
   1. PROFILE PAGE
   ============================================================ */
function initProfilePage(user) {
  const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || 'Not specified'; };
  
  setIf('profName', user.name);
  setIf('profEmail', user.email);
  setIf('profDept', user.department);
  setIf('profUniv', user.university);
  setIf('profBio', user.bio || 'No bio provided yet.');
  
  const subLabel = document.getElementById('profDeptUnivSub');
  if (subLabel) subLabel.textContent = `${user.department || ''}${user.department && user.university ? ', ' : ''}${user.university || ''}`;

  const roleLabel = document.getElementById('profRoleBadge');
  if (roleLabel) roleLabel.textContent = user.role;

  const skillsContainer = document.getElementById('profSkillsContainer');
  if (skillsContainer) {
    if (user.skills && user.skills.trim()) {
      skillsContainer.innerHTML = user.skills.split(',').map(s => `<span class="chip">${s.trim()}</span>`).join(' ');
    } else {
      skillsContainer.innerHTML = '<span class="chip" style="opacity:0.6">No skills listed</span>';
    }
  }

  const interestsContainer = document.getElementById('profInterestsContainer');
  if (interestsContainer) {
    if (user.researchInterests && user.researchInterests.trim()) {
      interestsContainer.innerHTML = user.researchInterests.split(',').map(i => `<span class="chip chip-cyan">${i.trim()}</span>`).join(' ');
    } else {
      interestsContainer.innerHTML = '<span class="chip chip-cyan" style="opacity:0.6">No interests listed</span>';
    }
  }

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('editName', user.name);
  setVal('editEmail', user.email);
  setVal('editDept', user.department);
  setVal('editUniv', user.university);
  setVal('editBio', user.bio);
  setVal('editSkills', user.skills);
  setVal('editInterests', user.researchInterests);

  const editModal = document.getElementById('editProfileModal');
  if (editModal) {
    const form = editModal.querySelector('form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const updatedData = {
          name: document.getElementById('editName')?.value.trim() || user.name,
          department: document.getElementById('editDept')?.value.trim() || '',
          university: document.getElementById('editUniv')?.value.trim() || '',
          bio: document.getElementById('editBio')?.value.trim() || '',
          skills: document.getElementById('editSkills')?.value.trim() || '',
          researchInterests: document.getElementById('editInterests')?.value.trim() || ''
        };

        const res = await apiCall('PUT', '/users/' + user.id, updatedData);
        if (res.success && res.data) {
          localStorage.setItem('rcp_user', JSON.stringify(res.data));
          initProfilePage(res.data);
          updateUserUI(res.data);
          
          if (typeof hideModal === 'function') hideModal('editProfileModal');
          
          const alertBox = document.getElementById('profileSuccessAlert');
          if (alertBox) {
            alertBox.style.display = 'flex';
            setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
          }
          showToast('Profile updated and saved to database!');
        } else {
          showToast('Failed to save profile: ' + (res.message || 'Error'), true);
        }
      };
    }
  }
}

/* ============================================================
   2. DASHBOARD PAGE
   ============================================================ */
async function initDashboardPage(user) {
  // 1. Dynamic Greeting Name
  const greetingH2 = document.querySelector('.greeting-text h2, .supervisor-greeting h2');
  if (greetingH2 && user.name) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    greetingH2.innerHTML = `${timeGreeting}, ${user.name} 👋`;
  }

  // 2. Personal Real-Time Dashboard Stats
  const statCards = document.querySelectorAll('.stat-value');
  if (user.role === 'ADMIN') {
    const statsRes = await apiCall('GET', '/admin/stats');
    if (statsRes.success && statsRes.data) {
      const s = statsRes.data;
      if (statCards.length >= 4) {
        statCards[0].textContent = String(s.activeProjects || 0).padStart(2, '0');
        statCards[1].textContent = String(s.totalTasks || 0).padStart(2, '0');
        statCards[2].textContent = String(s.totalProjects || 0).padStart(2, '0');
        statCards[3].textContent = String(s.totalUsers || 0).padStart(2, '0');
      }
    }
  } else {
    const statsRes = await apiCall('GET', `/users/${user.id}/dashboard-stats`);
    if (statsRes.success && statsRes.data) {
      const s = statsRes.data;
      if (statCards.length >= 4) {
        statCards[0].textContent = String(s.activeProjects || 0).padStart(2, '0');
        statCards[1].textContent = String(s.pendingTasks || 0).padStart(2, '0');
        statCards[2].textContent = String(s.completedTasks || 0).padStart(2, '0');
        statCards[3].textContent = String(s.messagesCount || 0).padStart(2, '0');
      }
    }
  }

  // 3. Update sidebar badge with user's enrolled project count
  const myProjRes = await apiCall('GET', `/projects/user/${user.id}`);
  const userProjects = (myProjRes.success && myProjRes.data) ? myProjRes.data : [];
  const projBadge = document.getElementById('projNavBadge') || document.querySelector('.nav-item[href*="projects"] .nav-badge');
  if (projBadge) {
    projBadge.textContent = userProjects.length;
  }

  // 4. "Active Research Projects" Section — shows available public research projects to explore
  const projRes = await apiCall('GET', '/projects');
  if (projRes.success && projRes.data && projRes.data.length > 0) {
    const viewAllLink = document.querySelector('a[href*="projects.html"]');
    if (viewAllLink && viewAllLink.textContent.includes('View All')) {
      viewAllLink.href = 'projects.html?tab=all';
    }

    const projContainer = document.getElementById('activeProjectsContainer') || 
                          document.querySelector('.main-content .page-content > div:nth-child(3) > div:first-child > div:nth-child(2)');
    if (projContainer) {
      const activeProjects = projRes.data.filter(p => (p.status || '').toUpperCase() === 'ACTIVE');
      const displayProjects = activeProjects.length > 0 ? activeProjects.slice(0, 3) : projRes.data.slice(0, 3);
      projContainer.innerHTML = displayProjects.map(p => {
        const isEnrolled = userProjects.some(up => up.id === p.id);
        const enrolledBadge = isEnrolled 
          ? `<span class="badge-custom" style="background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;"><i class="bi bi-check-circle-fill"></i> Joined</span>` 
          : `<span class="badge-custom badge-active">${p.status || 'ACTIVE'}</span>`;

        return `
          <div class="rcp-card" style="padding:1.25rem;cursor:pointer;margin-bottom:0.75rem;" onclick="window.location.href='project-details.html?id=${p.id}'">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.5rem;">
              <div>
                <div style="font-size:0.72rem;color:var(--text-muted);font-weight:700;letter-spacing:0.06em;">${(p.researchArea || 'RESEARCH').toUpperCase()}</div>
                <div style="font-weight:700;font-size:1rem;margin-top:0.2rem;">${p.title}</div>
              </div>
              ${enrolledBadge}
            </div>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.6rem;">${p.description || 'Collaborative university research exploration.'}</p>
            <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-muted);">
              <span><i class="bi bi-calendar3"></i> Deadline: ${p.deadline || 'Flexible'}</span>
              <span style="color:var(--primary-light);font-weight:600;"><i class="bi bi-folder-check"></i> Project #${p.id}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

/* ============================================================
   3. CREATE PROJECT PAGE
   ============================================================ */
function initCreateProjectPage(user) {
  const form = document.getElementById('createProjectForm') || document.querySelector('form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('projTitle')?.value.trim() || form.querySelector('input[type="text"]')?.value.trim();
    const area = document.getElementById('projArea')?.value || form.querySelector('select')?.value || 'Artificial Intelligence & Machine Learning';
    const deadline = document.getElementById('projDeadline')?.value || form.querySelector('input[type="date"]')?.value || '';
    const desc = document.getElementById('projDesc')?.value.trim() || form.querySelector('textarea')?.value.trim() || '';

    if (!title) {
      alert('Please enter a project title.');
      return;
    }

    const payload = {
      title,
      researchArea: area,
      deadline,
      description: desc,
      ownerId: user.id,
      status: 'ACTIVE'
    };

    const submitBtn = document.getElementById('btnLaunchProject') || form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite;display:inline-block;"></i> Launching...';
    }

    const res = await apiCall('POST', '/projects', payload);
    if (res.success && res.data) {
      showToast('Project launched successfully and saved to database!');
      setTimeout(() => { window.location.href = 'projects.html'; }, 1000);
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-rocket-takeoff"></i> Launch Project';
      }
      showToast('Error creating project: ' + (res.message || 'Server error'), true);
    }
  };
}

/* ============================================================
   4. PROJECTS LIST PAGE — Live Search & Filter + My vs All Tabs
   ============================================================ */
let currentProjectTab = 'my';
let myProjectsCache = [];
let allProjectsCache = [];

async function initProjectsPage(user) {
  const grid = document.getElementById('projectsGrid') || document.querySelector('.grid-3, .projects-grid');
  if (!grid) return;

  // Read URL query parameter for tab: ?tab=all or ?tab=my
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab');
  currentProjectTab = (requestedTab === 'all') ? 'all' : 'my';

  // Fetch both caches in parallel
  const [allRes, myRes] = await Promise.all([
    apiCall('GET', '/projects'),
    apiCall('GET', '/projects/user/' + user.id)
  ]);

  if (allRes.success && allRes.data) allProjectsCache = allRes.data;
  if (myRes.success && myRes.data) myProjectsCache = myRes.data;

  // Update count badges
  const myBadge = document.getElementById('myProjCountBadge');
  if (myBadge) myBadge.textContent = myProjectsCache.length;
  const allBadge = document.getElementById('allProjCountBadge');
  if (allBadge) allBadge.textContent = allProjectsCache.length;
  const navBadge = document.getElementById('projNavBadge');
  if (navBadge) navBadge.textContent = myProjectsCache.length;

  window.switchProjectTab = (tab) => {
    currentProjectTab = tab;
    const tabBtnMy = document.getElementById('tabBtnMy');
    const tabBtnAll = document.getElementById('tabBtnAll');
    if (tab === 'my') {
      if (tabBtnMy) {
        tabBtnMy.className = 'btn-primary-custom';
        tabBtnMy.style.background = 'var(--primary)';
        tabBtnMy.style.color = '#fff';
      }
      if (tabBtnAll) {
        tabBtnAll.className = 'btn-outline-custom';
        tabBtnAll.style.background = 'transparent';
        tabBtnAll.style.color = 'var(--text-secondary)';
      }
    } else {
      if (tabBtnMy) {
        tabBtnMy.className = 'btn-outline-custom';
        tabBtnMy.style.background = 'transparent';
        tabBtnMy.style.color = 'var(--text-secondary)';
      }
      if (tabBtnAll) {
        tabBtnAll.className = 'btn-primary-custom';
        tabBtnAll.style.background = 'var(--primary)';
        tabBtnAll.style.color = '#fff';
      }
    }
    applyProjectFilters();
  };

  const searchInput = document.getElementById('searchProjectInput') || document.querySelector('.filter-search input');
  const areaSelect = document.getElementById('filterAreaSelect') || document.querySelectorAll('.filter-select')[0];
  const statusSelect = document.getElementById('filterStatusSelect') || document.querySelectorAll('.filter-select')[1];

  function applyProjectFilters() {
    const listToFilter = (currentProjectTab === 'my') ? myProjectsCache : allProjectsCache;
    const q = (searchInput?.value || '').toLowerCase().trim();
    const area = (areaSelect?.value || '').toLowerCase().trim();
    const status = (statusSelect?.value || '').toLowerCase().trim();

    const filtered = listToFilter.filter(p => {
      const matchQ = !q || (p.title || '').toLowerCase().includes(q) || 
                            (p.description || '').toLowerCase().includes(q) || 
                            (p.researchArea || '').toLowerCase().includes(q);
      const matchArea = !area || (p.researchArea || '').toLowerCase().includes(area);
      const matchStatus = !status || (p.status || '').toLowerCase() === status;
      return matchQ && matchArea && matchStatus;
    });

    renderFilteredProjects(filtered, grid, currentProjectTab, user);
  }

  if (searchInput) searchInput.addEventListener('input', applyProjectFilters);
  if (areaSelect) areaSelect.addEventListener('change', applyProjectFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyProjectFilters);

  window.switchProjectTab(currentProjectTab);
}

function renderFilteredProjects(projects, grid, activeTab = 'my', currentUser = {}) {
  if (!projects || projects.length === 0) {
    if (activeTab === 'my') {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3.5rem 1.5rem;background:var(--card-bg);border:1px dashed var(--border-color);border-radius:12px;">
          <i class="bi bi-folder-x" style="font-size:2.5rem;color:var(--text-muted);opacity:0.6;"></i>
          <h3 style="font-size:1.15rem;font-weight:700;margin-top:1rem;color:var(--text-primary);">You Haven't Enrolled in Any Projects Yet</h3>
          <p style="color:var(--text-muted);font-size:0.88rem;max-width:440px;margin:0.5rem auto 1.5rem auto;line-height:1.5;">
            You can browse all available university research projects and join a team, or launch a brand new research project.
          </p>
          <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
            <button onclick="switchProjectTab('all')" class="btn-primary-custom" style="font-size:0.85rem;padding:0.5rem 1.25rem;cursor:pointer;">
              <i class="bi bi-globe"></i> Browse All Projects
            </button>
            <a href="create-project.html" class="btn-outline-custom" style="font-size:0.85rem;padding:0.5rem 1.25rem;">
              <i class="bi bi-plus-lg"></i> Launch New Project
            </a>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);"><i class="bi bi-search" style="font-size:1.8rem;opacity:0.5;"></i><p style="margin-top:0.75rem;">No matching research projects found.</p></div>';
    }
    return;
  }

  grid.innerHTML = projects.map(p => {
    const isOwner = currentUser && (currentUser.id === p.ownerId);
    const isSupervisor = currentUser && (currentUser.id === p.supervisorId);
    const isEnrolled = myProjectsCache.some(mp => mp.id === p.id);

    let roleBadge = '';
    if (isOwner) {
      roleBadge = '<span class="badge-custom" style="background:rgba(99,102,241,0.2);color:#818cf8;font-weight:700;"><i class="bi bi-star-fill"></i> Lead Owner</span>';
    } else if (isSupervisor) {
      roleBadge = '<span class="badge-custom" style="background:rgba(245,158,11,0.2);color:#fbbf24;font-weight:700;"><i class="bi bi-award-fill"></i> Supervisor</span>';
    } else if (isEnrolled) {
      roleBadge = '<span class="badge-custom" style="background:rgba(16,185,129,0.2);color:#34d399;font-weight:700;"><i class="bi bi-check-circle-fill"></i> Enrolled</span>';
    }

    return `
      <div class="rcp-card project-card" style="padding:1.5rem;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.4rem;">
            <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">
              <span class="chip chip-cyan" style="font-size:0.72rem;">${p.researchArea || 'Research'}</span>
              ${roleBadge}
            </div>
            <span class="badge-custom badge-active">${p.status || 'ACTIVE'}</span>
          </div>
          <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;line-height:1.4;">${p.title}</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1rem;">
            ${(p.description || 'Collaborative research exploration.').substring(0, 120)}${(p.description || '').length > 120 ? '...' : ''}
          </p>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.78rem;color:var(--text-muted);border-top:1px solid var(--border-color);padding-top:0.75rem;margin-bottom:0.75rem;">
            <span><i class="bi bi-calendar3"></i> ${p.deadline || 'No deadline'}</span>
            <span style="color:var(--primary-light);font-weight:600;"><i class="bi bi-person-circle"></i> ID: #${p.id}</span>
          </div>
          <a href="project-details.html?id=${p.id}" class="btn-primary-custom w-full" style="justify-content:center;font-size:0.85rem;padding:0.5rem;">
            <i class="bi bi-eye"></i> View Project Details
          </a>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   5. PROJECT DETAILS PAGE — Roster, Capacity, Leave & Discussion
   ============================================================ */
window.switchProjectTab = function(tabName, clickedBtn) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });
  if (clickedBtn && clickedBtn.classList) {
    clickedBtn.classList.add('active');
  } else {
    const matched = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (matched) matched.classList.add('active');
  }
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  const target = document.getElementById('tab-' + tabName);
  if (target) {
    target.classList.add('active');
  }
};

async function initProjectDetailsPage(user) {
  const urlParams = new URLSearchParams(window.location.search);
  let projectId = urlParams.get('id');

  // If no projectId in URL query, find user's latest project automatically
  if (!projectId && user && user.id) {
    try {
      const myProjectsRes = await apiCall('GET', '/projects/my/' + user.id);
      if (myProjectsRes.success && myProjectsRes.data && myProjectsRes.data.length > 0) {
        projectId = String(myProjectsRes.data[0].id);
      }
    } catch (err) {
      console.warn('Could not auto-fetch my projects:', err);
    }
  }
  if (!projectId) {
    projectId = '1';
  }

  // 1. Load project basic info
  const pRes = await apiCall('GET', '/projects/' + projectId);
  if (pRes.success && pRes.data) {
    const p = pRes.data;
    const setIf = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setIf('pdTitle', p.title);
    setIf('pdArea', p.researchArea || 'Research');
    setIf('pdStatus', p.status || 'ACTIVE');
    setIf('pdDeadline', 'Deadline: ' + (p.deadline || 'Flexible'));
    setIf('pdDescription', p.description || 'No description provided.');
  }

  // 2. Load roster & capacity
  const mRes = await apiCall('GET', `/team/project/${projectId}/members`);
  if (mRes.success && mRes.data) {
    const data = mRes.data;
    const members = data.members || [];
    const count = data.memberCount || 0;
    const max = data.maxCapacity || 6;

    const capBadge = document.getElementById('pdCapacityBadge');
    if (capBadge) capBadge.innerHTML = `<i class="bi bi-people-fill" style="color:var(--primary-light);"></i> Team Capacity: <strong>${count} / ${max} Members</strong>`;
    
    const tabCount = document.getElementById('tabMemberCount');
    if (tabCount) tabCount.textContent = count;

    const ovCount = document.getElementById('pdOverviewMemberCount');
    if (ovCount) ovCount.textContent = count;

    // Render Overview mini roster chips
    const miniEl = document.getElementById('pdOverviewMembersMini');
    if (miniEl) {
      if (members.length === 0) {
        miniEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">No members in group yet.</span>';
      } else {
        miniEl.innerHTML = members.map(m => {
          const gRole = m.groupRole || (m.role === 'SUPERVISOR' ? 'Faculty Supervisor' : 'Researcher');
          const isSuper = gRole.toLowerCase().includes('supervisor');
          const isOwn = gRole.toLowerCase().includes('owner');
          const chipClass = isSuper ? 'chip-cyan' : isOwn ? 'chip-amber' : 'chip-purple';
          const initial = (m.name || 'U').trim().charAt(0).toUpperCase();
          return `
            <div class="member-mini-card">
              <div class="user-avatar-mini" style="width:36px;height:36px;font-size:0.85rem;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
                ${initial}
              </div>
              <div style="overflow:hidden;">
                <div style="font-size:0.88rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${m.name} ${m.id === user.id ? '<span style="color:var(--primary-light);font-size:0.72rem;font-weight:600;">(You)</span>' : ''}
                </div>
                <div style="margin-top:0.25rem;">
                  <span class="chip ${chipClass}" style="padding:0.15rem 0.5rem;font-size:0.7rem;">${gRole}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render full roster cards in Members tab
    const rosterEl = document.getElementById('pdMembersList');
    if (rosterEl) {
      if (members.length === 0) {
        rosterEl.innerHTML = '<div style="text-align:center;padding:2.5rem;color:var(--text-muted);">No members found in this research group.</div>';
      } else {
        rosterEl.innerHTML = members.map(m => {
          const gRole = m.groupRole || (m.role === 'SUPERVISOR' ? 'Faculty Supervisor' : 'Researcher');
          const isSuper = gRole.toLowerCase().includes('supervisor');
          const isOwn = gRole.toLowerCase().includes('owner');
          const chipClass = isSuper ? 'chip-cyan' : isOwn ? 'chip-amber' : 'chip-purple';
          const initial = (m.name || 'U').trim().charAt(0).toUpperCase();
          return `
            <div class="rcp-card" style="padding:1.1rem 1.35rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
              <div style="display:flex;align-items:center;gap:0.85rem;">
                <div class="user-avatar-mini" style="width:42px;height:42px;font-size:1rem;background:var(--primary);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;">
                  ${initial}
                </div>
                <div>
                  <div style="font-weight:700;font-size:0.95rem;display:flex;align-items:center;gap:0.5rem;">
                    ${m.name}
                    ${m.id === user.id ? '<span style="color:var(--primary-light);font-size:0.75rem;font-weight:600;">(You)</span>' : ''}
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.2rem;">
                    ${m.email || ''} · ${m.department || 'Academic'} (${m.university || 'University'})
                  </div>
                </div>
              </div>
              <div>
                <span class="chip ${chipClass}">${gRole}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Leave project button (for members who are not the owner)
    const leaveContainer = document.getElementById('pdLeaveActionContainer');
    const isOwner = pRes.data && pRes.data.ownerId === user.id;
    const isMember = members.some(m => m.id === user.id);

    if (leaveContainer) {
      if (isMember && !isOwner) {
        leaveContainer.innerHTML = `
          <button class="btn-ghost" onclick="leaveCurrentProject(${projectId})" style="color:var(--danger);border-color:var(--danger);font-size:0.85rem;padding:0.5rem 1rem;">
            <i class="bi bi-box-arrow-left"></i> Leave Project Group
          </button>
        `;
      } else {
        leaveContainer.innerHTML = '';
      }
    }
  }

  // 3. Load project discussions
  loadProjectDiscussions(projectId, user);

  // 4. Load project files
  loadProjectFiles(projectId, user);
}

async function loadProjectFiles(projectId, user) {
  const listEl = document.getElementById('pdFilesList');
  const countEl = document.getElementById('pdFilesCount');
  const tabBadge = document.getElementById('tabFileCount');
  if (!listEl) return;

  const res = await apiCall('GET', `/files/project/${projectId}?userId=${user.id}`);

  if (!res.success) {
    listEl.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--danger);">Access denied or error loading files: ${res.message || ''}</div>`;
    return;
  }

  const files = res.data || [];
  if (countEl) countEl.textContent = `${files.length} file${files.length !== 1 ? 's' : ''} uploaded`;
  if (tabBadge) tabBadge.textContent = files.length > 0 ? files.length : '';

  if (files.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-muted);">
        <i class="bi bi-folder2-open" style="font-size:2.5rem;opacity:0.4;display:block;margin-bottom:0.75rem;"></i>
        <div style="font-size:0.95rem;font-weight:600;">No files uploaded yet</div>
        <div style="font-size:0.82rem;margin-top:0.25rem;">Upload the first project file using the form above.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = files.map(f => {
    const sizeKB = f.fileSize ? (f.fileSize / 1024).toFixed(1) + ' KB' : '—';
    const sizeMB = f.fileSize && f.fileSize > 1024*1024 ? (f.fileSize / (1024*1024)).toFixed(2) + ' MB' : null;
    const displaySize = sizeMB || sizeKB;
    const uploadDate = f.uploadedAt ? new Date(f.uploadedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—';
    const ext = (f.originalFilename || '').split('.').pop().toLowerCase();
    const canDelete = f.uploaderId === user.id;

    let fileIcon = 'bi-file-earmark';
    if (['pdf'].includes(ext)) fileIcon = 'bi-file-earmark-pdf-fill';
    else if (['doc','docx'].includes(ext)) fileIcon = 'bi-file-earmark-word-fill';
    else if (['xls','xlsx','csv'].includes(ext)) fileIcon = 'bi-file-earmark-spreadsheet-fill';
    else if (['ppt','pptx'].includes(ext)) fileIcon = 'bi-file-earmark-slides-fill';
    else if (['png','jpg','jpeg','gif','svg'].includes(ext)) fileIcon = 'bi-file-earmark-image-fill';
    else if (['zip','rar','7z'].includes(ext)) fileIcon = 'bi-file-earmark-zip-fill';
    else if (['py','js','java','cpp','c','ts'].includes(ext)) fileIcon = 'bi-file-earmark-code-fill';
    else if (['txt','md'].includes(ext)) fileIcon = 'bi-file-earmark-text-fill';

    let iconColor = 'var(--text-muted)';
    if (fileIcon.includes('pdf')) iconColor = '#ef4444';
    else if (fileIcon.includes('word')) iconColor = '#3b82f6';
    else if (fileIcon.includes('spreadsheet')) iconColor = '#10b981';
    else if (fileIcon.includes('slides')) iconColor = '#f97316';
    else if (fileIcon.includes('image')) iconColor = '#8b5cf6';
    else if (fileIcon.includes('code')) iconColor = '#06b6d4';
    else if (fileIcon.includes('zip')) iconColor = '#f59e0b';

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;padding:1rem 1.25rem;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);" class="rcp-card">
        <div style="display:flex;align-items:center;gap:0.85rem;flex:1 1 250px;min-width:0;">
          <div style="width:42px;height:42px;border-radius:var(--radius-md);background:var(--bg-main);border:1px solid var(--border-color);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="bi ${fileIcon}" style="font-size:1.3rem;color:${iconColor};"></i>
          </div>
          <div style="min-width:0;overflow:hidden;">
            <div style="font-weight:700;font-size:0.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${f.originalFilename}">${f.originalFilename}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">
              ${displaySize} · Uploaded by <strong>${f.uploaderName || 'Unknown'}</strong> · ${uploadDate}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-shrink:0;">
          <a href="http://localhost:8080/api/files/download/${f.id}?userId=${user.id}" 
             download="${f.originalFilename}" 
             class="btn-primary-custom" 
             style="font-size:0.8rem;padding:0.4rem 0.85rem;display:inline-flex;align-items:center;gap:0.4rem;text-decoration:none;">
            <i class="bi bi-download"></i> Download
          </a>
          ${canDelete ? `
          <button class="btn-ghost" onclick="deleteProjectFile(${f.id}, ${projectId}, ${user.id})" 
                  style="font-size:0.8rem;padding:0.4rem 0.75rem;color:var(--danger);border-color:var(--danger);display:inline-flex;align-items:center;gap:0.3rem;"
                  title="Delete file">
            <i class="bi bi-trash3"></i>
          </button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.handleProjectFileUpload = async (e) => {
  e.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  let projectId = urlParams.get('id') || '1';
  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');
  const fileInput = document.getElementById('pdFileInput');
  const uploadBtn = document.getElementById('pdUploadBtn');
  const progressDiv = document.getElementById('pdUploadProgress');
  const progressBar = document.getElementById('pdProgressBar');

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return showToast('Please select a file to upload.', true);
  }

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  formData.append('uploaderId', user.id);

  // Show progress
  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Uploading...'; }
  if (progressDiv) progressDiv.style.display = 'block';
  if (progressBar) progressBar.style.width = '30%';

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8080/api/files/upload', true);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && progressBar) {
        const pct = Math.min(90, Math.round((evt.loaded / evt.total) * 100));
        progressBar.style.width = pct + '%';
      }
    };

    xhr.onload = () => {
      if (progressBar) progressBar.style.width = '100%';
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.success) {
          showToast('File uploaded successfully!');
          fileInput.value = '';
          const fileNameDisplay = document.getElementById('pdSelectedFileName');
          if (fileNameDisplay) fileNameDisplay.textContent = '';
          loadProjectFiles(projectId, user);
        } else {
          showToast('Upload failed: ' + (res.message || 'Error'), true);
        }
      } catch(err) {
        showToast('Upload error: ' + xhr.statusText, true);
      }
      if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload-fill"></i> Upload File'; }
      setTimeout(() => { if (progressDiv) progressDiv.style.display = 'none'; if (progressBar) progressBar.style.width = '0%'; }, 1500);
    };

    xhr.onerror = () => {
      showToast('Network error during upload.', true);
      if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload-fill"></i> Upload File'; }
      if (progressDiv) progressDiv.style.display = 'none';
    };

    xhr.send(formData);
  } catch(err) {
    showToast('Upload error: ' + err.message, true);
    if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.innerHTML = '<i class="bi bi-cloud-upload-fill"></i> Upload File'; }
    if (progressDiv) progressDiv.style.display = 'none';
  }
};

window.deleteProjectFile = async (fileId, projectId, userId) => {
  if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;

  const res = await apiCall('DELETE', `/files/${fileId}?userId=${userId}`);
  if (res.success) {
    showToast('File deleted successfully.');
    const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');
    loadProjectFiles(projectId, user);
  } else {
    showToast('Failed to delete file: ' + (res.message || 'Error'), true);
  }
};


async function loadProjectDiscussions(projectId, user) {
  const dRes = await apiCall('GET', `/discussions/project/${projectId}`);
  const listEl = document.getElementById('pdDiscussionsList');
  if (!listEl) return;

  if (dRes.success && dRes.data && dRes.data.length > 0) {
    listEl.innerHTML = dRes.data.map(d => `
      <div class="rcp-card" style="padding:1.25rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <h4 style="font-size:1rem;font-weight:700;margin-bottom:0.25rem;">${d.title}</h4>
          <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(d.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
        <p style="color:var(--text-secondary);font-size:0.88rem;margin:0.5rem 0;line-height:1.6;">${d.content}</p>
        <button class="btn-ghost" onclick="loadAndToggleComments(${d.id})" style="font-size:0.8rem;padding:0.25rem 0.6rem;">
          <i class="bi bi-chat-left-text"></i> Replies
        </button>
        <div id="comments-box-${d.id}" style="display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border-color);"></div>
      </div>
    `).join('');
  } else {
    listEl.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-muted);">No team discussions yet for this project. Start the first topic above!</div>';
  }
}

window.handleProjectDiscussionSubmit = async (e) => {
  e.preventDefault();
  const urlParams = new URLSearchParams(window.location.search);
  let projectId = urlParams.get('id') || '1';
  const title = document.getElementById('pdDiscTitle')?.value.trim();
  const content = document.getElementById('pdDiscContent')?.value.trim();
  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');

  if (!title || !content) return alert('Please enter both title and content.');

  const res = await apiCall('POST', '/discussions', {
    title,
    content,
    projectId: Number(projectId),
    authorId: user.id,
    authorName: user.name
  });

  if (res.success) {
    showToast('Project discussion topic posted!');
    document.getElementById('pdDiscTitle').value = '';
    document.getElementById('pdDiscContent').value = '';
    loadProjectDiscussions(projectId, user);
  }
};

window.leaveCurrentProject = async (projectId) => {
  if (!confirm('Are you sure you want to leave this research project group?')) return;
  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');

  const res = await apiCall('POST', '/team/leave', {
    projectId: Number(projectId),
    userId: user.id
  });

  if (res.success) {
    showToast('You have left the project group.');
    setTimeout(() => { window.location.href = 'projects.html'; }, 1000);
  } else {
    showToast('Error leaving project: ' + (res.message || 'Error'), true);
  }
};

/* ============================================================
   6. RESEARCHERS PAGE — Live User List & Project Selection Modal
   ============================================================ */
let allResearchersCache = [];

async function initResearchersPage(user) {
  const grid = document.getElementById('researchersGrid') || document.querySelector('.grid-3');
  if (!grid) return;

  const res = await apiCall('GET', '/users');
  if (res.success && res.data) {
    allResearchersCache = res.data.filter(u => u.id !== user.id);
    renderFilteredResearchers(allResearchersCache, grid);
  }

  const searchInput = document.getElementById('searchResearcherInput') || document.querySelector('.filter-search input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = allResearchersCache.filter(u => {
        return (u.name || '').toLowerCase().includes(q) ||
               (u.email || '').toLowerCase().includes(q) ||
               (u.department || '').toLowerCase().includes(q) ||
               (u.university || '').toLowerCase().includes(q) ||
               (u.skills || '').toLowerCase().includes(q) ||
               (u.researchInterests || '').toLowerCase().includes(q);
      });
      renderFilteredResearchers(filtered, grid);
    });
  }
}

function renderFilteredResearchers(researchers, grid) {
  if (!researchers || researchers.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);"><i class="bi bi-people" style="font-size:1.8rem;opacity:0.5;"></i><p style="margin-top:0.75rem;">No matching researchers found in database.</p></div>';
    return;
  }

  grid.innerHTML = researchers.map(u => {
    const initials = (u.name || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const skillsChips = (u.skills && u.skills.trim()) 
      ? u.skills.split(',').slice(0, 4).map(s => `<span class="chip">${s.trim()}</span>`).join(' ')
      : '<span class="chip" style="opacity:0.6;">Researcher</span>';

    const uRole = u.role === 'SUPERVISOR' ? 'Faculty Supervisor' : 'Student Researcher';

    return `
      <div class="rcp-card" style="padding:1.5rem;display:flex;flex-direction:column;justify-content:space-between;" id="researcher-card-${u.id}">
        <div>
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
            <div class="avatar avatar-lg" style="box-shadow:var(--shadow-sm);">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:1rem;">${u.name}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${uRole} · ${u.university || 'University'}</div>
            </div>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;">
            <i class="bi bi-geo-alt"></i> ${u.department || 'General Academic'}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.25rem;">
            ${skillsChips}
          </div>
        </div>
        <button id="invite-btn-${u.id}" class="btn-primary-custom w-full" style="justify-content:center;" onclick="openInviteModal(${u.id}, '${(u.name || '').replace(/'/g, "\\'")}', '${uRole}', '${(u.department || '').replace(/'/g, "\\'")}')">
          <i class="bi bi-person-plus"></i> Invite to Project
        </button>
      </div>
    `;
  }).join('');
}

window.loadInviteModalProjects = async () => {
  const select = document.getElementById('modalProjectSelect');
  if (!select) return;

  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');
  const res = await apiCall('GET', '/projects');
  if (res.success && res.data) {
    if (res.data.length === 0) {
      select.innerHTML = '<option value="">No projects found. Please create a project first!</option>';
      return;
    }

    select.innerHTML = '<option value="">-- Choose Research Project --</option>';
    for (const p of res.data) {
      const mRes = await apiCall('GET', `/team/project/${p.id}/members`);
      const count = mRes.success && mRes.data ? mRes.data.memberCount : 1;
      const isFull = count >= 6;
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.title} (${count}/6 members)${isFull ? ' - [FULL]' : ''}`;
      if (isFull) opt.disabled = true;
      select.appendChild(opt);
    }
  }
};

window.handleSendProjectInvite = async (e) => {
  e.preventDefault();
  const select = document.getElementById('modalProjectSelect');
  const projectId = select?.value;
  if (!projectId) {
    alert('Please select a project to invite this researcher to.');
    return;
  }

  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');
  const targetId = window.currentInviteTargetId;
  const btn = document.getElementById('btnConfirmInvite');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite;display:inline-block;"></i> Sending...';
  }

  const res = await apiCall('POST', '/team/invite', {
    projectId: Number(projectId),
    inviterId: user.id,
    targetUserId: Number(targetId)
  });

  if (res.success) {
    showToast('Project invitation sent! Delivered to recipient dashboard.');
    if (typeof closeInviteModal === 'function') closeInviteModal();
    const cardBtn = document.getElementById('invite-btn-' + targetId);
    if (cardBtn) {
      cardBtn.style.background = '#10b981';
      cardBtn.style.borderColor = '#10b981';
      cardBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Invited ✓';
    }
  } else {
    showToast(res.message || 'Invitation failed', false, true);
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send-fill"></i> Send Invitation';
  }
};

/* ============================================================
   7. NOTIFICATIONS PAGE — Actionable Invitations
   ============================================================ */
async function initNotificationsPage(user) {
  const container = document.querySelector('.main-content .page-content');
  if (!container) return;

  const res = await apiCall('GET', '/notifications/user/' + user.id);
  const notifs = res.success && res.data ? res.data : [];

  if (notifs.length > 0) {
    const listHtml = notifs.map(n => {
      const isInvite = n.type === 'PROJECT_INVITE';
      const isPending = (n.status || 'PENDING') === 'PENDING';
      const isAccepted = n.status === 'ACCEPTED';
      const isRejected = n.status === 'REJECTED';

      let actionHtml = '';
      if (isInvite) {
        if (isPending) {
          actionHtml = `
            <div style="display:flex;gap:0.6rem;margin-top:0.75rem;">
              <button class="btn-primary-custom" onclick="acceptProjectInvite(${n.id})" style="font-size:0.8rem;padding:0.35rem 0.85rem;background:#10b981;border-color:#10b981;">
                <i class="bi bi-check-lg"></i> Approve / Accept
              </button>
              <button class="btn-ghost" onclick="rejectProjectInvite(${n.id})" style="font-size:0.8rem;padding:0.35rem 0.85rem;color:var(--danger);border-color:var(--danger);">
                <i class="bi bi-x-lg"></i> Reject / Decline
              </button>
            </div>
          `;
        } else if (isAccepted) {
          actionHtml = `
            <div style="margin-top:0.5rem;display:flex;align-items:center;gap:0.5rem;">
              <span class="badge-custom badge-active"><i class="bi bi-check2-circle"></i> Accepted (Group Member)</span>
              ${n.projectId ? `<a href="project-details.html?id=${n.projectId}" style="font-size:0.8rem;color:var(--primary-light);font-weight:600;">Open Project →</a>` : ''}
            </div>
          `;
        } else if (isRejected) {
          actionHtml = `
            <div style="margin-top:0.5rem;">
              <span class="chip" style="opacity:0.6;"><i class="bi bi-x-circle"></i> Declined</span>
            </div>
          `;
        }
      } else {
        if (!n.isRead) {
          actionHtml = `<div style="margin-top:0.5rem;"><button class="btn-ghost" onclick="markNotificationRead(${n.id})" style="font-size:0.75rem;padding:0.25rem 0.6rem;">Mark Read</button></div>`;
        }
      }

      return `
        <div class="rcp-card" style="padding:1.25rem;margin-bottom:0.75rem;${!n.isRead ? 'border-left:4px solid var(--primary-light);' : 'opacity:0.85;'}">
          <div style="display:flex;align-items:flex-start;gap:1rem;">
            <i class="bi ${isInvite ? 'bi-envelope-paper-heart-fill' : 'bi-bell-fill'}" style="color:var(--primary-light);font-size:1.35rem;margin-top:2px;"></i>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:700;font-size:0.95rem;">${n.title || 'System Notification'}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);">${new Date(n.createdAt || Date.now()).toLocaleDateString()}</div>
              </div>
              <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:0.25rem;line-height:1.5;">${n.message || ''}</div>
              ${actionHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = '<h2 style="font-size:1.4rem;font-weight:800;margin-bottom:1.25rem;">My Notifications</h2>' + listHtml;
  } else {
    container.innerHTML = '<h2 style="font-size:1.4rem;font-weight:800;margin-bottom:1.25rem;">My Notifications</h2><div class="rcp-card" style="text-align:center;padding:3rem;color:var(--text-muted);"><i class="bi bi-bell-slash" style="font-size:2rem;opacity:0.5;"></i><p style="margin-top:0.75rem;">No notifications yet.</p></div>';
  }

  window.markNotificationRead = async (id) => {
    await apiCall('PUT', `/notifications/${id}/read`);
    initNotificationsPage(user);
  };

  window.acceptProjectInvite = async (id) => {
    const res = await apiCall('POST', `/team/invitations/${id}/accept`);
    if (res.success) {
      showToast('🎉 You have joined the research group!');
      initNotificationsPage(user);
    } else {
      showToast('⚠️ ' + (res.message || 'Cannot join group'), false, true);
      initNotificationsPage(user);
    }
  };

  window.rejectProjectInvite = async (id) => {
    const res = await apiCall('POST', `/team/invitations/${id}/reject`);
    if (res.success) {
      showToast('Invitation declined.');
      initNotificationsPage(user);
    }
  };
}

/* ============================================================
   8. TASKS KANBAN PAGE — Project Scoped, Role Permissions & Drag & Drop
   ============================================================ */

window.showModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
};

window.hideModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
};

window.openCreateTaskModal = async function() {
  window.showModal('createTaskModal');
  const modalProjSelect = document.getElementById('taskProjectSelect');
  if (modalProjSelect) {
    if (modalProjSelect.options.length <= 1 && currentTasksUser) {
      const pRes = await apiCall('GET', '/projects/my/' + currentTasksUser.id);
      let projects = (pRes.success && pRes.data) ? pRes.data : [];
      if (projects.length === 0) {
        const allP = await apiCall('GET', '/projects');
        if (allP.success && allP.data) projects = allP.data;
      }
      modalProjSelect.innerHTML = '<option value="">Select Research Project...</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.title)} (#${p.id})</option>`).join('');
      if (projects.length > 0) {
        modalProjSelect.value = projects[0].id;
      }
    }
    if (modalProjSelect.value) {
      await window.onTaskProjectChange(modalProjSelect.value);
    }
  }
};

let userProjectsCache = [];
let allUserTasksCache = [];
let currentTasksUser = null;

async function initTasksPage(user) {
  currentTasksUser = user;

  // 1. Fetch user projects to populate project select in modal and top filter
  try {
    const pRes = await apiCall('GET', '/projects/my/' + user.id);
    let projects = (pRes.success && pRes.data) ? pRes.data : [];
    
    // If user has no owned projects, also fetch all projects
    if (projects.length === 0) {
      const allP = await apiCall('GET', '/projects');
      if (allP.success && allP.data) projects = allP.data;
    }
    userProjectsCache = projects;

    // Populate project select in modal
    const modalProjSelect = document.getElementById('taskProjectSelect');
    if (modalProjSelect) {
      modalProjSelect.innerHTML = '<option value="">Select Research Project...</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.title)} (#${p.id})</option>`).join('');
      
      // If projects exist, auto-select first project and load assignees
      if (projects.length > 0) {
        modalProjSelect.value = projects[0].id;
        window.onTaskProjectChange(projects[0].id);
      }
    }

    // Populate top filter dropdown
    const filterProj = document.getElementById('filterProjectDropdown');
    if (filterProj) {
      filterProj.innerHTML = '<option value="ALL">All My Projects</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('');
    }
  } catch (err) {
    console.warn('Error loading projects for tasks:', err);
  }

  // 2. Fetch tasks for user's projects and assigned tasks
  await loadAndRenderTasks();
}

async function loadAndRenderTasks() {
  if (!currentTasksUser) return;
  try {
    const res = await apiCall('GET', '/tasks/my/' + currentTasksUser.id);
    if (res.success && res.data) {
      allUserTasksCache = res.data;
      filterKanbanBoard();
    }
  } catch (err) {
    console.error('Error fetching tasks:', err);
  }
}

window.onTaskProjectChange = async function(projectId) {
  const assigneeSelect = document.getElementById('taskAssigneeSelect');
  if (!assigneeSelect) return;

  if (!projectId) {
    assigneeSelect.innerHTML = '<option value="">Select Project First...</option>';
    return;
  }

  assigneeSelect.innerHTML = '<option value="">Loading members...</option>';

  try {
    const mRes = await apiCall('GET', `/team/project/${projectId}/members`);
    if (mRes.success && mRes.data && mRes.data.members) {
      const members = mRes.data.members;
      assigneeSelect.innerHTML = members.map(m => {
        const isMe = currentTasksUser && m.id === currentTasksUser.id;
        const gRole = m.groupRole || m.role || 'Member';
        return `<option value="${m.id}" ${isMe ? 'selected' : ''}>${escapeHtml(m.name)} (${gRole}) ${isMe ? '— You' : ''}</option>`;
      }).join('');
    } else {
      if (currentTasksUser) {
        assigneeSelect.innerHTML = `<option value="${currentTasksUser.id}">${escapeHtml(currentTasksUser.name)} (You)</option>`;
      }
    }
  } catch (err) {
    console.error('Error loading project members:', err);
    if (currentTasksUser) {
      assigneeSelect.innerHTML = `<option value="${currentTasksUser.id}">${escapeHtml(currentTasksUser.name)} (You)</option>`;
    }
  }
};

window.handleCreateTaskSubmit = async function(e) {
  e.preventDefault();
  const projSelect = document.getElementById('taskProjectSelect');
  const titleInput = document.getElementById('taskTitleInput');
  const descInput = document.getElementById('taskDescInput');
  const assigneeSelect = document.getElementById('taskAssigneeSelect');
  const prioritySelect = document.getElementById('taskPrioritySelect');
  const deadlineInput = document.getElementById('taskDeadlineInput');
  const submitBtn = document.getElementById('createTaskSubmitBtn');

  const projectId = projSelect ? Number(projSelect.value) : null;
  const title = titleInput ? titleInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';
  const assignedUserId = assigneeSelect && assigneeSelect.value ? Number(assigneeSelect.value) : null;
  const priority = prioritySelect ? prioritySelect.value : 'MEDIUM';
  const deadline = deadlineInput ? deadlineInput.value : '';

  if (!projectId) return alert('Please select a project for this task.');
  if (!title) return alert('Please enter a task title.');
  if (!assignedUserId) return alert('Please assign this task to a project member.');

  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Creating...'; }

  const payload = {
    projectId,
    title,
    description,
    assignedUserId,
    priority,
    deadline,
    status: 'TODO'
  };

  const res = await apiCall('POST', '/tasks', payload);
  if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Create Task'; }

  if (res.success) {
    showToast(`Task "${title}" created and added to TO DO!`);
    window.hideModal('createTaskModal');
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (deadlineInput) deadlineInput.value = '';
    await loadAndRenderTasks();
  } else {
    showToast('Failed to create task: ' + (res.message || 'Error'), true);
  }
};

window.filterKanbanBoard = function() {
  const projFilter = document.getElementById('filterProjectDropdown')?.value || 'ALL';
  const assigneeFilter = document.getElementById('filterAssigneeDropdown')?.value || 'ALL';
  const searchFilter = (document.getElementById('filterSearchInput')?.value || '').toLowerCase().trim();

  const filtered = allUserTasksCache.filter(t => {
    // Project filter
    if (projFilter !== 'ALL' && String(t.projectId) !== String(projFilter)) {
      return false;
    }
    // Assignee filter
    if (assigneeFilter === 'ME' && currentTasksUser && t.assignedUserId !== currentTasksUser.id) {
      return false;
    }
    // Search query
    if (searchFilter) {
      const matchTitle = (t.title || '').toLowerCase().includes(searchFilter);
      const matchDesc = (t.description || '').toLowerCase().includes(searchFilter);
      const matchProj = (t.projectName || '').toLowerCase().includes(searchFilter);
      const matchUser = (t.assignedUserName || '').toLowerCase().includes(searchFilter);
      if (!matchTitle && !matchDesc && !matchProj && !matchUser) return false;
    }
    return true;
  });

  renderKanbanColumns(filtered);
};

function normalizeTaskStatus(status) {
  if (!status) return 'TODO';
  const s = String(status).trim().toUpperCase().replace(/[\s\-]/g, '_');
  if (s === 'IN_PROGRESS' || s === 'INPROGRESS') return 'IN_PROGRESS';
  if (s === 'SUBMITTED' || s === 'REVIEW' || s === 'SUBMITTED_FOR_REVIEW') return 'SUBMITTED_FOR_REVIEW';
  if (s === 'COMPLETED' || s === 'DONE') return 'COMPLETED';
  return 'TODO';
}

function renderKanbanColumns(tasks) {
  const cols = {
    'TODO': document.getElementById('col-TODO'),
    'IN_PROGRESS': document.getElementById('col-IN_PROGRESS'),
    'SUBMITTED_FOR_REVIEW': document.getElementById('col-SUBMITTED_FOR_REVIEW'),
    'COMPLETED': document.getElementById('col-COMPLETED')
  };

  const counts = {
    'TODO': 0,
    'IN_PROGRESS': 0,
    'SUBMITTED_FOR_REVIEW': 0,
    'COMPLETED': 0
  };

  // Clear all columns completely
  Object.values(cols).forEach(col => { if (col) col.innerHTML = ''; });

  // Append every matching task to its corresponding column
  tasks.forEach(t => {
    const status = normalizeTaskStatus(t.status);
    counts[status] = (counts[status] || 0) + 1;

    const card = createKanbanCardElement(t);
    if (cols[status]) {
      cols[status].appendChild(card);
    }
  });

  // Display empty state placeholder only if a column actually has 0 task cards
  Object.entries(cols).forEach(([st, col]) => {
    if (col && col.querySelectorAll('.kanban-card').length === 0) {
      col.innerHTML = `
        <div class="empty-col-placeholder" style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:0.85rem;border:1px dashed var(--border-color);border-radius:var(--radius-md);margin:0.25rem 0;">
          No tasks in this column
        </div>
      `;
    }
    const badge = document.getElementById('badge-count-' + st);
    if (badge) badge.textContent = counts[st] || 0;
  });
}

function createKanbanCardElement(t) {
  const card = document.createElement('div');
  card.className = 'rcp-card kanban-card';
  card.id = 'task-' + t.id;
  card.dataset.taskId = t.id;
  card.dataset.status = normalizeTaskStatus(t.status);
  card.style.padding = '1.1rem';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '0.5rem';

  const priority = (t.priority || 'MEDIUM').toUpperCase();
  const dotColor = priority === 'HIGH' ? '#ef4444' : priority === 'LOW' ? '#10b981' : '#f59e0b';
  const status = normalizeTaskStatus(t.status);
  const role = (currentTasksUser && currentTasksUser.role || '').toUpperCase();

  // ===== PERMISSION MATRIX =====
  const isSupervisor = role === 'SUPERVISOR';
  const isAdmin = role === 'ADMIN';
  // The researcher specifically assigned to this task
  const isAssignee = currentTasksUser && Number(t.assignedUserId) === Number(currentTasksUser.id);
  // Can move (drag-drop + action buttons): only assignee OR supervisor/admin
  const canMove = isAssignee || isSupervisor || isAdmin;
  // Can approve COMPLETED: only supervisor or admin
  const canComplete = isSupervisor || isAdmin;
  // ==============================

  // Draggable attribute based on permission
  card.setAttribute('draggable', canMove ? 'true' : 'false');
  card.style.cursor = canMove ? 'grab' : 'default';
  if (!canMove) card.style.opacity = '0.88'; // visually dim read-only cards

  // "Watching" badge for non-assignee project members
  const viewOnlyBadge = !canMove ? `
    <span style="font-size:0.68rem;background:rgba(99,102,241,0.1);color:var(--primary-light);border:1px solid rgba(99,102,241,0.22);padding:0.1rem 0.5rem;border-radius:999px;white-space:nowrap;">
      <i class="bi bi-eye-fill"></i> Watching
    </span>
  ` : '';

  // Action buttons based on current status + viewer's role
  let actionButtonsHtml = '';

  if (status === 'TODO') {
    if (canMove) {
      actionButtonsHtml = `
        <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'IN_PROGRESS', '${escapeHtml(t.title)}')" style="font-size:0.75rem;padding:0.25rem 0.65rem;color:#3b82f6;border-color:#3b82f6;">
          <i class="bi bi-play-fill"></i> Start Work
        </button>`;
    } else {
      actionButtonsHtml = `<span style="font-size:0.72rem;color:var(--text-muted);"><i class="bi bi-hourglass"></i> Waiting to start</span>`;
    }

  } else if (status === 'IN_PROGRESS') {
    if (isAssignee) {
      // Researcher: can go back to TODO or submit for review; CANNOT complete directly
      actionButtonsHtml = `
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'TODO', '${escapeHtml(t.title)}')" style="font-size:0.72rem;padding:0.25rem 0.5rem;color:var(--text-muted);border-color:var(--border-color);">
            <i class="bi bi-arrow-left"></i> To Do
          </button>
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'SUBMITTED_FOR_REVIEW', '${escapeHtml(t.title)}')" style="font-size:0.75rem;padding:0.25rem 0.65rem;color:#f59e0b;border-color:#f59e0b;">
            <i class="bi bi-send-check"></i> Submit for Review
          </button>
        </div>`;
    } else if (canComplete) {
      // Supervisor/Admin: full control including direct complete
      actionButtonsHtml = `
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'SUBMITTED_FOR_REVIEW', '${escapeHtml(t.title)}')" style="font-size:0.72rem;padding:0.25rem 0.5rem;color:#f59e0b;border-color:#f59e0b;">
            <i class="bi bi-send-check"></i> To Review
          </button>
          <button type="button" class="btn-primary-custom" onclick="window.moveTaskStatus(${t.id}, 'COMPLETED', '${escapeHtml(t.title)}')" style="font-size:0.72rem;padding:0.25rem 0.55rem;background:#10b981;border-color:#10b981;">
            <i class="bi bi-check-lg"></i> Complete
          </button>
        </div>`;
    } else {
      actionButtonsHtml = `<span style="font-size:0.72rem;color:#3b82f6;font-weight:600;"><i class="bi bi-arrow-repeat"></i> Work in progress...</span>`;
    }

  } else if (status === 'SUBMITTED_FOR_REVIEW') {
    if (canComplete) {
      // Supervisor/Admin: approve to COMPLETED or request changes
      actionButtonsHtml = `
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'IN_PROGRESS', '${escapeHtml(t.title)}')" style="font-size:0.72rem;padding:0.25rem 0.5rem;color:var(--text-muted);border-color:var(--border-color);">
            <i class="bi bi-arrow-counterclockwise"></i> Request Changes
          </button>
          <button type="button" class="btn-primary-custom" onclick="window.moveTaskStatus(${t.id}, 'COMPLETED', '${escapeHtml(t.title)}')" style="font-size:0.75rem;padding:0.25rem 0.65rem;background:#10b981;border-color:#10b981;">
            <i class="bi bi-check-lg"></i> Approve &amp; Complete
          </button>
        </div>`;
    } else if (isAssignee) {
      // Assigned researcher: see pending status, can retract
      actionButtonsHtml = `
        <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;">
          <span style="font-size:0.72rem;color:#f59e0b;font-weight:600;"><i class="bi bi-clock-history"></i> Awaiting Supervisor Approval</span>
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'IN_PROGRESS', '${escapeHtml(t.title)}')" style="font-size:0.68rem;padding:0.15rem 0.45rem;color:var(--text-muted);">
            <i class="bi bi-arrow-counterclockwise"></i> Retract
          </button>
        </div>`;
    } else {
      // Other members: read-only
      actionButtonsHtml = `<span style="font-size:0.72rem;color:#f59e0b;font-weight:600;"><i class="bi bi-clock-history"></i> Under Supervisor Review</span>`;
    }

  } else if (status === 'COMPLETED') {
    // All members see completion — supervisor approved it
    actionButtonsHtml = `
      <div style="display:flex;align-items:center;gap:0.5rem;">
        <span style="font-size:0.75rem;color:#10b981;font-weight:700;"><i class="bi bi-check-circle-fill"></i> Approved &amp; Completed</span>
        ${canComplete ? `
          <button type="button" class="btn-ghost" onclick="window.moveTaskStatus(${t.id}, 'IN_PROGRESS', '${escapeHtml(t.title)}')" style="font-size:0.68rem;padding:0.15rem 0.45rem;color:var(--text-muted);">Re-open</button>
        ` : ''}
      </div>`;
  }

  // Styling: highlight name when task is assigned to current user
  const assigneeBadgeStyle = isAssignee
    ? 'color:var(--primary-light);font-weight:700;'
    : 'color:var(--text-muted);';

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
      <span class="chip chip-cyan" style="font-size:0.68rem;padding:0.15rem 0.45rem;max-width:155px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(t.projectName || 'General')}">
        <i class="bi bi-folder2"></i> ${escapeHtml(t.projectName || 'General')}
      </span>
      <span style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.72rem;color:var(--text-muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};display:inline-block;"></span>${priority}
      </span>
    </div>

    <div style="font-weight:700;font-size:0.95rem;line-height:1.35;margin-top:0.1rem;" class="task-title">
      ${escapeHtml(t.title)}
    </div>

    ${t.description ? `
      <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.45;">
        ${escapeHtml(t.description.length > 90 ? t.description.substring(0, 87) + '...' : t.description)}
      </div>
    ` : ''}

    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;border-top:1px solid var(--border-color);padding-top:0.5rem;margin-top:0.25rem;">
      <div style="display:flex;align-items:center;gap:0.35rem;${assigneeBadgeStyle}">
        <i class="bi bi-person-circle" style="color:var(--primary-light);"></i>
        <span style="max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(t.assignedUserName || 'Unassigned')}">
          ${escapeHtml(t.assignedUserName || 'Unassigned')}${isAssignee ? ' (You)' : ''}
        </span>
      </div>
      <div style="color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${t.deadline || 'Flexible'}</div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.25rem;gap:0.5rem;">
      <div style="flex:1;">${actionButtonsHtml}</div>
      <div style="display:flex;align-items:center;gap:0.35rem;flex-shrink:0;">
        ${viewOnlyBadge}
        ${canMove ? `
          <button type="button" class="btn-ghost" onclick="window.deleteTaskItem(${t.id}, '${escapeHtml(t.title)}')" style="color:var(--danger);padding:0.2rem 0.4rem;font-size:0.8rem;" title="Delete Task">
            <i class="bi bi-trash3"></i>
          </button>
        ` : ''}
      </div>
    </div>
  `;

  // Drag handlers — ONLY enabled when user has move permission
  if (canMove) {
    card.addEventListener('dragstart', (e) => {
      window.currentDraggedTaskId = t.id;
      window.currentDraggedTaskCard = card;
      window.draggedTaskCard = card;
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.setData('text/task-id', String(t.id));
        e.dataTransfer.effectAllowed = 'move';
      }
      card.classList.add('dragging');
      card.style.opacity = '0.45';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      card.style.opacity = '1';
      setTimeout(() => {
        window.currentDraggedTaskId = null;
        window.currentDraggedTaskCard = null;
        window.draggedTaskCard = null;
      }, 350);
    });
  }

  return card;
}

window.moveTaskStatus = async function(taskId, newStatus, taskTitle) {
  const normStatus = normalizeTaskStatus(newStatus);
  const role = (currentTasksUser && currentTasksUser.role || '').toUpperCase();
  const isStudent = role === 'STUDENT';
  
  let finalStatus = normStatus;
  if (normStatus === 'COMPLETED' && isStudent) {
    showToast('⚠️ Only Faculty Supervisors or Admins can approve tasks as COMPLETED. Moving to SUBMITTED FOR REVIEW instead.', false, true);
    finalStatus = 'SUBMITTED_FOR_REVIEW';
  }

  console.log(`[Tasks DB] Updating task #${taskId} to status ${finalStatus}...`);
  const res = await apiCall('PUT', `/tasks/${taskId}/status?status=${finalStatus}`, { status: finalStatus });
  console.log(`[Tasks DB] Server response:`, res);

  if (res.success) {
    showToast(`Task "${taskTitle || 'Task'}" moved to ${finalStatus.replace(/_/g, ' ')}!`);
    await loadAndRenderTasks();
  } else {
    showToast('Failed to update task status: ' + (res.message || 'Error'), true);
    await loadAndRenderTasks();
  }
};

window.moveTaskStatusDirect = async function(taskId, newStatus, taskTitle) {
  await window.moveTaskStatus(taskId, newStatus, taskTitle);
};

window.deleteTaskItem = async function(taskId, taskTitle) {
  if (!confirm(`Are you sure you want to delete task "${taskTitle || ''}"?`)) return;
  const res = await apiCall('DELETE', `/tasks/${taskId}`);
  if (res.success) {
    showToast('Task deleted.');
    await loadAndRenderTasks();
  } else {
    showToast('Failed to delete task: ' + (res.message || 'Error'), true);
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
/* ============================================================
   9. DISCUSSIONS & REPLIES — Live Search
   ============================================================ */
let allDiscussionsCache = [];

async function initDiscussionsPage(user) {
  const container = document.getElementById('discussionStream') || document.querySelector('.main-content .page-content > div:last-child');
  if (!container) return;

  const res = await apiCall('GET', '/discussions');
  if (res.success && res.data) {
    allDiscussionsCache = res.data;
    renderFilteredDiscussions(allDiscussionsCache, container);
  }

  const searchInput = document.getElementById('searchDiscInput') || document.querySelector('.filter-search input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = allDiscussionsCache.filter(d => {
        return (d.title || '').toLowerCase().includes(q) ||
               (d.content || '').toLowerCase().includes(q) ||
               (d.authorName || '').toLowerCase().includes(q);
      });
      renderFilteredDiscussions(filtered, container);
    });
  }

  const startModal = document.getElementById('startDiscussionModal');
  if (startModal) {
    const form = startModal.querySelector('form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const titleInput = form.querySelector('input[type="text"]');
        const contentText = form.querySelector('textarea');
        const areaSelect = form.querySelector('select');

        const title = titleInput?.value.trim();
        const content = contentText?.value.trim();
        if (!title || !content) return alert('Please enter both title and content.');

        const res = await apiCall('POST', '/discussions', {
          title,
          content,
          researchArea: areaSelect?.value || 'General',
          authorId: user.id,
          authorName: user.name
        });

        if (res.success) {
          showToast('Discussion topic published to database!');
          if (typeof hideModal === 'function') hideModal('startDiscussionModal');
          initDiscussionsPage(user);
        } else {
          showToast('Error creating discussion: ' + res.message, true);
        }
      };
    }
  }
}

function renderFilteredDiscussions(discussions, container) {
  if (!discussions || discussions.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);"><i class="bi bi-chat-square-dots" style="font-size:1.8rem;opacity:0.5;"></i><p style="margin-top:0.75rem;">No matching discussions found.</p></div>';
    return;
  }

  container.innerHTML = discussions.map(d => `
    <div class="rcp-card" style="padding:1.5rem;margin-bottom:1rem;" id="disc-card-${d.id}">
      <div style="display:flex;align-items:flex-start;gap:1rem;">
        <div class="avatar avatar-md" style="flex-shrink:0;">
          ${(d.authorName || 'U').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:0.25rem;">${d.title}</h3>
              <div style="font-size:0.75rem;color:var(--text-muted);">${d.authorName || 'Researcher'} · ${new Date(d.createdAt || Date.now()).toLocaleDateString()} · <span class="chip chip-cyan" style="font-size:0.68rem;">${d.researchArea || 'Research'}</span></div>
            </div>
          </div>
          <p style="color:var(--text-secondary);font-size:0.9rem;margin:0.75rem 0;line-height:1.6;">${d.content || ''}</p>
          <div style="display:flex;gap:0.75rem;">
            <button class="btn-ghost" onclick="loadAndToggleComments(${d.id})" style="font-size:0.8rem;padding:0.35rem 0.75rem;">
              <i class="bi bi-chat-left-text"></i> View / Add Replies
            </button>
          </div>
          <div id="comments-box-${d.id}" style="display:none;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border-color);"></div>
        </div>
      </div>
    </div>
  `).join('');
}

window.loadAndToggleComments = async (discId) => {
  const box = document.getElementById('comments-box-' + discId);
  if (!box) return;
  if (box.style.display !== 'none') { box.style.display = 'none'; return; }
  
  box.style.display = 'block';
  box.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Loading replies...</div>';

  const cRes = await apiCall('GET', `/discussions/${discId}/comments`);
  const comments = cRes.success && cRes.data ? cRes.data : [];

  box.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.75rem;">
      ${comments.length ? comments.map(c => `
        <div style="background:var(--bg-surface);padding:0.6rem 0.85rem;border-radius:6px;font-size:0.85rem;">
          <strong style="color:var(--primary-light);">${c.authorName || 'User'}:</strong> ${c.content}
        </div>
      `).join('') : '<div style="color:var(--text-muted);font-size:0.8rem;">No replies yet. Be the first to reply!</div>'}
    </div>
    <div style="display:flex;gap:0.5rem;">
      <input type="text" id="comment-input-${discId}" placeholder="Write a reply..." class="form-control-custom" style="flex:1;padding:0.4rem 0.75rem;font-size:0.85rem;" />
      <button class="btn-primary-custom" onclick="submitComment(${discId})" style="padding:0.4rem 1rem;font-size:0.85rem;">Reply</button>
    </div>
  `;
};

window.submitComment = async (discId) => {
  const input = document.getElementById('comment-input-' + discId);
  if (!input || !input.value.trim()) return;
  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');
  const res = await apiCall('POST', `/discussions/${discId}/comments`, {
    content: input.value.trim(),
    authorId: user.id || 1,
    authorName: user.name || 'Researcher',
    discussionId: discId
  });
  if (res.success) {
    showToast('Reply saved!');
    loadAndToggleComments(discId);
    loadAndToggleComments(discId);
  }
};

/* ============================================================
   10. FILES PAGE — Live Upload & Real Download
   ============================================================ */
let allFilesCache = [];

async function initFilesPage(user) {
  const container = document.getElementById('filesListContainer');
  if (!container) return;

  const currentUserId = user?.id || user?.userId;
  if (!currentUserId) {
    renderFilteredFiles([], container, user);
    return;
  }

  // 1. Only load projects where user is enrolled or owner
  const projRes = await apiCall('GET', '/projects/user/' + currentUserId);
  const projSelect = document.getElementById('fileProjectSelect');
  const uploadSubmitBtn = document.getElementById('btnUploadSubmit');

  if (projSelect) {
    if (projRes.success && projRes.data && projRes.data.length > 0) {
      projSelect.innerHTML = projRes.data.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
      if (uploadSubmitBtn) uploadSubmitBtn.disabled = false;
    } else {
      projSelect.innerHTML = '<option value="">-- No Enrolled Projects Available --</option>';
      if (uploadSubmitBtn) {
        uploadSubmitBtn.disabled = true;
        uploadSubmitBtn.title = 'You must create or join a project before you can upload files.';
      }
    }
  }

  // 2. Fetch user-scoped accessible files
  const res = await apiCall('GET', '/files?userId=' + currentUserId);
  if (res.success && Array.isArray(res.data)) {
    allFilesCache = res.data;
    renderFilteredFiles(allFilesCache, container, user);
  } else {
    allFilesCache = [];
    renderFilteredFiles([], container, user);
  }

  const searchInput = document.getElementById('searchFileInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = allFilesCache.filter(f => (f.originalFilename || f.filename || '').toLowerCase().includes(q));
      renderFilteredFiles(filtered, container, user);
    });
  }
}

function renderFilteredFiles(files, container, user = {}) {
  if (!files || files.length === 0) {
    container.innerHTML = `
      <div class="rcp-card" style="text-align:center;padding:3.5rem 1.5rem;color:var(--text-muted);border:1px dashed var(--border-color);">
        <i class="bi bi-file-earmark-lock" style="font-size:2.5rem;opacity:0.5;color:var(--text-muted);"></i>
        <h3 style="font-size:1.1rem;font-weight:700;margin-top:1rem;color:var(--text-primary);">No Accessible Research Files</h3>
        <p style="margin-top:0.4rem;font-size:0.88rem;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.5;">
          You can only view files uploaded by yourself or shared inside research project groups you belong to. Files will appear here once you or your team members upload them.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = files.map(f => {
    const ext = (f.originalFilename || f.filename || '').split('.').pop().toLowerCase();
    let icon = 'bi-file-earmark-text-fill';
    let iconColor = '#818cf8';
    if (ext === 'pdf') { icon = 'bi-file-earmark-pdf-fill'; iconColor = '#f87171'; }
    else if (['csv', 'xlsx', 'xls'].includes(ext)) { icon = 'bi-file-earmark-spreadsheet-fill'; iconColor = '#34d399'; }
    else if (['zip', 'rar', 'tar', 'gz'].includes(ext)) { icon = 'bi-file-earmark-zip-fill'; iconColor = '#fbbf24'; }
    else if (['py', 'java', 'js', 'cpp'].includes(ext)) { icon = 'bi-file-earmark-code-fill'; iconColor = '#60a5fa'; }

    const sizeFormatted = f.fileSize ? (f.fileSize > 1048576 ? (f.fileSize / 1048576).toFixed(2) + ' MB' : (f.fileSize / 1024).toFixed(1) + ' KB') : 'Document';

    return `
      <div class="rcp-card" style="padding:1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:1.25rem;">
          <i class="bi ${icon}" style="font-size:2rem;color:${iconColor};"></i>
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${f.originalFilename || f.filename}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">
              Size: ${sizeFormatted} · Uploaded ${new Date(f.uploadedAt || Date.now()).toLocaleDateString()} · Status: <span style="color:#10b981;">Approved</span>
            </div>
          </div>
        </div>
        <a href="http://localhost:8080/api/files/download/${f.id}?userId=${user?.id || ''}" target="_blank" download class="btn-outline-custom" style="font-size:0.82rem;padding:0.45rem 1rem;text-decoration:none;display:inline-flex;align-items:center;gap:0.4rem;">
          <i class="bi bi-download"></i> Download File
        </a>
      </div>
    `;
  }).join('');
}

window.handleFileUploadSubmit = async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('filePicker');
  const projSelect = document.getElementById('fileProjectSelect');
  const submitBtn = document.getElementById('btnUploadSubmit');

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert('Please choose a file to upload.');
    return;
  }

  const file = fileInput.files[0];
  const user = JSON.parse(localStorage.getItem('rcp_user') || '{}');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projSelect?.value || '1');
  formData.append('uploaderId', user.id || '1');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite;display:inline-block;"></i> Uploading...';
  }

  try {
    const res = await fetch(API_BASE + '/files/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('File uploaded successfully and saved to database!');
      if (typeof closeUploadModal === 'function') closeUploadModal();
      fileInput.value = '';
      initFilesPage(user);
    } else {
      showToast('Upload failed: ' + (data.message || 'Error'), true);
    }
  } catch (err) {
    showToast('Network error: ' + err.message, true);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-upload"></i> Upload File';
    }
  }
};

/* ============================================================
   11. ADMIN USERS MANAGEMENT
   ============================================================ */
async function initAdminUsersPage(user) {
  const tbody = document.querySelector('tbody');
  if (!tbody) return;

  const res = await apiCall('GET', '/admin/users');
  if (res.success && res.data) {
    tbody.innerHTML = res.data.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <div class="user-avatar-mini" style="width:32px;height:32px;font-size:0.8rem;">${(u.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;font-size:0.875rem;">${u.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="chip">${u.role}</span></td>
        <td style="font-size:0.85rem;color:var(--text-secondary);">${u.department || 'N/A'}</td>
        <td style="font-size:0.85rem;color:var(--text-secondary);">${u.university || 'N/A'}</td>
        <td><span class="badge-custom ${u.status === 'SUSPENDED' ? 'badge-planning' : 'badge-active'}">${u.status || 'ACTIVE'}</span></td>
        <td>
          ${u.status !== 'SUSPENDED' ?
            `<button class="btn-ghost" onclick="adminToggleUser(${u.id}, 'suspend')" style="font-size:0.78rem;padding:0.25rem 0.6rem;color:var(--danger);border-color:var(--danger);">
              <i class="bi bi-slash-circle"></i> Suspend
            </button>` :
            `<button class="btn-ghost" onclick="adminToggleUser(${u.id}, 'activate')" style="font-size:0.78rem;padding:0.25rem 0.6rem;color:var(--success);border-color:var(--success);">
              <i class="bi bi-check-circle"></i> Activate
            </button>`
          }
        </td>
      </tr>
    `).join('');
  }

  window.adminToggleUser = async (id, action) => {
    const res = await apiCall('PUT', `/admin/users/${id}/${action}`);
    if (res.success) {
      showToast(`User status updated to ${action.toUpperCase()}!`);
      initAdminUsersPage(user);
    }
  };
}

/* ============================================================
   AUTH API HANDLERS — Login, Register, Logout
   ============================================================ */
async function handleLoginRedirect(email, password) {
  const errorEl = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');
  const btnText = document.getElementById('loginBtnText');
  const btnSpinner = document.getElementById('loginBtnSpinner');

  function showError(msg) {
    if (errorEl) { errorEl.style.display = 'flex'; }
    if (errorMsg) errorMsg.textContent = msg;
    if (btnText) btnText.style.display = 'inline-flex';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }

  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!data.success || !data.data) {
      showError(data.message || 'Invalid email or password.');
      return;
    }

    const user = data.data;
    localStorage.setItem('rcp_user', JSON.stringify(user));
    redirectByRole(user.role, './');

  } catch (err) {
    showError('Cannot connect to server. Make sure the backend is running on port 8080.');
  }
}

async function handleRegister(formData) {
  const btn = document.getElementById('nextBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:spin 1s linear infinite"></i> Creating...';
  }

  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!data.success || !data.data) {
      alert('Registration failed: ' + (data.message || 'Unknown error'));
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Create Account'; }
      return;
    }

    const user = data.data;
    localStorage.setItem('rcp_user', JSON.stringify(user));
    if (btn) btn.innerHTML = '<i class="bi bi-check-circle-fill" style="color:#10b981"></i> Account Created!';
    setTimeout(() => redirectByRole(user.role, './'), 800);

  } catch (err) {
    alert('Cannot connect to server. Make sure the backend is running on port 8080.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Create Account'; }
  }
}

function logoutUser() {
  localStorage.removeItem('rcp_user');
  sessionStorage.removeItem('rcp_user');
  const path = window.location.pathname.replace(/\\/g, '/');
  const prefix = (path.includes('/student/') || path.includes('/supervisor/') || path.includes('/admin/')) ? '../' : './';
  window.location.href = prefix + 'login.html';
}

function redirectByRole(role, prefix) {
  prefix = prefix || './';
  const cleanRole = (role || 'STUDENT').toUpperCase();
  if (cleanRole === 'SUPERVISOR') {
    window.location.href = prefix + 'supervisor/dashboard.html';
  } else if (cleanRole === 'ADMIN') {
    window.location.href = prefix + 'admin/dashboard.html';
  } else {
    window.location.href = prefix + 'student/dashboard.html';
  }
}

// Window globals
window.logoutUser = logoutUser;
window.handleLoginRedirect = handleLoginRedirect;
window.handleRegister = handleRegister;
window.redirectByRole = redirectByRole;
window.showToast = showToast;
window.apiCall = apiCall;
