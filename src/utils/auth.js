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
    
    // Log token retrieval for debugging
    console.log('getToken called, raw token:', token ? `${token.substring(0, 10)}...` : 'null/undefined');
    
    // Check for invalid token values
    if (!token || 
        token === 'undefined' || 
        token === 'null' || 
        token === undefined || 
        token === null) {
      console.warn('Invalid token found in localStorage:', token);
      
      // Don't redirect here, let the API interceptor handle redirects
      return null;
    }
    
    // Check if token is a valid JWT (should have 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.warn('Token does not appear to be a valid JWT:', token.substring(0, 10) + '...');
      
      // Don't redirect here, let the API interceptor handle redirects
      return null;
    }
    
    // Check if token is expired
    try {
      const [headerPart, payloadPart, signaturePart] = token.split('.');
      const decodedPayload = JSON.parse(atob(payloadPart));
      
      if (decodedPayload.exp) {
        const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        
        if (currentTime > expirationTime) {
          console.warn('Token is expired:', {
            exp: new Date(expirationTime).toISOString(),
            now: new Date(currentTime).toISOString(),
            timeLeft: Math.floor((expirationTime - currentTime) / 1000) + ' seconds'
          });
          
          // Don't redirect here, let the API interceptor handle redirects
          return null;
        }
      }
    } catch (parseError) {
      console.error('Error parsing JWT token in getToken:', parseError);
      // Continue with the token even if we can't parse it
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
    
    // Log the stored token
    console.log('Token stored successfully:', {
      length: storedToken ? storedToken.length : 0,
      preview: storedToken ? storedToken.substring(0, 10) + '...' : 'not stored',
      matches: storedToken === token
    });
    
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
  console.log('Logging out, clearing authentication data');
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
    
    // Check if token is expired
    let isExpired = null;
    let expirationTime = null;
    
    if (isValidJWT) {
      try {
        const [headerPart, payloadPart, signaturePart] = token.split('.');
        const decodedPayload = JSON.parse(atob(payloadPart));
        
        if (decodedPayload.exp) {
          expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          isExpired = currentTime > expirationTime;
        }
      } catch (parseError) {
        console.error('Error parsing JWT token in debugAuth:', parseError);
      }
    }
    
    return {
      hasToken: !!token,
      tokenValue: token ? `${token.substring(0, 10)}...` : 'Not found',
      tokenLength: token ? token.length : 0,
      isValidValue: token && token !== 'undefined' && token !== 'null',
      isValidJWT,
      isExpired,
      expirationTime: expirationTime ? new Date(expirationTime).toISOString() : null,
      timeToExpiration: expirationTime ? Math.floor((expirationTime - Date.now()) / 1000) + ' seconds' : null,
      userId,
      userEmail,
      isValid: token && token !== 'undefined' && token !== 'null' && isValidJWT && !isExpired
    };
  } catch (error) {
    console.error('Error in debugAuth:', error);
    return {
      hasToken: false,
      error: error.message
    };
  }
}; 