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
      const response = await apiClient.post('/business-profile/business-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw error;
    }
  },

  // Get the current user's business profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/business-profile/business-profile');
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
      const response = await apiClient.put('/business-profile/business-profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },

  // Delete a business profile
  deleteProfile: async () => {
    try {
      await apiClient.delete('/business-profile/business-profile');
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
      const response = await apiClient.put(`/business-profile/business-profile/report-frequency?frequency_hours=${frequencyHours}`);
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
      const response = await apiClient.get('/business-profile/business-profile/blog-suggestions');
      return response.data;
    } catch (error) {
      console.error('Error getting blog suggestions:', error);
      throw error;
    }
  },
  
  // Generate content calendar using OpenAI
  generateContentCalendar: async (dateRange) => {
    try {
      console.log('Generating content calendar for date range:', dateRange);
      const response = await apiClient.post('/business-profile/business-profile/content-calendar', dateRange);
      console.log('Content calendar generated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating content calendar:', error);
      throw error;
    }
  },
  
  // Get content calendar data
  getContentCalendar: async () => {
    try {
      const response = await apiClient.get('/business-profile/business-profile/content-calendar');
      return response.data;
    } catch (error) {
      console.error('Error getting content calendar:', error);
      throw error;
    }
  },

  // =============================================================================
  // BLOG SUGGESTIONS CRUD OPERATIONS
  // =============================================================================

  // Save multiple blog suggestions to database
  saveBlogSuggestionsBulk: async (suggestions) => {
    try {
      const response = await apiClient.post('/business-profile/business-profile/blog-suggestions/save-bulk', {
        suggestions: suggestions
      });
      return response.data;
    } catch (error) {
      console.error('Error saving blog suggestions:', error);
      throw error;
    }
  },

  // Get all saved blog suggestions
  getSavedBlogSuggestions: async () => {
    try {
      const response = await apiClient.get('/business-profile/business-profile/blog-suggestions/saved');
      return response.data;
    } catch (error) {
      console.error('Error getting saved blog suggestions:', error);
      throw error;
    }
  },

  // Create a new blog suggestion
  createBlogSuggestion: async (suggestionData) => {
    try {
      const response = await apiClient.post('/business-profile/business-profile/blog-suggestions', suggestionData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog suggestion:', error);
      throw error;
    }
  },

  // Get a specific blog suggestion
  getBlogSuggestion: async (suggestionId) => {
    try {
      const response = await apiClient.get(`/business-profile/business-profile/blog-suggestions/${suggestionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting blog suggestion:', error);
      throw error;
    }
  },

  // Update a blog suggestion
  updateBlogSuggestion: async (suggestionId, updateData) => {
    try {
      const response = await apiClient.put(`/business-profile/business-profile/blog-suggestions/${suggestionId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog suggestion:', error);
      throw error;
    }
  },

  // Delete a blog suggestion
  deleteBlogSuggestion: async (suggestionId) => {
    try {
      await apiClient.delete(`/business-profile/business-profile/blog-suggestions/${suggestionId}`);
      return true;
    } catch (error) {
      console.error('Error deleting blog suggestion:', error);
      throw error;
    }
  },

  // =============================================================================
  // CONTENT CALENDAR CRUD OPERATIONS
  // =============================================================================

  // Save the current generated content calendar
  saveCurrentContentCalendar: async () => {
    try {
      const response = await apiClient.post('/business-profile/business-profile/content-calendar/save-current');
      return response.data;
    } catch (error) {
      console.error('Error saving current content calendar:', error);
      throw error;
    }
  },

  // Get all saved content calendar entries
  getSavedContentCalendarEntries: async () => {
    try {
      const response = await apiClient.get('/business-profile/business-profile/content-calendar/saved');
      return response.data;
    } catch (error) {
      console.error('Error getting saved content calendar entries:', error);
      throw error;
    }
  },

  // Create a new content calendar entry
  createContentCalendarEntry: async (entryData) => {
    try {
      const response = await apiClient.post('/business-profile/business-profile/content-calendar/entries', entryData);
      return response.data;
    } catch (error) {
      console.error('Error creating content calendar entry:', error);
      throw error;
    }
  },

  // Get a specific content calendar entry
  getContentCalendarEntry: async (entryId) => {
    try {
      const response = await apiClient.get(`/business-profile/business-profile/content-calendar/entries/${entryId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting content calendar entry:', error);
      throw error;
    }
  },

  // Update a content calendar entry
  updateContentCalendarEntry: async (entryId, updateData) => {
    try {
      const response = await apiClient.put(`/business-profile/business-profile/content-calendar/entries/${entryId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating content calendar entry:', error);
      throw error;
    }
  },

  // Delete a content calendar entry
  deleteContentCalendarEntry: async (entryId) => {
    try {
      await apiClient.delete(`/business-profile/business-profile/content-calendar/entries/${entryId}`);
      return true;
    } catch (error) {
      console.error('Error deleting content calendar entry:', error);
      throw error;
    }
  },

  // Clear all content calendar entries
  clearAllContentCalendarEntries: async () => {
    try {
      await apiClient.delete('/business-profile/business-profile/content-calendar/clear-all');
      return true;
    } catch (error) {
      console.error('Error clearing all content calendar entries:', error);
      throw error;
    }
  }
};

export default businessProfileService; 