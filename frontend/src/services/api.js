import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Admin API
export const adminAPI = {
  createHostel: (data) => api.post('/admin/hostels', data),
  getHostels: () => api.get('/admin/hostels'),
  createUser: (data) => api.post('/admin/users', data),
  createRoomType: (data) => api.post('/admin/room-types', data),
  createRoom: (data) => api.post('/admin/rooms', data),
  createSession: (data) => api.post('/admin/sessions', data),
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
};

// Warden API
export const wardenAPI = {
  enrollStudent: (data) => api.post('/warden/students', data),
  getStudents: () => api.get('/warden/students'),
  getAvailableRooms: () => api.get('/warden/available-rooms'),
  allotRoom: (data) => api.post('/warden/room-allotment', data),
  getDashboardStats: () => api.get('/warden/dashboard-stats'),
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  getMessBills: () => api.get('/student/mess-bills'),
};

// Mess API
export const messAPI = {
  createMenu: (data) => api.post('/mess/menus', data),
  getMenus: () => api.get('/mess/menus'),
  generateMessBills: (data) => api.post('/mess/bills/generate', data),
  getMessBills: () => api.get('/mess/bills'),
};

export default api;
