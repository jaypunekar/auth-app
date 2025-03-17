import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import api from '../services/api';
import { debugAuth, getToken } from '../utils/auth';

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localStorageInfo, setLocalStorageInfo] = useState({});
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter or environment variable
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugEnv = process.env.REACT_APP_DEBUG === 'true';
    
    setVisible(process.env.NODE_ENV === 'development' || debugParam === 'true' || debugEnv);
    
    // Get auth debug info
    const authDebugInfo = debugAuth();
    setLocalStorageInfo(authDebugInfo);
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test the debug endpoint
      const response = await api.get('/auth/debug-auth');
      setDebugInfo(response.data);
    } catch (err) {
      console.error('Auth debug error:', err);
      setError(err.message || 'Authentication check failed');
      
      if (err.response) {
        setError(`${err.response.status}: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Authentication Debug
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Local Storage:</Typography>
        <Typography variant="body2">Token: {localStorageInfo.tokenValue}</Typography>
        <Typography variant="body2">Token Length: {localStorageInfo.tokenLength}</Typography>
        <Typography variant="body2">Token Valid: {localStorageInfo.isValid ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">User ID: {localStorageInfo.userId || 'Not found'}</Typography>
        <Typography variant="body2">Email: {localStorageInfo.userEmail || 'Not found'}</Typography>
      </Box>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={checkAuth}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Check Authentication'}
      </Button>
      
      {error && (
        <Box sx={{ mt: 2, color: 'error.main' }}>
          <Typography variant="body2">Error: {error}</Typography>
        </Box>
      )}
      
      {debugInfo && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Server Response:</Typography>
          <Typography variant="body2">Authenticated: {debugInfo.authenticated ? 'Yes' : 'No'}</Typography>
          <Typography variant="body2">User ID: {debugInfo.user_id}</Typography>
          <Typography variant="body2">Email: {debugInfo.email}</Typography>
          <Typography variant="body2">Auth Header: {debugInfo.auth_header_preview}</Typography>
          <Typography variant="body2">Active: {debugInfo.is_active ? 'Yes' : 'No'}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AuthDebug; 