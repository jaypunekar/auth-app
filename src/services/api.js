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
  getEntries: async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Log token status for debugging
      console.log('Calendar API - Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 'No token'
      });

      if (!token) {
        console.error('No token found for calendar API call');
        throw new Error('No valid token');
      }

      // Make the request using the axios instance which already handles auth headers
      const response = await api.get('/calendar');
      
      if (!response || !response.data) {
        throw new Error('Invalid response from calendar API');
      }
      
      // Transform the response data
      const transformedData = await Promise.all(response.data.map(async entry => {
        let campaignDetails = {
          title: entry.ad_campaign_title || 'Unknown Campaign',
          platform: entry.ad_campaign_platform || 'Unknown Platform',
          budget: '10.00',
          budget_type: 'Daily'
        };

        // Fetch campaign details if available
        if (entry.ad_campaign_id) {
          try {
            const campaignResponse = await adCampaignAPI.getCampaign(entry.ad_campaign_id);
            if (campaignResponse.data) {
              campaignDetails = {
                ...campaignDetails,
                ...campaignResponse.data
              };
            }
          } catch (err) {
            console.error(`Error fetching campaign details for ID ${entry.ad_campaign_id}:`, err);
          }
        }

        // Parse ad copy
        const parsedAdCopy = parseAdCopy(entry.ad_copy, campaignDetails.platform_data);

        return {
          ...entry,
          ...parsedAdCopy,
          campaign: campaignDetails
        };
      }));

      return { ...response, data: transformedData };
    } catch (error) {
      console.error('Calendar API Error:', error);
      if (error.response?.status === 401) {
        // Don't throw here, let the component handle the 401
        return { data: [], error: 'Unauthorized' };
      }
      throw error;
    }
  },
  getEntriesByCampaign: (campaignId) => api.get(`/calendar/campaign/${campaignId}`),
  getEntry: (id) => api.get(`/calendar/${id}`),
  updateEntry: (id, entry) => api.put(`/calendar/${id}`, entry),
  deleteEntry: (id) => api.delete(`/calendar/${id}`),
  generateCalendar: (request) => api.post('/calendar/generate', request),
};

const parseAdCopy = (adCopy, platformData = null) => {
  const parsedData = {
    part: '',
    phase: '',
    title: '',
    headline: '',
    description: '',
    cta: '',
    date_range: ''
  };

  // First check platform_data
  if (platformData) {
    try {
      const data = typeof platformData === 'string' ? JSON.parse(platformData) : platformData;
      if (data.headlines?.length > 0) parsedData.headline = data.headlines[0];
      if (data.unique_title) parsedData.title = data.unique_title;
      if (data.descriptions?.length > 0) parsedData.description = data.descriptions[0];
      if (data.phase) parsedData.phase = data.phase.toUpperCase();
    } catch (err) {
      console.error('Error parsing platform_data:', err);
    }
  }

  // Then parse ad_copy
  if (adCopy) {
    try {
      if (adCopy.startsWith('{')) {
        const data = JSON.parse(adCopy);
        parsedData.headline = data.headline || parsedData.headline;
        parsedData.description = data.description || parsedData.description;
        parsedData.cta = data.cta || parsedData.cta;
        parsedData.title = data.title || parsedData.title;
        parsedData.part = data.part ? `Part ${data.part}` : parsedData.part;
        parsedData.phase = data.phase || parsedData.phase;
        parsedData.date_range = data.date_range || parsedData.date_range;
      } else {
        // Parse using regex
        const matches = {
          title: adCopy.match(/Title:\s*(.*?)(\n|$)/s),
          headline: adCopy.match(/Headline:\s*(.*?)(\n|$)/s),
          description: adCopy.match(/Description:\s*(.*?)(\n|$)/s),
          cta: adCopy.match(/CTA:\s*(.*?)(\n|$)/s),
          part: adCopy.match(/Part\s+\d+:\s*(.*?)(\n|$)/s),
          duration: adCopy.match(/Duration:\s*(.*?)(\n|$)/s)
        };

        if (matches.title) parsedData.title = matches.title[1].trim();
        if (matches.headline) parsedData.headline = matches.headline[1].trim();
        if (matches.description) parsedData.description = matches.description[1].trim();
        if (matches.cta) parsedData.cta = matches.cta[1].trim();
        if (matches.part) {
          parsedData.part = matches.part[0].trim();
          if (matches.part[1]) parsedData.phase = matches.part[1].trim();
        }
        if (matches.duration) parsedData.date_range = matches.duration[1].trim();
      }
    } catch (err) {
      console.error('Error parsing ad_copy:', err);
    }
  }

  // Set phase based on part number if not already set
  if (!parsedData.phase && parsedData.part) {
    if (parsedData.part.includes('Part 1')) parsedData.phase = 'AWARENESS';
    else if (parsedData.part.includes('Part 2')) parsedData.phase = 'CONSIDERATION';
    else if (parsedData.part.includes('Part 3')) parsedData.phase = 'CONVERSION';
  }

  // Use headline as title if title is missing
  if (!parsedData.title && parsedData.headline) {
    parsedData.title = parsedData.headline;
  }

  return parsedData;
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