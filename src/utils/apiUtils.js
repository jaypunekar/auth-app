import axios from 'axios';

/**
 * Utility functions to handle API connectivity and provide fallback mechanisms
 */

/**
 * Initialize axios interceptors to handle API errors
 */
export const initializeAxiosInterceptors = () => {
  // Add a request interceptor
  axios.interceptors.request.use(
    (config) => {
      // Any modifications to requests can go here
      // You can add logging, authentication tokens, etc.
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Any status code in the range of 2xx cause this function to trigger
      return response;
    },
    (error) => {
      // Any status codes outside the range of 2xx cause this function to trigger
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      return Promise.reject(error);
    }
  );
};

/**
 * Safe API call wrapper that handles errors and provides fallback data
 * @param {Function} apiCall - Async function that makes the API call
 * @param {any} fallbackData - Data to return if the API call fails
 * @param {Function} onError - Optional function to call when an error occurs
 * @returns {Promise<any>} - Returns the API response data or fallback data
 */
export const safeApiCall = async (apiCall, fallbackData = null, onError = null) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    if (onError && typeof onError === 'function') {
      onError(error);
    }
    return fallbackData;
  }
};

/**
 * Check if the API is reachable
 * @returns {Promise<boolean>} - True if API is reachable, false otherwise
 */
export const checkApiConnectivity = async () => {
  try {
    // Try to reach a simple endpoint
    await axios.get('/api/health-check');
    return true;
  } catch (error) {
    console.error('API connectivity check failed:', error);
    return false;
  }
};

/**
 * Utility to retry a failed API call with exponential backoff
 * @param {Function} apiCall - The API call to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms before retrying
 * @returns {Promise<any>} - Returns the API response or throws an error
 */
export const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API call attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Calculate delay with exponential backoff and jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      
      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we've exhausted all retries, throw the last error
  throw lastError;
};

export default {
  initializeAxiosInterceptors,
  safeApiCall,
  checkApiConnectivity,
  retryApiCall
}; 