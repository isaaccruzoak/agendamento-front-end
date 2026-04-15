import axios from 'axios'

// A chave é lida de variável de ambiente do Vite (prefixo VITE_)
// Em desenvolvimento fica no arquivo .env.local do frontend
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || ''

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'x-admin-key': ADMIN_KEY,
  },
})

export const clientsApi = {
  getAll:  ()          => api.get('/clients'),
  create:  (data)      => api.post('/clients', data),
  update:  (id, data)  => api.put(`/clients/${id}`, data),
  remove:  (id)        => api.delete(`/clients/${id}`),
}

export const appointmentsApi = {
  getAll:  (params)    => api.get('/appointments', { params }),
  create:  (data)      => api.post('/appointments', data),
  update:  (id, data)  => api.put(`/appointments/${id}`, data),
  cancel:  (id)        => api.delete(`/appointments/${id}`),
  getLogs: (id)        => api.get(`/appointments/${id}/reminder-logs`),
}

export const dashboardApi = {
  getStats:     (date) => api.get('/dashboard', { params: { date } }),
  getFreeSlots: (date) => api.get('/dashboard/free-slots', { params: { date } }),
}

export const settingsApi = {
  get:    ()     => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

export const whatsappApi = {
  getStatus:    ()         => api.get('/whatsapp/status'),
  getQR:        ()         => api.get('/whatsapp/qr'),
  connect:      ()         => api.post('/whatsapp/connect'),
  disconnect:   ()         => api.post('/whatsapp/disconnect'),
  sendTest:     (data)     => api.post('/whatsapp/test', data),
  sendReminder: (id, type) => api.post(`/whatsapp/send-reminder/${id}`, { type }),
}

export default api
