import axios from 'axios';
import { getToken, storeToken, logout, debugAuth } from '../utils/auth';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Log API configuration for debugging
console.log('🔄 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  isProduction,
  defaultURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
});

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Only use credentials (cookies) in development, not in production
  withCredentials: !isProduction,
});

// Make the api instance available globally for debugging
window._api = api;

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
        token = null;
      } else if (!token.includes('.') || token.split('.').length !== 3) {
        console.warn('Token does not appear to be a valid JWT format:', {
          parts: token.split('.').length,
          containsDots: token.includes('.')
        });
        token = null;
      } else {
        // Try to parse the token to verify it's a valid JWT
        try {
          const [headerPart, payloadPart, signaturePart] = token.split('.');
          const decodedPayload = JSON.parse(atob(payloadPart));
          
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
            token = null;
            localStorage.removeItem('token'); // Remove expired token
          } else {
            console.log('Token is valid and not expired:', {
              exp: new Date(expirationTime).toISOString(),
              timeLeft: Math.floor((expirationTime - currentTime) / 1000) + ' seconds'
            });
          }
        } catch (parseError) {
          console.error('Error parsing JWT token:', parseError);
          token = null;
        }
      }
    } catch (error) {
      console.error('Error accessing token in interceptor:', error);
      token = null;
    }
    
    // Only redirect to login if we're not already on the login page and not making an auth request
    const isAuthRequest = config.url.includes('/auth/');
    const isLoginPage = window.location.pathname.includes('/login');
    
    if (!token && !isAuthRequest && !isLoginPage) {
      console.log('No valid token found, redirecting to login');
      window.location.href = '/login';
      return Promise.reject('No valid token');
    }
    
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
    // If the response includes a token, store it
    if (response.data && response.data.access_token) {
      console.log('Token received in response, storing it');
      
      const token = response.data.access_token;
      
      // Validate token before storing
      if (!token || token === 'undefined' || token === undefined) {
        console.error('Invalid token received in response:', token);
        return response;
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
      
      // Also store user info if available
      if (response.data.user_id) {
        localStorage.setItem('user_id', response.data.user_id);
      }
      if (response.data.email) {
        localStorage.setItem('user_email', response.data.email);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only handle 401 errors for non-auth endpoints
      const isAuthEndpoint = error.config.url.includes('/auth/');
      const isLoginPage = window.location.pathname.includes('/login');
      
      if (!isAuthEndpoint && !isLoginPage) {
        console.error('Unauthorized access detected:', error.config.url);
        localStorage.removeItem('token');
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
  googleLogin: (token, userId = null) => api.post('/auth/google', { token, userId }),
  getUser: () => api.get('/auth/me'),
};

// Chat API
export const chatAPI = {
  startChat: () => api.post('/chat/start'),
  sendMessage: (sessionId, content) => api.post(`/chat/send/${sessionId}`, { content }),
  getChatHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
  getChatSessions: () => api.get('/chat/sessions'),
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (messageId, isPositive) => 
    api.post('/feedback', { message_id: messageId, is_positive: isPositive }),
  getLikedMessages: () => api.get('/feedback/liked'),
  getDislikedMessages: () => api.get('/feedback/disliked'),
  getAllFeedback: () => api.get('/feedback/all'),
  deleteFeedback: (feedbackId) => api.delete(`/feedback/${feedbackId}`),
};

// Ad Campaign API
export const adCampaignAPI = {
  createCampaign: (campaign) => api.post('/ads', campaign),
  createCampaignWithImage: (formData) => api.post('/ads/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getCampaigns: (platform, status, includeDeleted = false) => {
    let url = '/ads';
    const params = {};
    
    if (platform) params.platform = platform;
    if (status) params.status = status;
    if (includeDeleted) params.include_deleted = true;
    
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

// Google Ads API
export const googleAdsAPI = {
  getAccountStatus: async () => {
    try {
      console.log('Fetching Google Ads account status...');
      const response = await api.get('/google-ads/account-status');
      console.log('Google Ads account status response:', response.data);
      return response;
    } catch (error) {
      console.error('Error getting Google Ads account status:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  linkAccount: async (data) => {
    try {
      console.log('Linking Google Ads account with data:', data);
      const response = await api.post('/google-ads/link-account', data);
      console.log('Google Ads account linking response:', response.data);
      return response;
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  createCampaign: async (campaignData) => {
    try {
      console.log('Creating Google Ads campaign with data:', campaignData);
      const response = await api.post('/google-ads/create-campaign', campaignData);
      console.log('Google Ads campaign creation response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating Google Ads campaign:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  getCampaigns: async () => {
    try {
      console.log('Fetching Google Ads campaigns...');
      const response = await api.get('/google-ads/campaigns');
      console.log('Google Ads campaigns response:', response.data);
      return response;
    } catch (error) {
      console.error('Error getting Google Ads campaigns:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  updateCampaign: async (campaignId, campaignData) => {
    try {
      console.log(`Updating Google Ads campaign ${campaignId} with data:`, campaignData);
      const response = await api.put(`/google-ads/campaigns/${campaignId}`, campaignData);
      console.log('Google Ads campaign update response:', response.data);
      return response;
    } catch (error) {
      console.error(`Error updating Google Ads campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  deleteCampaign: async (campaignId) => {
    try {
      console.log(`Deleting Google Ads campaign ${campaignId}`);
      const response = await api.delete(`/google-ads/campaigns/${campaignId}`);
      console.log('Google Ads campaign delete response:', response.data);
      return response;
    } catch (error) {
      console.error(`Error deleting Google Ads campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  getResponsiveSearchAds: async (campaignId, adGroupId = null) => {
    try {
      console.log(`Fetching responsive search ads for campaign ${campaignId}...`);
      const url = adGroupId 
        ? `/google-ads/responsive-search-ads?campaign_id=${campaignId}&ad_group_id=${adGroupId}`
        : `/google-ads/responsive-search-ads?campaign_id=${campaignId}`;
      
      const response = await api.get(url);
      console.log('Responsive search ads response:', response.data);
      return response;
    } catch (error) {
      console.error(`Error getting responsive search ads for campaign ${campaignId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
  
  updateResponsiveSearchAd: async (adId, adData) => {
    try {
      console.log(`Updating responsive search ad ${adId} with data:`, adData);
      
      // Ensure headlines and descriptions are properly formatted
      const headlines = adData.headlines.map(h => ({
        text: h.text || "",
        pinnedField: h.pinnedField || null
      })).filter(h => h.text && h.text.trim() !== "");
      
      const descriptions = adData.descriptions.map(d => ({
        text: d.text || "",
        pinnedField: d.pinnedField || null
      })).filter(d => d.text && d.text.trim() !== "");
      
      // Ensure finalUrl is properly formatted
      let finalUrl = adData.finalUrl || "";
      if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = "https://" + finalUrl;
      }
      
      // Format the data according to the backend's ResponsiveSearchAdUpdate model
      const requestData = {
        ad_id: adId,
        headlines: headlines,
        descriptions: descriptions,
        finalUrl: finalUrl
      };
      
      console.log('Sending formatted request data:', JSON.stringify(requestData, null, 2));
      
      const response = await api.put(`/google-ads/responsive-search-ad`, requestData);
      console.log('Responsive search ad update response:', response.data);
      return response;
    } catch (error) {
      console.error(`Error updating responsive search ad ${adId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        console.error('Error headers:', error.response.headers);
        console.error('Request that caused the error:', error.config);
      }
      throw error;
    }
  },
  
  updateAdSimple: async (adId, adData) => {
    try {
      console.log(`Using simplified update for ad ${adId} with data:`, adData);
      
      // Format the data for the simplified endpoint
      const requestData = {
        adId: adId,
        headlines: adData.headlines.map(h => ({
          text: h.text || "",
          pinnedField: h.pinnedField || null
        })).filter(h => h.text && h.text.trim() !== ""),
        descriptions: adData.descriptions.map(d => ({
          text: d.text || "",
          pinnedField: d.pinnedField || null
        })).filter(d => d.text && d.text.trim() !== ""),
        finalUrl: adData.finalUrl || ""
      };
      
      console.log('Sending simplified request data:', JSON.stringify(requestData, null, 2));
      
      const response = await api.post(`/google-ads/update-ad-simple`, requestData);
      console.log('Simplified ad update response:', response.data);
      return response;
    } catch (error) {
      console.error(`Error with simplified ad update for ${adId}:`, error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        console.error('Error headers:', error.response.headers);
        console.error('Request that caused the error:', error.config);
      }
      throw error;
    }
  },

  // Get campaign performance data
  getCampaignPerformance: async (campaignId = null) => {
    try {
      console.log('Fetching Google Ads campaign performance data...');
      let url = '/google-ads/campaign-performance';
      
      // Add campaign_id as query parameter if provided
      const params = {};
      if (campaignId) {
        params.campaign_id = campaignId;
      }
      
      const response = await api.get(url, { params });
      console.log('Google Ads campaign performance data:', response.data);
      return response;
    } catch (error) {
      console.error('Error getting Google Ads campaign performance:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      throw error;
    }
  },
};

// Add a new API service for image generation
export const imageAPI = {
  generateImage: (prompt) => {
    return api.post('/images/generate', { prompt });
  },
  
  getImages: () => {
    return api.get('/images/list');
  }
};

// Export all API services - don't export imageAPI here, as it's already exported above
export {
  // ... existing exports
};

export default api; 