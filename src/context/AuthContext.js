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
              // but still set authenticated to false
              console.warn('Non-401 error, keeping token but setting not authenticated');
              setIsAuthenticated(false);
              setError('Failed to verify authentication. Please try again later.');
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
        
        // Log auth debug info
        console.log('Auth state after login:', debugAuth());
        
        return true;
      } catch (userErr) {
        console.error('Failed to get user info after login:', userErr);
        setError('Login successful but failed to get user info. Please try again.');
        
        // Don't clear token here, just return false
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
      
      // Get user info
      const userResponse = await axios.get(`${process.env.REACT_APP_API_URL || '/api'}/auth/me`);
      
      setUser(userResponse.data);
      setIsAuthenticated(true);
      
      // Log auth debug info
      console.log('Auth state after Google login:', debugAuth());
      
      return true;
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

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    googleLogin,
    logout
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