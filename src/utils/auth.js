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
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return null;
  }
  return token;
};

/**
 * Store the token in localStorage
 * @param {string} token The token to store
 */
export const storeToken = (token) => {
  if (token && token !== 'undefined' && token !== 'null') {
    localStorage.setItem('token', token);
    return true;
  }
  return false;
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
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  const userEmail = localStorage.getItem('user_email');
  
  return {
    hasToken: !!token,
    tokenValue: token ? `${token.substring(0, 10)}...` : 'Not found',
    tokenLength: token ? token.length : 0,
    userId,
    userEmail,
    isValid: token && token !== 'undefined' && token !== 'null'
  };
}; 