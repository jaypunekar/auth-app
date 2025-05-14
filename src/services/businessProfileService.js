import axios from 'axios';
import { getToken } from '../utils/auth';

// Get API base URL from environment variables or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Set up axios with authentication header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include auth token on each request
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Business profile service methods
const businessProfileService = {
  // Create a new business profile
  createProfile: async (profileData) => {
    try {
      const response = await apiClient.post('/business-profile/', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw error;
    }
  },

  // Get the current user's business profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/business-profile/');
      return response.data;
    } catch (error) {
      // If profile not found (404), return null instead of throwing
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error fetching business profile:', error);
      throw error;
    }
  },

  // Update an existing business profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/business-profile/', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },

  // Delete a business profile
  deleteProfile: async () => {
    try {
      await apiClient.delete('/business-profile/');
      return true;
    } catch (error) {
      console.error('Error deleting business profile:', error);
      throw error;
    }
  },
  
  // Update report frequency
  updateReportFrequency: async (frequencyHours) => {
    try {
      console.log('Updating business profile report frequency:', frequencyHours);
      const response = await apiClient.put(`/business-profile/report-frequency?frequency_hours=${frequencyHours}`);
      console.log('Business profile report frequency updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating business profile report frequency:', error);
      throw error;
    }
  },

  // Get AI-generated blog suggestions based on business profile
  getBlogSuggestions: async () => {
    try {
      const response = await apiClient.get('/business-profile/blog-suggestions');
      return response.data;
    } catch (error) {
      console.error('Error getting blog suggestions:', error);
      throw error;
    }
  }
};

export default businessProfileService; 