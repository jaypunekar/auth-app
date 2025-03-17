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
    let token = null;
    
    try {
      // Try direct localStorage access first for reliability
      token = localStorage.getItem('token');
      
      // Log token details for debugging
      if (token) {
        console.log('Token found in localStorage:', {
          length: token.length,
          firstChars: token.substring(0, 10) + '...',
          lastChars: '...' + token.substring(token.length - 10),
          hasThreeParts: token.split('.').length === 3
        });
      } else {
        console.log('No token found in localStorage');
      }
      
      // Check if token is valid
      if (token === 'undefined' || token === 'null' || !token) {
        console.warn('Invalid token found in localStorage:', token);
        // Don't clear token here, just log the issue
        token = null;
      } else if (!token.includes('.') || token.split('.').length !== 3) {
        console.warn('Token does not appear to be a valid JWT format:', {
          parts: token.split('.').length,
          containsDots: token.includes('.')
        });
        // Don't clear token here, just log the issue
        token = null;
      } else {
        // Try to parse the token to verify it's a valid JWT
        try {
          const [header, payload, signature] = token.split('.');
          const decodedPayload = JSON.parse(atob(payload));
          
          // Check if token is expired
          const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const isExpired = currentTime > expirationTime;
          
          if (isExpired) {
            console.warn('Token is expired:', {
              exp: new Date(expirationTime).toISOString(),
              now: new Date(currentTime).toISOString(),
              timeLeft: Math.floor((expirationTime - currentTime) / 1000) + ' seconds'
            });
            // Don't clear token here, just log the issue
            token = null;
          } else {
            console.log('Token is valid and not expired:', {
              exp: new Date(expirationTime).toISOString(),
              timeLeft: Math.floor((expirationTime - currentTime) / 1000) + ' seconds'
            });
          }
        } catch (parseError) {
          console.error('Error parsing JWT token:', parseError);
          // Don't clear token here, just log the issue
          token = null;
        }
      }
    } catch (error) {
      console.error('Error accessing token in interceptor:', error);
      // Fall back to utility function
      token = getToken();
    }
    
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
      
      // In production, redirect to login if not already there and not an auth endpoint
      if (process.env.NODE_ENV === 'production' && 
          !window.location.pathname.includes('/login') &&
          !config.url.includes('/auth/')) {
        console.log('Redirecting to login due to missing token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
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
      
      const token = response.data.access_token;
      
      // Validate token before storing
      if (!token || token === 'undefined' || token === undefined) {
        console.error('Invalid token received in response:', token);
        return response;
      }
      
      // Direct localStorage access for reliability
      try {
        localStorage.setItem('token', token);
        console.log('Token stored directly in localStorage from response interceptor');
        
        // Verify storage
        const storedToken = localStorage.getItem('token');
        console.log('Stored token verification in interceptor:', {
          length: storedToken ? storedToken.length : 0,
          preview: storedToken ? storedToken.substring(0, 10) + '...' : 'not stored',
          matches: storedToken === token
        });
        
        // Also store user info if available
        if (response.data.user_id) {
          localStorage.setItem('user_id', response.data.user_id);
        }
        if (response.data.email) {
          localStorage.setItem('user_email', response.data.email);
        }
      } catch (storageError) {
        console.error('Error storing token in localStorage from interceptor:', storageError);
      }
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
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      
      // Check if we're already on the login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        // Clear token and redirect to login
        logout();
        
        // Redirect to login
        console.log('Redirecting to login due to 401 error');
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
      
      // Log environment info
      console.log('API Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        isProduction: process.env.NODE_ENV === 'production'
      });
      
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
      console.log('Login response data:', JSON.stringify(response.data, null, 2));
      
      // Store the token in localStorage
      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        
        // Validate token
        if (!token || token === 'undefined' || token === undefined) {
          console.error('Invalid token received:', token);
          return response;
        }
        
        console.log('Token received, length:', token.length);
        console.log('Token first 10 chars:', token.substring(0, 10) + '...');
        
        // Direct localStorage access for reliability
        try {
          localStorage.setItem('token', token);
          console.log('Token stored directly in localStorage');
          
          // Verify storage
          const storedToken = localStorage.getItem('token');
          console.log('Stored token verification:', {
            length: storedToken ? storedToken.length : 0,
            preview: storedToken ? storedToken.substring(0, 10) + '...' : 'not stored',
            matches: storedToken === token
          });
          
          // Also store user info if available
          if (response.data.user_id) {
            localStorage.setItem('user_id', response.data.user_id);
          }
          if (response.data.email) {
            localStorage.setItem('user_email', response.data.email);
          }
        } catch (storageError) {
          console.error('Error storing token in localStorage:', storageError);
        }
        
        // Log auth state after login
        console.log('Auth debug after login:', debugAuth());
      } else {
        console.warn('No access_token found in login response. Response data:', JSON.stringify(response.data, null, 2));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', JSON.stringify(error.response.data, null, 2));
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