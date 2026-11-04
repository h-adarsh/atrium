import {
  User,
  Society,
  MaintenanceConfig,
  MaintenanceDue,
  Expense,
  Complaint,
  Notice,
  FlatItem,
  FinancialSummary,
  Feedback,
  FeedbackSummary
} from '../types';

export const API_ORIGIN = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_ORIGIN}/api/v1`;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('atrium_token') || localStorage.getItem('mygate_token');
}

export function getFileUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const token = getAuthToken();
  const base = `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  if (!token) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

export function getReceiptUrl(receiptNumber: string): string {
  const token = getAuthToken();
  return `${BASE_URL}/finance/receipts/${encodeURIComponent(receiptNumber)}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (data: {
      fullName: string;
      email: string;
      phone: string;
      unitNumber: string;
      superBuiltUpSqFt?: number;
      occupancyType: 'OWNER' | 'TENANT';
      occupantCount: number;
      password: string;
      passwordConfirmation?: string;
      societyId?: string;
      societySlug?: string;
    }) =>
      request<{ success: boolean; message: string; user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    logout: () =>
      request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    me: () =>
      request<{ success: boolean; user: User }>('/auth/me'),
    updateProfile: (data: { fullName?: string; phone?: string }) =>
      request<{ success: boolean; message: string; user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getBuildingUnits: (societySlug?: string) =>
      request<{
        success: boolean;
        society?: Society | null;
        floors: Array<{ floor: number; units: string[] }>;
      }>(`/auth/building-units${societySlug ? `?societySlug=${encodeURIComponent(societySlug)}` : ''}`),
    cancelPendingRegistration: () =>
      request<{ success: boolean; message: string }>('/auth/pending-registration', { method: 'DELETE' }),
    getPendingRegistrations: () =>
      request<{
        success: boolean;
        registrations: Array<User & { flat?: any; createdAt?: string }>;
      }>('/auth/admin/pending-registrations'),
    reviewRegistration: (userId: string, action: 'APPROVE' | 'REJECT') =>
      request<{ success: boolean; message: string }>(`/auth/admin/registrations/${userId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action })
      }),
    getDemoAccounts: () =>
      request<{
        success: boolean;
        accounts: Array<{
          email: string;
          fullName: string;
          role: string;
          unitNumber?: string | null;
          defaultPassword: string;
        }>;
      }>('/auth/demo-accounts')
  },

  // Flats
  flats: {
    getAll: () =>
      request<{ success: boolean; flats: FlatItem[] }>('/flats'),
    getById: (id: string) =>
      request<{ success: boolean; flat: FlatItem }>('/flats/' + id),
    update: (id: string, data: any) =>
      request<{ success: boolean; flat: FlatItem }>('/flats/' + id, {
        method: 'PATCH',
        body: JSON.stringify(data)
      })
  },

  // Finance
  finance: {
    getConfig: () =>
      request<{ success: boolean; config: MaintenanceConfig }>('/finance/config'),
    updateConfig: (data: Partial<MaintenanceConfig>) =>
      request<{ success: boolean; config: MaintenanceConfig }>('/finance/config', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    getDues: (params?: { period?: string; flatId?: string }) => {
      const q = new URLSearchParams();
      if (params?.period) q.set('period', params.period);
      if (params?.flatId) q.set('flatId', params.flatId);
      return request<{ success: boolean; dues: MaintenanceDue[] }>(`/finance/dues?${q.toString()}`);
    },
    generateMonthlyDues: (billingPeriod: string) =>
      request<{ success: boolean; message: string; count: number }>('/finance/dues/generate', {
        method: 'POST',
        body: JSON.stringify({ billingPeriod })
      }),
    submitPayment: (formData: FormData) =>
      request<{ success: boolean; payment: any; message: string }>('/finance/payments/submit', {
        method: 'POST',
        body: formData
      }),
    verifyPayment: (paymentId: string, data: { status: 'VERIFIED' | 'REJECTED'; rejectionReason?: string }) =>
      request<{ success: boolean; message: string }>('/finance/payments/' + paymentId + '/verify', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    downloadReceipt: async (receiptNumber: string): Promise<void> => {
      const token = getAuthToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BASE_URL}/finance/receipts/${encodeURIComponent(receiptNumber)}`, {
        headers,
        credentials: 'include'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to download receipt');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    getExpenses: (params?: { category?: string; month?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.month) q.set('month', params.month);
      return request<{ success: boolean; expenses: Expense[] }>(`/finance/expenses?${q.toString()}`);
    },
    createExpense: (formData: FormData) =>
      request<{ success: boolean; expense: Expense }>('/finance/expenses', {
        method: 'POST',
        body: formData
      }),
    deleteExpense: (id: string) =>
      request<{ success: boolean; message: string }>('/finance/expenses/' + id, {
        method: 'DELETE'
      }),
    getSummary: (period?: string) =>
      request<{ success: boolean; summary: FinancialSummary }>(`/finance/summary?period=${period || '2026-10'}`)
  },

  // Complaints
  complaints: {
    getAll: (params?: { status?: string; category?: string; priority?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.category) q.set('category', params.category);
      if (params?.priority) q.set('priority', params.priority);
      return request<{ success: boolean; complaints: Complaint[] }>(`/complaints?${q.toString()}`);
    },
    create: (formData: FormData) =>
      request<{ success: boolean; complaint: Complaint; message: string }>('/complaints', {
        method: 'POST',
        body: formData
      }),
    update: (id: string, formData: FormData) =>
      request<{ success: boolean; complaint: Complaint; message: string }>(`/complaints/${id}`, {
        method: 'PATCH',
        body: formData
      })
  },

  // Notices
  notices: {
    getAll: () =>
      request<{ success: boolean; notices: Notice[] }>('/notices'),
    create: (data: { title: string; content: string; category: string; priority: string; pinned: boolean }) =>
      request<{ success: boolean; notice: Notice }>('/notices', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    togglePin: (id: string) =>
      request<{ success: boolean; notice: Notice; message: string }>(`/notices/${id}/toggle-pin`, {
        method: 'PATCH'
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>('/notices/' + id, {
        method: 'DELETE'
      })
  },

  // Feedback
  feedback: {
    submit: (data: {
      rating: number;
      category: 'BUG' | 'FEATURE_REQUEST' | 'USABILITY' | 'GENERAL';
      message: string;
      page?: string;
      deviceInfo?: string;
      name?: string;
      email?: string;
    }) =>
      request<{ success: boolean; feedback: Feedback; message: string }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getAll: (params?: { category?: string; minRating?: number }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.minRating) q.set('minRating', String(params.minRating));
      return request<{
        success: boolean;
        summary: FeedbackSummary;
        feedbacks: Feedback[];
      }>(`/feedback?${q.toString()}`);
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/feedback/${id}`, {
        method: 'DELETE'
      })
  },

  // Societies
  societies: {
    getAll: () =>
      request<{ success: boolean; societies: Society[] }>('/societies'),
    getBySlug: (slug: string) =>
      request<{ success: boolean; society: Society }>('/societies/' + slug),
    create: (data: any) =>
      request<{ success: boolean; society: Society; message: string }>('/societies', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};
