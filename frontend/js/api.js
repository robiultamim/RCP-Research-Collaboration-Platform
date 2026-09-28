/* ============================================================
   RCP - Research Collaboration Platform
   API Helper Module (Fetch API Wrapper for Spring Boot REST endpoints)
   ============================================================ */

const API_BASE_URL = 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getHeaders() {
    const token = localStorage.getItem('rcp_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Auth APIs
  login(credentials) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }); }
  register(userData) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }); }
  logout() { return this.request('/auth/logout', { method: 'POST' }); }

  // User APIs
  getUsers() { return this.request('/users'); }
  getUserById(id) { return this.request(`/users/${id}`); }
  updateUser(id, data) { return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  searchUsers(query) { return this.request(`/users/search?q=${encodeURIComponent(query)}`); }

  // Project APIs
  getProjects() { return this.request('/projects'); }
  getProjectById(id) { return this.request(`/projects/${id}`); }
  createProject(data) { return this.request('/projects', { method: 'POST', body: JSON.stringify(data) }); }
  updateProject(id, data) { return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteProject(id) { return this.request(`/projects/${id}`, { method: 'DELETE' }); }

  // Task APIs
  getTasksByProject(projectId) { return this.request(`/projects/${projectId}/tasks`); }
  createTask(projectId, data) { return this.request(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(data) }); }
  updateTask(taskId, data) { return this.request(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }); }

  // Discussion APIs
  getDiscussions(projectId) { return this.request(`/projects/${projectId}/discussions`); }
  createDiscussion(projectId, data) { return this.request(`/projects/${projectId}/discussions`, { method: 'POST', body: JSON.stringify(data) }); }
  getComments(discussionId) { return this.request(`/discussions/${discussionId}/comments`); }
  addComment(discussionId, data) { return this.request(`/discussions/${discussionId}/comments`, { method: 'POST', body: JSON.stringify(data) }); }

  // File APIs
  getFiles(projectId) { return this.request(`/projects/${projectId}/files`); }
}

const api = new ApiService();
