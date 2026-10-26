/**
 * Central API client.
 * All backend calls go through this module.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('samic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('samic_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Commodities ─────────────────────────────────────────────────────────────
export const commodityApi = {
  list: () => api.get('/commodities'),
  get: (id) => api.get(`/commodities/${id}`),
  create: (data) => api.post('/commodities', data),
  update: (id, data) => api.patch(`/commodities/${id}`, data),
  deactivate: (id) => api.delete(`/commodities/${id}`),
};

// ── Markets ─────────────────────────────────────────────────────────────────
export const marketApi = {
  list: () => api.get('/markets'),
  get: (id) => api.get(`/markets/${id}`),
  create: (data) => api.post('/markets', data),
  update: (id, data) => api.patch(`/markets/${id}`, data),
  deactivate: (id) => api.delete(`/markets/${id}`),
};

// ── Prices ──────────────────────────────────────────────────────────────────
export const priceApi = {
  submit: (data) => api.post('/prices', data),
  list: (params) => api.get('/prices', { params }),
  compare: (params) => api.get('/prices/compare', { params }),
  review: (id, data) => api.patch(`/prices/${id}/review`, data),
};

// ── Anomalies ───────────────────────────────────────────────────────────────
export const anomalyApi = {
  list: (params) => api.get('/anomalies', { params }),
};

// ── Suppliers ───────────────────────────────────────────────────────────────
export const supplierApi = {
  rank: (params) => api.get('/suppliers/rank', { params }),
};

// ── Orders ──────────────────────────────────────────────────────────────────
export const orderApi = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  transition: (id, data) => api.patch(`/orders/${id}/status`, data),
};

// ── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: (params) => api.get('/inventory', { params }),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.patch(`/inventory/${id}`, data),
};

// ── Batches ─────────────────────────────────────────────────────────────────
export const batchApi = {
  list: (params) => api.get('/batches', { params }),
  create: (data) => api.post('/batches', data),
  trace: (id) => api.get(`/batches/${id}/trace`),
};

// ── Deliveries ──────────────────────────────────────────────────────────────
export const deliveryApi = {
  list: (params) => api.get('/deliveries', { params }),
  create: (data) => api.post('/deliveries', data),
  updateStatus: (id, data) => api.patch(`/deliveries/${id}/status`, data),
};

// ── Transactions ────────────────────────────────────────────────────────────
export const transactionApi = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  updateStatus: (id, data) => api.patch(`/transactions/${id}/status`, data),
};

// ── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};

// ── Reports ─────────────────────────────────────────────────────────────────
export const reportApi = {
  marketSummary: (params) => api.get('/reports/market-summary', { params }),
  supplyDemand: (params) => api.get('/reports/supply-demand', { params }),
};

// ── Users (Admin) ───────────────────────────────────────────────────────────
export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  setStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  setReviewScope: (id, reviewScope) => api.patch(`/users/${id}/review-scope`, { reviewScope }),
  updateProfile: (id, data) => api.patch(`/users/${id}/profile`, data),
  changePassword: (id, data) => api.patch(`/users/${id}/password`, data),
};

export default api;
