import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

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
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user info
          const response = await axios.get('/api/auth/me');
          
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Authentication check failed:', err);
          
          // Only clear token if it's a 401 Unauthorized error
          if (err.response && err.response.status === 401) {
            // Clear invalid token
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            
            setError('Session expired. Please login again.');
          } else {
            // For other errors (like network errors), don't clear the token
            // but still set authenticated to false
            setIsAuthenticated(false);
            setError('Failed to verify authentication. Please try again later.');
          }
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token
      const response = await axios.post('/api/auth/token', 
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
      
      const { access_token } = response.data;
      
      // Save token
      localStorage.setItem('token', access_token);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      try {
        // Get user info
        const userResponse = await axios.get('/api/auth/me');
        
        setUser(userResponse.data);
        setIsAuthenticated(true);
        
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
      await axios.post('/api/auth/register', {
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
      
      // Get token
      const response = await axios.post('/api/auth/google', {
        token
      });
      
      const { access_token } = response.data;
      
      // Save token
      localStorage.setItem('token', access_token);
      
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user info
      const userResponse = await axios.get('/api/auth/me');
      
      setUser(userResponse.data);
      setIsAuthenticated(true);
      
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
    // Clear token
    localStorage.removeItem('token');
    
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