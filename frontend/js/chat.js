/* ============================================================
   RCP Real-Time Chat Engine — Direct Messaging & Project Rooms
   Connects to Spring Boot backend (/api/chat) with auto-sync
   ============================================================ */

let chatCurrentUser = null;
let activeChat = null; // { type: 'user'|'project', id: number, name: string, subtitle: string }
let chatCategory = 'users'; // 'users' | 'projects'
let chatContactsCache = [];
let chatRoomsCache = [];
let chatPollingInterval = null;
let lastRenderedMessageCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const userJson = localStorage.getItem('rcp_user');
  if (!userJson) return;
  chatCurrentUser = JSON.parse(userJson);

  // Initialize chat hub
  await initChatHub();

  // Start background auto-poll (every 2.5 seconds)
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(() => {
    pollActiveChatMessages();
  }, 2500);
});

async function initChatHub() {
  if (!chatCurrentUser) return;

  // Load both contacts and project channels in parallel
  await Promise.all([
    fetchChatContacts(),
    fetchChatRooms()
  ]);

  renderChatSidebar();

  // Automatically select first available conversation
  if (chatContactsCache.length > 0) {
    const first = chatContactsCache[0];
    const sub = `${first.role || 'Member'} · ${first.department || 'Academic'} (${first.university || 'University'})`;
    selectChat('user', first.id, first.name, sub);
  } else if (chatRoomsCache.length > 0) {
    const first = chatRoomsCache[0];
    switchChatCategory('projects');
    selectChat('project', first.id, first.title, `${first.researchArea || 'Research'} · Project Channel`);
  }
}

async function fetchChatContacts() {
  try {
    const res = await apiCall('GET', `/chat/contacts?currentUserId=${chatCurrentUser.id}`);
    if (res.success && res.data) {
      chatContactsCache = res.data;
    }
  } catch (e) {
    console.error('[Chat] Error fetching contacts:', e);
  }
}

async function fetchChatRooms() {
  try {
    const res = await apiCall('GET', `/chat/rooms?userId=${chatCurrentUser.id}`);
    if (res.success && res.data) {
      chatRoomsCache = res.data;
    }
  } catch (e) {
    console.error('[Chat] Error fetching rooms:', e);
  }
}

window.switchChatCategory = function(cat) {
  chatCategory = cat;
  const tabUsers = document.getElementById('tabDirectChat');
  const tabProjects = document.getElementById('tabProjectChat');

  if (tabUsers && tabProjects) {
    if (cat === 'users') {
      tabUsers.classList.add('active');
      tabProjects.classList.remove('active');
    } else {
      tabProjects.classList.add('active');
      tabUsers.classList.remove('active');
    }
  }

  renderChatSidebar();
};

window.filterChatList = function() {
  renderChatSidebar();
};

function renderChatSidebar() {
  const listEl = document.getElementById('chatConversationsList');
  if (!listEl) return;

  const searchInput = document.getElementById('chatSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (chatCategory === 'users') {
    const filtered = chatContactsCache.filter(u => 
      (u.name || '').toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query) ||
      (u.department || '').toLowerCase().includes(query) ||
      (u.university || '').toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:0.85rem;">
          No contacts found.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(u => {
      const isSelected = activeChat && activeChat.type === 'user' && activeChat.id === u.id;
      const initial = (u.name || 'U').trim().charAt(0).toUpperCase();
      const role = u.role || 'STUDENT';
      const roleChipClass = role === 'SUPERVISOR' ? 'chip-cyan' : role === 'ADMIN' ? 'chip-amber' : 'chip-purple';
      const sub = `${u.role || 'Member'} · ${u.department || 'Academic'}`;

      return `
        <div class="chat-item ${isSelected ? 'active' : ''}" onclick="selectChat('user', ${u.id}, '${escapeHtml(u.name)}', '${escapeHtml(sub)}')">
          <div class="user-avatar-mini" style="width:38px;height:38px;font-size:0.9rem;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
            ${initial}
          </div>
          <div style="flex:1;min-width:0;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.15rem;">
              <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${u.name}
              </div>
              <span class="chip ${roleChipClass}" style="font-size:0.65rem;padding:0.1rem 0.4rem;">${role}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${u.lastMessage ? escapeHtml(u.lastMessage) : u.department || 'Academic Department'}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } else {
    // Project Channels
    const filtered = chatRoomsCache.filter(p => 
      (p.title || '').toLowerCase().includes(query) ||
      (p.researchArea || '').toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:0.85rem;">
          No project channels joined yet.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(p => {
      const isSelected = activeChat && activeChat.type === 'project' && activeChat.id === p.id;
      const initial = (p.title || 'P').trim().charAt(0).toUpperCase();
      const sub = `${p.researchArea || 'Research'} · Project Channel`;

      return `
        <div class="chat-item ${isSelected ? 'active' : ''}" onclick="selectChat('project', ${p.id}, '${escapeHtml(p.title)}', '${escapeHtml(sub)}')">
          <div class="user-avatar-mini" style="width:38px;height:38px;font-size:0.9rem;border-radius:var(--radius-md);background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
            ${initial}
          </div>
          <div style="flex:1;min-width:0;overflow:hidden;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.15rem;">
              <div style="font-weight:700;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${p.title}
              </div>
              <span class="badge-custom badge-active" style="font-size:0.65rem;">ACTIVE</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${p.lastMessage ? escapeHtml(p.lastMessage) : p.researchArea || 'Team Room'}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.selectChat = async function(type, id, name, subtitle) {
  activeChat = { type, id: Number(id), name, subtitle };
  lastRenderedMessageCount = 0;

  // Update header
  const titleEl = document.getElementById('chatHeaderTitle');
  const subEl = document.getElementById('chatHeaderSubtitle');
  const avatarEl = document.getElementById('chatHeaderAvatar');
  const inputEl = document.getElementById('chatMessageInput');

  if (titleEl) titleEl.textContent = name;
  if (subEl) subEl.textContent = subtitle;
  if (avatarEl) {
    avatarEl.textContent = name.trim().charAt(0).toUpperCase();
    if (type === 'project') {
      avatarEl.style.borderRadius = 'var(--radius-md)';
      avatarEl.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)';
    } else {
      avatarEl.style.borderRadius = '50%';
      avatarEl.style.background = 'var(--primary)';
    }
  }
  if (inputEl) {
    inputEl.placeholder = `Type a message to ${name}...`;
    inputEl.focus();
  }

  // Highlight active in sidebar
  renderChatSidebar();

  // Load messages
  await loadActiveChatMessages();
};

async function loadActiveChatMessages() {
  if (!activeChat || !chatCurrentUser) return;

  const messagesArea = document.getElementById('chatMessagesArea');
  if (!messagesArea) return;

  let url = '';
  if (activeChat.type === 'user') {
    url = `/chat/direct?user1=${chatCurrentUser.id}&user2=${activeChat.id}`;
  } else {
    url = `/chat/project/${activeChat.id}`;
  }

  try {
    const res = await apiCall('GET', url);
    if (res.success && res.data) {
      renderMessages(res.data, messagesArea);
    }
  } catch (e) {
    console.error('[Chat] Error loading messages:', e);
  }
}

function renderMessages(messages, container) {
  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;margin:auto;color:var(--text-muted);padding:2rem;">
        <i class="bi bi-chat-heart" style="font-size:3rem;opacity:0.35;display:block;margin-bottom:0.75rem;"></i>
        <h4 style="font-size:1.1rem;font-weight:700;margin-bottom:0.25rem;">Start the Conversation</h4>
        <p style="font-size:0.85rem;">No messages exchanged yet. Send the first message below!</p>
      </div>
    `;
    lastRenderedMessageCount = 0;
    return;
  }

  // Only re-render if count changed to avoid flickering
  if (messages.length === lastRenderedMessageCount) return;
  lastRenderedMessageCount = messages.length;

  container.innerHTML = messages.map(m => {
    const isOwn = m.senderId === chatCurrentUser.id;
    const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const initial = (m.senderName || 'U').trim().charAt(0).toUpperCase();

    if (isOwn) {
      return `
        <div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:0.5rem;margin-bottom:0.5rem;">
          <div class="msg-bubble-outgoing">
            <div style="font-size:0.9rem;line-height:1.5;word-break:break-word;">${escapeHtml(m.message)}</div>
            <div style="font-size:0.7rem;opacity:0.75;text-align:right;margin-top:0.3rem;">${timeStr}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="display:flex;justify-content:flex-start;align-items:flex-end;gap:0.6rem;margin-bottom:0.5rem;">
          <div class="user-avatar-mini" style="width:32px;height:32px;font-size:0.8rem;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">
            ${initial}
          </div>
          <div class="msg-bubble-incoming">
            <div style="font-size:0.75rem;font-weight:700;color:var(--primary-light);margin-bottom:0.2rem;">${escapeHtml(m.senderName || 'User')}</div>
            <div style="font-size:0.9rem;line-height:1.5;color:var(--text-primary);word-break:break-word;">${escapeHtml(m.message)}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);text-align:right;margin-top:0.3rem;">${timeStr}</div>
          </div>
        </div>
      `;
    }
  }).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

async function pollActiveChatMessages() {
  if (!activeChat || !chatCurrentUser) return;
  let url = '';
  if (activeChat.type === 'user') {
    url = `/chat/direct?user1=${chatCurrentUser.id}&user2=${activeChat.id}`;
  } else {
    url = `/chat/project/${activeChat.id}`;
  }
  try {
    const res = await apiCall('GET', url);
    const container = document.getElementById('chatMessagesArea');
    if (res.success && res.data && container) {
      if (res.data.length !== lastRenderedMessageCount) {
        renderMessages(res.data, container);
      }
    }
  } catch (e) {
    // Ignore poll network errors
  }
}

window.handleSendChatMessage = async function(e) {
  e.preventDefault();
  if (!activeChat || !chatCurrentUser) return;

  const input = document.getElementById('chatMessageInput');
  if (!input) return;
  const message = input.value.trim();
  if (!message) return;

  const payload = {
    senderId: chatCurrentUser.id,
    senderName: chatCurrentUser.name,
    recipientId: activeChat.type === 'user' ? activeChat.id : null,
    recipientName: activeChat.type === 'user' ? activeChat.name : null,
    projectId: activeChat.type === 'project' ? activeChat.id : null,
    message: message
  };

  input.value = '';

  const res = await apiCall('POST', '/chat/send', payload);
  if (res.success && res.data) {
    await loadActiveChatMessages();
    // Update local sidebar snippet
    if (activeChat.type === 'user') {
      const contact = chatContactsCache.find(c => c.id === activeChat.id);
      if (contact) contact.lastMessage = message;
    } else {
      const room = chatRoomsCache.find(r => r.id === activeChat.id);
      if (room) room.lastMessage = chatCurrentUser.name + ': ' + message;
    }
    renderChatSidebar();
  } else {
    showToast('Failed to send message: ' + (res.message || 'Error'), true);
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
