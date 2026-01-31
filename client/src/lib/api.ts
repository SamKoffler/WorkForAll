import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authApi = {
    guestSession: (data: any) => api.post('/auth/guest-session', data),
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
}

// Jobs API
export const jobsApi = {
    list: (params?: any) => api.get('/jobs', { params }),
    get: (id: string) => api.get(`/jobs/${id}`),
    create: (data: any) => api.post('/jobs', data),
    update: (id: string, data: any) => api.patch(`/jobs/${id}`, data),
    delete: (id: string) => api.delete(`/jobs/${id}`),
    myJobs: () => api.get('/jobs/employer/my-jobs'),
}

// Applications API
export const applicationsApi = {
    apply: (data: any) => api.post('/applications', data),
    myApplications: () => api.get('/applications/my-applications'),
    forJob: (jobId: string) => api.get(`/applications/job/${jobId}`),
    updateStatus: (id: string, status: string) =>
        api.patch(`/applications/${id}/status`, { status }),
    withdraw: (id: string) => api.patch(`/applications/${id}/withdraw`),
    complete: (id: string) => api.patch(`/applications/${id}/complete`),
}

// Users API
export const usersApi = {
    get: (id: string) => api.get(`/users/${id}`),
    updateProfile: (data: any) => api.patch('/users/profile', data),
    updateLocation: (data: any) => api.patch('/users/location', data),
}

// Reviews API
export const reviewsApi = {
    create: (data: any) => api.post('/reviews', data),
    forUser: (userId: string) => api.get(`/reviews/user/${userId}`),
    canReview: (subjectId: string, jobId: string) =>
        api.get('/reviews/can-review', { params: { subjectId, jobId } }),
}

// Messages API
export const messagesApi = {
    conversations: () => api.get('/messages/conversations'),
    getConversation: (id: string, params?: any) =>
        api.get(`/messages/conversations/${id}`, { params }),
    send: (data: any) => api.post('/messages/send', data),
    unreadCount: () => api.get('/messages/unread-count'),
    startConversation: (data: any) => api.post('/messages/start-conversation', data),
}

// Skills API
export const skillsApi = {
    list: () => api.get('/skills'),
}

// Notifications API
export const notificationsApi = {
    list: (params?: any) => api.get('/notifications', { params }),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
}
