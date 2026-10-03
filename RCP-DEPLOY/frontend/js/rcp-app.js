/* ============================================================
   RCP - Main Application JS
   Connects every page to the Spring Boot backend API.
   Loaded by all dashboard pages.
   ============================================================ */

const RCP = {
  API_BASE: 'http://localhost:8080/api',

  /* ---------- Core API caller ---------- */
  async api(method, endpoint, body) {
    try {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(RCP.API_BASE + endpoint, opts);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn('[RCP] API error:', endpoint, err.message);
      return { success: false, message: err.message, data: null };
    }
  },

  /* ---------- Current user from localStorage ---------- */
  currentUser() {
    try { return JSON.parse(localStorage.getItem('rcp_user')); }
    catch { return null; }
  },

  /* ---------- Update stored user ---------- */
  saveUser(user) {
    localStorage.setItem('rcp_user', JSON.stringify(user));
  },

  /* ---------- Role helpers ---------- */
  isStudent()    { const u = RCP.currentUser(); return u && u.role === 'STUDENT'; },
  isSupervisor() { const u = RCP.currentUser(); return u && u.role === 'SUPERVISOR'; },
  isAdmin()      { const u = RCP.currentUser(); return u && u.role === 'ADMIN'; },

  /* ---------- Format date ---------- */
  fmtDate(dt) {
    if (!dt) return 'N/A';
    try { return new Date(dt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return dt; }
  },

  /* ---------- Status badge HTML ---------- */
  badge(status) {
    const map = {
      ACTIVE: 'success', PLANNING: 'warning', COMPLETED: 'secondary',
      ARCHIVED: 'muted', TODO: 'warning', IN_PROGRESS: 'info',
      SUSPENDED: 'danger', HIGH: 'danger', MEDIUM: 'warning', LOW: 'success'
    };
    const color = map[status] || 'muted';
    return `<span class="badge badge-${color}">${status}</span>`;
  },

  /* ---------- Show toast notification ---------- */
  toast(msg, type = 'success') {
    let container = document.getElementById('rcpToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'rcpToastContainer';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1';
    toast.style.cssText = `background:#1e1e2e;border:1px solid ${color};border-left:4px solid ${color};color:#fff;padding:12px 18px;border-radius:8px;font-size:0.875rem;box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:fadeIn 0.3s ease;`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  /* ============================================================
     PAGE LOADERS — called by each page on DOMContentLoaded
     ============================================================ */

  /* ---- PROFILE PAGE ---- */
  async loadProfile() {
    const user = RCP.currentUser();
    if (!user || !user.id) return;
    const res = await RCP.api('GET', `/users/${user.id}`);
    if (!res.success) return;
    const u = res.data;
    // Update localStorage with fresh data
    RCP.saveUser(u);
    // Fill profile fields
    RCP.setEl('profileName', u.name);
    RCP.setEl('profileEmail', u.email);
    RCP.setEl('profileRole', u.role === 'SUPERVISOR' ? 'Faculty Supervisor' : u.role === 'ADMIN' ? 'Platform Administrator' : 'Student Researcher');
    RCP.setEl('profileDept', u.department || 'Not specified');
    RCP.setEl('profileUniv', u.university || 'Not specified');
    RCP.setEl('profileBio', u.bio || 'No bio yet.');
    RCP.setEl('profileJoined', RCP.fmtDate(u.createdAt));
    // Skills chips
    const skillsEl = document.getElementById('profileSkills');
    if (skillsEl && u.skills) {
      skillsEl.innerHTML = u.skills.split(',').map(s => `<span class="chip">${s.trim()}</span>`).join('');
    }
    // Interests
    const interestsEl = document.getElementById('profileInterests');
    if (interestsEl && u.researchInterests) {
      interestsEl.innerHTML = u.researchInterests.split(',').map(s => `<span class="chip chip-secondary">${s.trim()}</span>`).join('');
    }
    // Initials avatar
    const initials = u.name ? u.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'US';
    document.querySelectorAll('.profile-avatar-lg, .user-avatar-mini, .avatar-sm').forEach(el => { el.textContent = initials; });
    // Edit form pre-fill
    RCP.setVal('editName', u.name);
    RCP.setVal('editDept', u.department);
    RCP.setVal('editUniv', u.university);
    RCP.setVal('editBio', u.bio);
    RCP.setVal('editSkills', u.skills);
    RCP.setVal('editInterests', u.researchInterests);
  },

  async saveProfile(formData) {
    const user = RCP.currentUser();
    if (!user || !user.id) return;
    const res = await RCP.api('PUT', `/users/${user.id}`, formData);
    if (res.success) {
      RCP.saveUser(res.data);
      RCP.toast('Profile updated successfully!');
      setTimeout(() => location.reload(), 1000);
    } else {
      RCP.toast('Failed to update profile: ' + res.message, 'error');
    }
  },

  /* ---- DASHBOARD PAGE ---- */
  async loadDashboard() {
    const user = RCP.currentUser();
    if (!user) return;
    // Load stats
    const statsRes = await RCP.api('GET', '/admin/stats');
    if (statsRes.success) {
      RCP.setEl('statTotalUsers', statsRes.data.totalUsers);
      RCP.setEl('statTotalProjects', statsRes.data.totalProjects);
      RCP.setEl('statActiveProjects', statsRes.data.activeProjects);
      RCP.setEl('statTotalTasks', statsRes.data.totalTasks || 0);
    }
    // Load user's own projects
    const projRes = await RCP.api('GET', '/projects/owner/' + user.id);
    if (projRes.success) {
      RCP.setEl('statMyProjects', projRes.data.length);
      RCP.renderRecentProjects(projRes.data.slice(0, 3));
    }
    // Load user's tasks
    const taskRes = await RCP.api('GET', '/tasks/user/' + user.id);
    if (taskRes.success) {
      RCP.setEl('statMyTasks', taskRes.data.length);
      const pending = taskRes.data.filter(t => t.status !== 'COMPLETED').length;
      RCP.setEl('statPendingTasks', pending);
      RCP.renderRecentTasks(taskRes.data.slice(0, 5));
    }
    // Update greeting
    RCP.setEl('greetingName', user.name ? user.name.split(' ')[0] : 'there');
  },

  renderRecentProjects(projects) {
    const el = document.getElementById('recentProjectsList');
    if (!el) return;
    if (!projects.length) { el.innerHTML = '<p class="text-muted">No projects yet.</p>'; return; }
    el.innerHTML = projects.map(p => `
      <div class="rcp-card" style="padding:1rem;margin-bottom:0.5rem;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-weight:600;font-size:0.9rem;">${p.title}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${p.researchArea || 'Research'} · ${p.status}</div>
        </div>
        ${RCP.badge(p.status)}
      </div>`).join('');
  },

  renderRecentTasks(tasks) {
    const el = document.getElementById('recentTasksList');
    if (!el) return;
    if (!tasks.length) { el.innerHTML = '<p class="text-muted">No tasks assigned yet.</p>'; return; }
    el.innerHTML = tasks.map(t => `
      <div style="padding:0.6rem 0;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:0.875rem;font-weight:500;">${t.title}</div>
        <div style="display:flex;gap:6px;">${RCP.badge(t.priority||'MEDIUM')} ${RCP.badge(t.status)}</div>
      </div>`).join('');
  },

  /* ---- PROJECTS PAGE ---- */
  async loadProjects() {
    const res = await RCP.api('GET', '/projects');
    if (!res.success) return;
    RCP.renderProjectCards(res.data);
    RCP.setEl('statProjectCount', res.data.length);
  },

  renderProjectCards(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    if (!projects.length) { grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:3rem;">No projects found.</p>'; return; }
    grid.innerHTML = projects.map(p => `
      <div class="rcp-card project-card" style="padding:0;">
        <div style="padding:1.25rem 1.25rem 0.75rem;border-bottom:1px solid var(--border-color);">
          <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:0.5rem;">
            <span class="chip">${p.researchArea || 'Research'}</span>
            ${RCP.badge(p.status || 'ACTIVE')}
          </div>
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:0.4rem;">${p.title}</h3>
          <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.5;">${(p.description||'').substring(0,100)}${p.description && p.description.length>100?'...':''}</p>
        </div>
        <div style="padding:0.75rem 1.25rem;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.75rem;color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${p.deadline || 'No deadline'}</span>
          <a href="project-details.html?id=${p.id}" class="btn-primary-custom" style="padding:0.35rem 0.9rem;font-size:0.8rem;">Open</a>
        </div>
      </div>`).join('');
  },

  async createProject(formData) {
    const user = RCP.currentUser();
    formData.ownerId = user.id;
    formData.status = 'ACTIVE';
    const res = await RCP.api('POST', '/projects', formData);
    if (res.success) {
      RCP.toast('Project created!');
      setTimeout(() => location.reload(), 800);
    } else {
      RCP.toast('Failed: ' + res.message, 'error');
    }
  },

  /* ---- TASKS PAGE ---- */
  async loadTasks() {
    const user = RCP.currentUser();
    if (!user) return;
    // Load tasks for this user
    const res = await RCP.api('GET', '/tasks/user/' + user.id);
    if (!res.success) return;
    RCP.renderKanban(res.data);
    RCP.renderTaskList(res.data);
  },

  async loadAllTasks() {
    // For admin/supervisor — load all tasks
    const res = await RCP.api('GET', '/tasks');
    if (!res.success) return;
    RCP.renderKanban(res.data);
    RCP.renderTaskList(res.data);
  },

  renderKanban(tasks) {
    const cols = { TODO: [], IN_PROGRESS: [], COMPLETED: [], REVIEW: [] };
    tasks.forEach(t => {
      const col = cols[t.status] || cols.TODO;
      col.push(t);
    });
    Object.entries(cols).forEach(([status, items]) => {
      const el = document.getElementById('kanban_' + status);
      if (!el) return;
      const count = document.getElementById('kanbanCount_' + status);
      if (count) count.textContent = items.length;
      if (!items.length) {
        el.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.8rem;">No tasks</div>';
        return;
      }
      el.innerHTML = items.map(t => `
        <div class="kanban-card" draggable="true" data-task-id="${t.id}" data-status="${t.status}"
          style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:0.85rem;margin-bottom:0.5rem;cursor:grab;">
          <div style="font-weight:600;font-size:0.875rem;margin-bottom:0.35rem;">${t.title}</div>
          ${t.description ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">${t.description.substring(0,60)}${t.description.length>60?'...':''}</div>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.5rem;">
            <span style="font-size:0.72rem;color:var(--text-muted);"><i class="bi bi-calendar3"></i> ${t.deadline || 'No date'}</span>
            ${RCP.badge(t.priority || 'MEDIUM')}
          </div>
        </div>`).join('');
    });
    // Re-init drag-drop after render
    RCP.initKanbanDragDrop();
  },

  renderTaskList(tasks) {
    const el = document.getElementById('taskListBody');
    if (!el) return;
    if (!tasks.length) { el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No tasks found</td></tr>'; return; }
    el.innerHTML = tasks.map(t => `
      <tr>
        <td style="font-weight:500;">${t.title}</td>
        <td style="color:var(--text-muted);font-size:0.8rem;">${t.projectId ? 'Project #'+t.projectId : 'General'}</td>
        <td>${RCP.badge(t.priority || 'MEDIUM')}</td>
        <td style="font-size:0.8rem;">${t.deadline || 'N/A'}</td>
        <td>${RCP.badge(t.status)}</td>
        <td>
          <button class="btn-ghost" onclick="RCP.deleteTask(${t.id})" style="padding:0.3rem 0.6rem;font-size:0.75rem;color:var(--danger);">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`).join('');
  },

  async createTask(formData) {
    const user = RCP.currentUser();
    formData.assignedUserId = formData.assignedUserId || user.id;
    const res = await RCP.api('POST', '/tasks', formData);
    if (res.success) {
      RCP.toast('Task created!');
      setTimeout(() => location.reload(), 600);
    } else {
      RCP.toast('Failed: ' + res.message, 'error');
    }
  },

  async updateTaskStatus(taskId, newStatus) {
    const res = await RCP.api('PUT', `/tasks/${taskId}/status?status=${newStatus}`, null);
    if (res.success) {
      RCP.toast(`Task moved to ${newStatus}`, 'success');
    }
  },

  async deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    const res = await RCP.api('DELETE', '/tasks/' + taskId);
    if (res.success) { RCP.toast('Task deleted'); setTimeout(() => location.reload(), 600); }
  },

  initKanbanDragDrop() {
    const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
    const columns = document.querySelectorAll('[id^="kanban_"]');

    cards.forEach(card => {
      card.addEventListener('dragstart', e => {
        e.dataTransfer.setData('taskId', card.dataset.taskId);
        card.style.opacity = '0.5';
      });
      card.addEventListener('dragend', () => { card.style.opacity = '1'; });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.style.background = 'rgba(99,102,241,0.08)'; });
      col.addEventListener('dragleave', () => { col.style.background = ''; });
      col.addEventListener('drop', async e => {
        e.preventDefault();
        col.style.background = '';
        const taskId = e.dataTransfer.getData('taskId');
        const newStatus = col.id.replace('kanban_', '');
        await RCP.updateTaskStatus(taskId, newStatus);
        // Reload tasks
        const user = RCP.currentUser();
        const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERVISOR');
        const res = await RCP.api('GET', isAdmin ? '/tasks' : '/tasks/user/' + user.id);
        if (res.success) { RCP.renderKanban(res.data); RCP.renderTaskList(res.data); }
      });
    });
  },

  /* ---- DISCUSSIONS PAGE ---- */
  async loadDiscussions() {
    const res = await RCP.api('GET', '/discussions');
    if (!res.success) return;
    RCP.renderDiscussions(res.data);
  },

  renderDiscussions(discussions) {
    const el = document.getElementById('discussionsList');
    if (!el) return;
    if (!discussions.length) {
      el.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">No discussions yet. Start the first one!</div>';
      return;
    }
    el.innerHTML = discussions.map(d => `
      <div class="rcp-card" style="padding:1.25rem;margin-bottom:0.75rem;" id="disc_${d.id}">
        <div style="display:flex;align-items:start;gap:0.75rem;">
          <div class="user-avatar-mini" style="flex-shrink:0;">${(d.authorName||'U').charAt(0).toUpperCase()}</div>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div>
                <h4 style="font-size:0.95rem;font-weight:700;margin-bottom:0.2rem;">${d.title}</h4>
                <div style="font-size:0.75rem;color:var(--text-muted);">${d.authorName||'Unknown'} · ${RCP.fmtDate(d.createdAt)}</div>
              </div>
            </div>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.5rem 0;">${(d.content||'').substring(0,150)}${d.content && d.content.length>150?'...':''}</p>
            <div style="display:flex;align-items:center;gap:1rem;margin-top:0.5rem;">
              <button class="btn-ghost" onclick="RCP.toggleReplies(${d.id})" style="font-size:0.8rem;padding:0.25rem 0.6rem;">
                <i class="bi bi-chat"></i> Replies
              </button>
            </div>
            <div id="replies_${d.id}" style="display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border-color);"></div>
          </div>
        </div>
      </div>`).join('');
  },

  async toggleReplies(discId) {
    const repliesEl = document.getElementById('replies_' + discId);
    if (!repliesEl) return;
    if (repliesEl.style.display !== 'none') { repliesEl.style.display = 'none'; return; }
    repliesEl.style.display = 'block';
    repliesEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Loading...</div>';
    const res = await RCP.api('GET', `/discussions/${discId}/comments`);
    const user = RCP.currentUser();
    if (res.success) {
      const comments = res.data;
      repliesEl.innerHTML = (comments.length ? comments.map(c => `
        <div style="padding:0.5rem 0;border-bottom:1px solid var(--border-color);font-size:0.82rem;">
          <span style="font-weight:600;color:var(--primary-light);">${c.authorName||'User'}</span>
          <span style="color:var(--text-muted);margin:0 0.5rem;">·</span>${c.content}
        </div>`).join('') : '<div style="color:var(--text-muted);font-size:0.8rem;">No replies yet.</div>') +
        `<div style="margin-top:0.75rem;display:flex;gap:0.5rem;">
          <input type="text" id="replyInput_${discId}" placeholder="Write a reply..." class="form-control-custom" style="flex:1;padding:0.4rem 0.75rem;font-size:0.8rem;" />
          <button class="btn-primary-custom" onclick="RCP.postReply(${discId})" style="padding:0.4rem 0.9rem;font-size:0.8rem;">Reply</button>
        </div>`;
    }
  },

  async postReply(discId) {
    const user = RCP.currentUser();
    const input = document.getElementById('replyInput_' + discId);
    if (!input || !input.value.trim()) return;
    const res = await RCP.api('POST', `/discussions/${discId}/comments`, {
      content: input.value.trim(),
      authorId: user.id,
      authorName: user.name,
      discussionId: discId
    });
    if (res.success) { RCP.toast('Reply posted!'); RCP.toggleReplies(discId); setTimeout(() => RCP.toggleReplies(discId), 100); }
  },

  async postDiscussion(formData) {
    const user = RCP.currentUser();
    formData.authorId = user.id;
    formData.authorName = user.name;
    const res = await RCP.api('POST', '/discussions', formData);
    if (res.success) { RCP.toast('Discussion posted!'); setTimeout(() => location.reload(), 600); }
    else { RCP.toast('Failed: ' + res.message, 'error'); }
  },

  /* ---- NOTIFICATIONS PAGE ---- */
  async loadNotifications() {
    const user = RCP.currentUser();
    if (!user) return;
    const res = await RCP.api('GET', '/notifications/user/' + user.id);
    if (!res.success) return;
    RCP.renderNotifications(res.data);
    // Update badge count
    const unread = res.data.filter(n => !n.isRead).length;
    RCP.setEl('notifBadge', unread || '');
  },

  renderNotifications(notifs) {
    const el = document.getElementById('notificationsList');
    if (!el) return;
    if (!notifs.length) { el.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);">No notifications yet.</div>'; return; }
    el.innerHTML = notifs.map(n => `
      <div class="rcp-card" style="padding:1rem;margin-bottom:0.5rem;display:flex;align-items:start;gap:0.75rem;${!n.isRead ? 'border-left:3px solid var(--primary);' : 'opacity:0.7;'}">
        <i class="bi bi-bell" style="color:var(--primary-light);font-size:1.1rem;margin-top:2px;"></i>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:0.875rem;">${n.title||'Notification'}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">${n.message||''}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.25rem;">${RCP.fmtDate(n.createdAt)}</div>
        </div>
        ${!n.isRead ? `<button class="btn-ghost" onclick="RCP.markNotifRead(${n.id})" style="font-size:0.75rem;padding:0.25rem 0.5rem;">Mark Read</button>` : ''}
      </div>`).join('');
  },

  async markNotifRead(notifId) {
    await RCP.api('PUT', `/notifications/${notifId}/read`);
    RCP.loadNotifications();
  },

  /* ---- ADMIN USERS PAGE ---- */
  async loadAdminUsers() {
    const res = await RCP.api('GET', '/admin/users');
    if (!res.success) return;
    RCP.renderAdminUsers(res.data);
  },

  renderAdminUsers(users) {
    const el = document.getElementById('adminUsersList');
    if (!el) return;
    if (!users.length) { el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">No users found</td></tr>'; return; }
    el.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.6rem;">
            <div class="user-avatar-mini" style="width:32px;height:32px;font-size:0.8rem;">${(u.name||'U').charAt(0).toUpperCase()}</div>
            <div>
              <div style="font-weight:600;font-size:0.875rem;">${u.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="chip">${u.role}</span></td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${u.department||'N/A'}</td>
        <td style="font-size:0.8rem;color:var(--text-muted);">${u.university||'N/A'}</td>
        <td>${RCP.badge(u.status||'ACTIVE')}</td>
        <td>
          ${u.status !== 'SUSPENDED' ?
            `<button class="btn-ghost" onclick="RCP.suspendUser(${u.id})" style="font-size:0.78rem;padding:0.25rem 0.6rem;color:var(--danger);border-color:var(--danger);">
              <i class="bi bi-slash-circle"></i> Suspend
            </button>` :
            `<button class="btn-ghost" onclick="RCP.activateUser(${u.id})" style="font-size:0.78rem;padding:0.25rem 0.6rem;color:var(--success);border-color:var(--success);">
              <i class="bi bi-check-circle"></i> Activate
            </button>`
          }
        </td>
      </tr>`).join('');
  },

  async suspendUser(id) {
    if (!confirm('Suspend this user?')) return;
    const res = await RCP.api('PUT', '/admin/users/' + id + '/suspend');
    if (res.success) { RCP.toast('User suspended'); RCP.loadAdminUsers(); }
  },

  async activateUser(id) {
    const res = await RCP.api('PUT', '/admin/users/' + id + '/activate');
    if (res.success) { RCP.toast('User activated', 'success'); RCP.loadAdminUsers(); }
  },

  /* ---- ADMIN DASHBOARD ---- */
  async loadAdminDashboard() {
    const res = await RCP.api('GET', '/admin/stats');
    if (!res.success) return;
    const s = res.data;
    RCP.setEl('statTotalUsers', s.totalUsers);
    RCP.setEl('statTotalProjects', s.totalProjects);
    RCP.setEl('statActiveProjects', s.activeProjects);
    RCP.setEl('statTotalTasks', s.totalTasks || 0);
    RCP.setEl('statSocketStatus', s.socketStatus);
  },

  /* ---- HELPERS ---- */
  setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },
  setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }
};

// Make RCP global
window.RCP = RCP;
