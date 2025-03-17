/**
 * Authentication utility functions
 */

/**
 * Check if the user is logged in by verifying the token in localStorage
 * @returns {boolean} True if the user is logged in
 */
export const isLoggedIn = () => {
  const token = localStorage.getItem('token');
  return token && token !== 'undefined' && token !== 'null';
};

/**
 * Get the token from localStorage
 * @returns {string|null} The token or null if not found
 */
export const getToken = () => {
  try {
    const token = localStorage.getItem('token');
    
    // Check for invalid token values
    if (!token || 
        token === 'undefined' || 
        token === 'null' || 
        token === undefined || 
        token === null) {
      console.warn('Invalid token found in localStorage:', token);
      return null;
    }
    
    // Check if token is a valid JWT (should have 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('Token does not appear to be a valid JWT:', token.substring(0, 10) + '...');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Store the token in localStorage
 * @param {string} token The token to store
 * @returns {boolean} True if the token was stored successfully
 */
export const storeToken = (token) => {
  try {
    // Check for invalid token values
    if (!token || 
        token === 'undefined' || 
        token === 'null' || 
        token === undefined || 
        token === null) {
      console.warn('Attempted to store invalid token:', token);
      return false;
    }
    
    // Check if token is a valid JWT (should have 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('Token does not appear to be a valid JWT:', token.substring(0, 10) + '...');
      return false;
    }
    
    // Store the token
    localStorage.setItem('token', token);
    
    // Verify it was stored correctly
    const storedToken = localStorage.getItem('token');
    return storedToken === token;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

/**
 * Clear the authentication data from localStorage
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
};

/**
 * Debug the authentication state
 * @returns {object} Debug information
 */
export const debugAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    
    // Check if token is a valid JWT
    const isValidJWT = token && token.includes('.') && token.split('.').length === 3;
    
    return {
      hasToken: !!token,
      tokenValue: token ? `${token.substring(0, 10)}...` : 'Not found',
      tokenLength: token ? token.length : 0,
      isValidValue: token && token !== 'undefined' && token !== 'null',
      isValidJWT,
      userId,
      userEmail,
      isValid: token && token !== 'undefined' && token !== 'null' && isValidJWT
    };
  } catch (error) {
    console.error('Error in debugAuth:', error);
    return {
      hasToken: false,
      error: error.message
    };
  }
}; 