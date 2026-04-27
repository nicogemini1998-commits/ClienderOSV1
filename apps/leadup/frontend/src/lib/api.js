import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('leadup_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('leadup_token')
      localStorage.removeItem('leadup_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// Leads
export const leadsApi = {
  getToday: () => api.get('/leads/today'),
  updateStatus: (assignmentId, status, notes) =>
    api.patch(`/leads/${assignmentId}/status`, { status, notes }),
}

// Notes
export const notesApi = {
  update: (assignmentId, notes) => api.patch(`/notes/${assignmentId}`, { notes }),
  get: (assignmentId) => api.get(`/notes/${assignmentId}`),
}

// Contacts
export const contactsApi = {
  update: (contactId, data) => api.patch(`/contacts/${contactId}`, data),
}

// Admin
export const adminApi = {
  assignNow: (userId = null, count = 20) =>
    api.post('/admin/assign-now', { user_id: userId, count }),
  getAnalytics: () => api.get('/admin/analytics'),
  toggleLeadSearch: (userId, enabled) =>
    api.patch('/admin/lead-search-toggle', { user_id: userId, enabled }),
  triggerEnrichment: () => api.post('/admin/trigger-enrichment'),
}
