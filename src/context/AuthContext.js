import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { getToken, storeToken, logout as authLogout, debugAuth } from '../utils/auth';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState({
    tier: 'Free',
    features: {
      can_use_google_ads: false,
      max_campaigns: 5,
      premium_ai: false
    }
  });

  // Check user subscription
  const checkSubscription = async () => {
    try {
      if (!isAuthenticated) {
        console.log('Not checking subscription - user not authenticated');
        return;
      }
      
      console.log('Checking subscription status...');
      // Use the correct URL for the subscription endpoint
      const response = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/subscription`);
      console.log('Subscription data received:', response.data);
      setSubscription(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching subscription info:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      console.error('Status:', err.response?.status || 'No status code');
      return null;
    }
  };

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication on app start');
        
        // Get token using the utility function
        const token = getToken();
        
        if (token) {
          console.log('Token found, validating...');
          
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          try {
            // Get user info
            console.log('Fetching user info to validate token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/auth/me`);
            
            console.log('User info retrieved successfully:', response.data);
            setUser(response.data);
            setIsAuthenticated(true);
            
            // Immediately check subscription after confirming authentication
            await checkSubscription();
          } catch (userErr) {
            console.error('Failed to get user info:', userErr);
            
            // Only clear token if it's a 401 Unauthorized error
            if (userErr.response && userErr.response.status === 401) {
              console.warn('Unauthorized error, clearing token');
              // Clear invalid token
              authLogout();
              delete axios.defaults.headers.common['Authorization'];
              
              setError('Session expired. Please login again.');
            } else {
              // For other errors (like network errors), don't clear the token
              // but still set authenticated to true if we have a valid token
              console.warn('Non-401 error, keeping token and setting authenticated to true');
              
              // Parse the token to get user info
              try {
                const [headerPart, payloadPart, signaturePart] = token.split('.');
                const decodedPayload = JSON.parse(atob(payloadPart));
                
                if (decodedPayload.sub) {
                  console.log('Setting user from token payload:', decodedPayload);
                  setUser({
                    email: decodedPayload.sub,
                    id: decodedPayload.user_id || 'unknown',
                    is_active: true
                  });
                  setIsAuthenticated(true);
                } else {
                  setIsAuthenticated(false);
                  setError('Failed to verify authentication. Please try again later.');
                }
              } catch (parseError) {
                console.error('Error parsing JWT token:', parseError);
                setIsAuthenticated(false);
                setError('Failed to verify authentication. Please try again later.');
              }
            }
          }
        } else {
          console.log('No valid token found on app start');
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error during authentication check:', err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Add effect to check subscription whenever isAuthenticated changes
  useEffect(() => {
    if (isAuthenticated) {
      checkSubscription();
    }
  }, [isAuthenticated]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting login for:', email);
      
      // Clear any existing token before login
      authLogout();
      delete axios.defaults.headers.common['Authorization'];
      
      // Get token
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/auth/token`, 
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
      
      const { access_token } = response.data;
      
      if (!access_token) {
        console.error('No access token in response');
        setError('Login failed: No access token received');
        return false;
      }
      
      console.log('Token received, length:', access_token.length);
      
      // Save token using the utility function
      const tokenStored = storeToken(access_token);
      
      if (!tokenStored) {
        console.error('Failed to store token');
        setError('Login failed: Could not store authentication token');
        return false;
      }
      
      // Store user info if available
      if (response.data.user_id) {
        localStorage.setItem('user_id', response.data.user_id);
      }
      if (response.data.email) {
        localStorage.setItem('user_email', response.data.email);
      }
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      try {
        // Get user info
        console.log('Fetching user info after login');
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/auth/me`);
        
        console.log('User info retrieved successfully');
        setUser(userResponse.data);
        setIsAuthenticated(true);
        
        // Check subscription immediately after login
        await checkSubscription();
        
        // Log auth debug info
        console.log('Auth state after login:', debugAuth());
        
        return true;
      } catch (userErr) {
        console.error('Failed to get user info after login:', userErr);
        
        // Try to extract user info from token
        try {
          const [headerPart, payloadPart, signaturePart] = access_token.split('.');
          const decodedPayload = JSON.parse(atob(payloadPart));
          
          if (decodedPayload.sub) {
            console.log('Setting user from token payload:', decodedPayload);
            setUser({
              email: decodedPayload.sub,
              id: decodedPayload.user_id || 'unknown',
              is_active: true
            });
            setIsAuthenticated(true);
            return true;
          }
        } catch (parseError) {
          console.error('Error parsing JWT token:', parseError);
        }
        
        // If we can't get user info, but we have a valid token, still consider the user logged in
        if (access_token) {
          console.log('Setting authenticated based on valid token');
          setIsAuthenticated(true);
          setUser({ email: email, id: 'unknown', is_active: true });
          return true;
        }
        
        setError('Login successful but failed to get user info. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Register user
      await axios.post(`${process.env.REACT_APP_API_URL || '/api'}/auth/register`, {
        email,
        password
      });
      
      // Login after registration
      return await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear any existing token before login
      authLogout();
      delete axios.defaults.headers.common['Authorization'];
      
      // Get token
      const response = await axios.post(`${process.env.REACT_APP_API_URL || '/api'}/auth/google`, {
        token
      });
      
      const { access_token } = response.data;
      
      if (!access_token) {
        console.error('No access token in Google login response');
        setError('Google login failed: No access token received');
        return false;
      }
      
      // Save token using the utility function
      const tokenStored = storeToken(access_token);
      
      if (!tokenStored) {
        console.error('Failed to store token from Google login');
        setError('Google login failed: Could not store authentication token');
        return false;
      }
      
      // Store user info if available
      if (response.data.user_id) {
        localStorage.setItem('user_id', response.data.user_id);
      }
      if (response.data.email) {
        localStorage.setItem('user_email', response.data.email);
      }
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      try {
        // Get user info
        const userResponse = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/auth/me`);
        
        setUser(userResponse.data);
        setIsAuthenticated(true);
        
        // Check subscription immediately after Google login
        await checkSubscription();
        
        // Log auth debug info
        console.log('Auth state after Google login:', debugAuth());
        
        return true;
      } catch (userErr) {
        console.error('Failed to get user info after Google login:', userErr);
        
        // Try to extract user info from token
        try {
          const [headerPart, payloadPart, signaturePart] = access_token.split('.');
          const decodedPayload = JSON.parse(atob(payloadPart));
          
          if (decodedPayload.sub) {
            console.log('Setting user from token payload:', decodedPayload);
            setUser({
              email: decodedPayload.sub,
              id: decodedPayload.user_id || 'unknown',
              is_active: true
            });
            setIsAuthenticated(true);
            return true;
          }
        } catch (parseError) {
          console.error('Error parsing JWT token:', parseError);
        }
        
        // If we can't get user info, but we have a valid token, still consider the user logged in
        if (access_token) {
          console.log('Setting authenticated based on valid token');
          setIsAuthenticated(true);
          setUser({ email: 'google-user', id: 'unknown', is_active: true });
          return true;
        }
        
        setError('Google login successful but failed to get user info. Please try again.');
        return false;
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Google login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('Logging out user');
    
    // Use the utility function to clear auth data
    authLogout();
    
    // Clear auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Direct auth data setting function
  const setAuthData = (data) => {
    console.log('Setting auth data directly:', data);
    
    if (data.token) {
      // Save token using the utility function
      storeToken(data.token);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    
    if (data.user) {
      setUser(data.user);
      
      // Store user info if available
      if (data.user.id) {
        localStorage.setItem('user_id', data.user.id);
      }
      if (data.user.email) {
        localStorage.setItem('user_email', data.user.email);
      }
    }
    
    if (data.isAuthenticated !== undefined) {
      setIsAuthenticated(data.isAuthenticated);
    }
  };

  // Update subscription tier
  const updateSubscription = async (tier) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/subscription/update`,
        { tier }
      );
      setSubscription(response.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update subscription');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    subscription,
    login,
    register,
    googleLogin,
    logout,
    setAuthData,
    updateSubscription,
    checkSubscription
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 