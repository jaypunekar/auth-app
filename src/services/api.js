import axios from 'axios';

// Format the base URL to ensure it ends with /api
const formatBaseUrl = (url) => {
  if (!url) return 'http://localhost:8000/api';
  return url.endsWith('/api') ? url : `${url}/api`;
};

// Create axios instance
const api = axios.create({
  baseURL: formatBaseUrl(process.env.REACT_APP_API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Keep this for local development
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // If the response includes a token, save it
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response;
  },
  (error) => {
    // Don't handle errors for auth endpoints
    const isAuthEndpoint = 
      error.config && (
        error.config.url.includes('/auth/token') || 
        error.config.url.includes('/auth/register') || 
        error.config.url.includes('/auth/google') ||
        error.config.url.includes('/auth/me')
      );
    
    // Handle 401 Unauthorized errors for non-auth endpoints
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      console.error('Unauthorized access detected:', error.config.url);
      
      // Check if we're already on the login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        // Clear token
        localStorage.removeItem('token');
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email, password) => api.post('/auth/register', { email, password }),
  login: (email, password) => api.post('/auth/token', 
    new URLSearchParams({
      'username': email,
      'password': password
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  ),
  googleLogin: (token) => api.post('/auth/google', { token }),
  getUser: () => api.get('/auth/me'),
};

// Chat API
export const chatAPI = {
  startChat: () => api.post('/chat/start'),
  sendMessage: (sessionId, content) => api.post(`/chat/send/${sessionId}`, { content }),
  getChatHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
  getChatSessions: () => api.get('/chat/sessions'),
};

// Ad Campaign API
export const adCampaignAPI = {
  createCampaign: (campaign) => api.post('/ads', campaign),
  createCampaignWithImage: (formData) => api.post('/ads/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getCampaigns: (platform, status) => {
    let url = '/ads';
    const params = {};
    
    if (platform) params.platform = platform;
    if (status) params.status = status;
    
    return api.get(url, { params });
  },
  getCampaign: (id) => api.get(`/ads/${id}`),
  updateCampaign: (id, campaign) => {
    // Check if campaign is FormData (has image) or regular object
    if (campaign instanceof FormData) {
      return api.put(`/ads/${id}/upload`, campaign, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return api.put(`/ads/${id}`, campaign);
  },
  deleteCampaign: (id) => api.delete(`/ads/${id}`),
  generateImage: (id) => api.post(`/ads/${id}/generate-image`),
};

// Calendar API
export const calendarAPI = {
  createEntry: (entry) => api.post('/calendar', entry),
  getEntries: () => api.get('/calendar'),
  getEntriesByCampaign: (campaignId) => api.get(`/calendar/campaign/${campaignId}`),
  getEntry: (id) => api.get(`/calendar/${id}`),
  updateEntry: (id, entry) => api.put(`/calendar/${id}`, entry),
  deleteEntry: (id) => api.delete(`/calendar/${id}`),
  generateCalendar: (request) => api.post('/calendar/generate', request),
};

// Google Ads API
export const googleAdsAPI = {
  linkAccount: (data) => api.post('/google-ads/link-account', data),
  getAccountStatus: () => api.get('/google-ads/account-status'),
  createCampaign: (data) => api.post('/google-ads/create-campaign', data),
  getCampaigns: () => api.get('/google-ads/campaigns'),
  updateCampaign: (campaignId, data) => api.put(`/google-ads/campaigns/${campaignId}`, data),
};

export default api; 