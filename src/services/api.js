import axios from 'axios';
import { getToken, storeToken, logout, debugAuth } from '../utils/auth';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Only use credentials (cookies) in development, not in production
  withCredentials: !isProduction,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get the token using the utility function
    const token = getToken();
    
    console.log('Request to:', config.url);
    console.log('Token available:', !!token);
    
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token first 10 chars:', token.substring(0, 10) + '...');
      
      // Add the token to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Log the full header for debugging
      console.log('Authorization header:', config.headers['Authorization']);
    } else {
      console.warn('No valid token found');
      
      // Log auth debug info
      console.log('Auth debug:', debugAuth());
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
    // If the response includes a token, store it
    if (response.data && response.data.access_token) {
      console.log('Token received in response, storing it');
      storeToken(response.data.access_token);
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
        // Clear token and redirect to login
        logout();
        
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
  login: async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      
      const response = await api.post('/auth/token', 
        new URLSearchParams({
          'username': email,
          'password': password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Login response received:', response.status);
      console.log('Login response data keys:', Object.keys(response.data));
      
      // Store the token in localStorage
      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        console.log('Token received, length:', token.length);
        console.log('Token first 10 chars:', token.substring(0, 10) + '...');
        
        // Store the token using the utility function
        const stored = storeToken(token);
        console.log('Token stored successfully:', stored);
        
        // Verify it was stored correctly
        console.log('Auth debug after login:', debugAuth());
        
        // Also store user info if available
        if (response.data.user_id) {
          localStorage.setItem('user_id', response.data.user_id);
        }
        if (response.data.email) {
          localStorage.setItem('user_email', response.data.email);
        }
      } else {
        console.warn('No access_token found in login response. Response data:', response.data);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
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