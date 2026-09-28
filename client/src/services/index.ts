import api from './api';
import type {
  User,
  Service,
  Job,
  Bid,
  Review,
  Payment,
  Conversation,
  Message,
  BidSuggestion,
  Paginated,
  AdminUser,
  AdminUserDetail,
  AdminStats,
  AdminJob,
  AdminService,
  AdminReview,
  AdminPayment,
  AuditLog,
} from '../types';

export const authApi = {
  signup: (
    data: {
      name: string;
      email: string;
      password: string;
      role: string;
      bio?: string;
      skills?: string[];
    }
  ) => api.post<{ user: User; token: string }>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),

  me: () => api.get<User>('/auth/me'),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post<{ message: string }>('/auth/reset-password', data),
};

export const userApi = {
  getById: (id: string) =>
    api.get<User & { services?: Service[]; reviewsReceived?: Review[] }>(
      `/users/${id}`
    ),

  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),

  deleteAccount: (password: string) =>
    api.delete<{ message: string }>('/users/me', {
      data: { password },
    }),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) =>
    api.put<{ message: string }>('/users/me/password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    return api.post<User>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  removeAvatar: () =>
    api.delete<User>('/users/me/avatar'),
};

export const serviceApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Service[]>('/services', { params }),

  getById: (id: string) =>
    api.get<Service>(`/services/${id}`),

  create: (data: Partial<Service>) =>
    api.post<Service>('/services', data),

  update: (id: string, data: Partial<Service>) =>
    api.put<Service>(`/services/${id}`, data),

  delete: (id: string) =>
    api.delete(`/services/${id}`),
};

export const jobApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Job[]>('/jobs', { params }),

  getById: (id: string) =>
    api.get<Job>(`/jobs/${id}`),

  create: (data: Partial<Job>) =>
    api.post<Job>('/jobs', data),

  updateStatus: (id: string, status: string) =>
    api.patch<Job>(`/jobs/${id}/status`, { status }),
};

export const bidApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Bid[]>('/bids', { params }),

  create: (data: {
    jobId: string;
    proposal: string;
    quote: number;
    deliveryDays: number;
  }) => api.post<Bid>('/bids', data),

  accept: (id: string) =>
    api.patch<Bid>(`/bids/${id}/accept`),

  reject: (id: string) =>
    api.patch<Bid>(`/bids/${id}/reject`),
};

export const reviewApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Review[]>('/reviews', { params }),

  create: (data: {
    revieweeId: string;
    rating: number;
    comment: string;
  }) => api.post<Review>('/reviews', data),
};

export const paymentApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<Payment[]>('/payments', { params }),

  mockCheckout: (paymentId: string) =>
    api.post('/payments/mock-checkout', { paymentId }),

  mockComplete: (paymentId: string) =>
    api.post('/payments/mock-complete', { paymentId }),
};

export const messageApi = {
  getConversations: () =>
    api.get<Conversation[]>('/messages/conversations'),

  createConversation: (participantId: string) =>
    api.post<Conversation>('/messages/conversations', {
      participantId,
    }),

  getMessages: (conversationId: string) =>
    api.get<Message[]>(
      `/messages/conversations/${conversationId}/messages`
    ),

  sendMessage: (conversationId: string, text: string) =>
    api.post<Message>(
      `/messages/conversations/${conversationId}/messages`,
      { text }
    ),
};

export const recommendationApi = {
  getJobMatches: () =>
    api.get<Job[]>('/recommendations/jobs'),

  getBidSuggestion: (jobId: string) =>
    api.get<BidSuggestion>(
      `/recommendations/bid/${jobId}`
    ),
};

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),

  // Users
  getUsers: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminUser>>('/admin/users', { params }),

  getUser: (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`),

  createUser: (data: {
    name: string;
    email: string;
    password: string;
    role: 'CLIENT' | 'FREELANCER';
    bio?: string;
    skills?: string[];
  }) => api.post<AdminUser>('/admin/users', data),

  updateUser: (
    id: string,
    data: { name?: string; email?: string; bio?: string | null; skills?: string[]; role?: 'CLIENT' | 'FREELANCER' }
  ) => api.put<AdminUser>(`/admin/users/${id}`, data),

  suspendUser: (id: string, reason?: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/suspend`, { reason }),

  unsuspendUser: (id: string) => api.patch<AdminUser>(`/admin/users/${id}/unsuspend`),

  resetUserPassword: (id: string, newPassword: string) =>
    api.post<{ message: string }>(`/admin/users/${id}/reset-password`, { newPassword }),

  deleteUser: (id: string, force = false) =>
    api.delete<{ message: string }>(`/admin/users/${id}`, { params: force ? { force: 'true' } : undefined }),

  bulkUsers: (data: { action: 'suspend' | 'unsuspend' | 'delete'; userIds: string[]; reason?: string }) =>
    api.post<{ action: string; requested: number; affected: number; skipped: number }>('/admin/users/bulk', data),

  exportUsers: (params?: Record<string, string>) =>
    api.get<Blob>('/admin/users/export', { params, responseType: 'blob' }),

  // Jobs
  getJobs: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminJob>>('/admin/jobs', { params }),
  updateJobStatus: (id: string, status: string) =>
    api.patch(`/admin/jobs/${id}/status`, { status }),
  deleteJob: (id: string) => api.delete(`/admin/jobs/${id}`),

  // Services
  getServices: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminService>>('/admin/services', { params }),
  deleteService: (id: string) => api.delete(`/admin/services/${id}`),

  // Reviews
  getReviews: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminReview>>('/admin/reviews', { params }),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),

  // Payments
  getPayments: (params?: Record<string, string | number>) =>
    api.get<Paginated<AdminPayment> & { totals: { amount: number; commission: number } }>(
      '/admin/payments',
      { params }
    ),

  // Audit log
  getAuditLogs: (params?: Record<string, string | number>) =>
    api.get<Paginated<AuditLog>>('/admin/audit-logs', { params }),
};
