import api from './api';
import type { User, Service, Job, Bid, Review, Payment, Conversation, Message, BidSuggestion } from '../types';

export const authApi = {
  signup: (data: { name: string; email: string; password: string; role: string; bio?: string; skills?: string[] }) =>
    api.post<{ user: User; token: string }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getById: (id: string) => api.get<User & { services?: Service[]; reviewsReceived?: Review[] }>(`/users/${id}`),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
};

export const serviceApi = {
  getAll: (params?: Record<string, string>) => api.get<Service[]>('/services', { params }),
  getById: (id: string) => api.get<Service>(`/services/${id}`),
  create: (data: Partial<Service>) => api.post<Service>('/services', data),
  update: (id: string, data: Partial<Service>) => api.put<Service>(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const jobApi = {
  getAll: (params?: Record<string, string>) => api.get<Job[]>('/jobs', { params }),
  getById: (id: string) => api.get<Job>(`/jobs/${id}`),
  create: (data: Partial<Job>) => api.post<Job>('/jobs', data),
  updateStatus: (id: string, status: string) => api.patch<Job>(`/jobs/${id}/status`, { status }),
};

export const bidApi = {
  getAll: (params?: Record<string, string>) => api.get<Bid[]>('/bids', { params }),
  create: (data: { jobId: string; proposal: string; quote: number; deliveryDays: number }) =>
    api.post<Bid>('/bids', data),
  accept: (id: string) => api.patch<Bid>(`/bids/${id}/accept`),
  reject: (id: string) => api.patch<Bid>(`/bids/${id}/reject`),
};

export const reviewApi = {
  getAll: (params?: Record<string, string>) => api.get<Review[]>('/reviews', { params }),
  create: (data: { revieweeId: string; rating: number; comment: string }) =>
    api.post<Review>('/reviews', data),
};

export const paymentApi = {
  getAll: (params?: Record<string, string>) => api.get<Payment[]>('/payments', { params }),
  mockCheckout: (paymentId: string) => api.post('/payments/mock-checkout', { paymentId }),
  mockComplete: (paymentId: string) => api.post('/payments/mock-complete', { paymentId }),
};

export const messageApi = {
  getConversations: () => api.get<Conversation[]>('/messages/conversations'),
  createConversation: (participantId: string) =>
    api.post<Conversation>('/messages/conversations', { participantId }),
  getMessages: (conversationId: string) =>
    api.get<Message[]>(`/messages/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, text: string) =>
    api.post<Message>(`/messages/conversations/${conversationId}/messages`, { text }),
};

export const recommendationApi = {
  getJobMatches: () => api.get<Job[]>('/recommendations/jobs'),
  getBidSuggestion: (jobId: string) => api.get<BidSuggestion>(`/recommendations/bid/${jobId}`),
};
