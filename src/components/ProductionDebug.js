import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, TextField } from '@mui/material';
import { debugAuth } from '../utils/auth';

const ProductionDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter or environment variable
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugEnv = process.env.REACT_APP_DEBUG === 'true';
    
    setVisible(debugParam === 'true' || debugEnv);
    
    // Get auth debug info
    updateDebugInfo();
  }, []);

  const updateDebugInfo = () => {
    const authDebugInfo = debugAuth();
    setDebugInfo({
      ...authDebugInfo,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_DEBUG: process.env.REACT_APP_DEBUG,
        REACT_APP_AUTH_STORAGE: process.env.REACT_APP_AUTH_STORAGE,
        REACT_APP_AUTH_HEADER_PREFIX: process.env.REACT_APP_AUTH_HEADER_PREFIX
      },
      localStorage: {
        token: localStorage.getItem('token'),
        user_id: localStorage.getItem('user_id'),
        user_email: localStorage.getItem('user_email')
      }
    });
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    updateDebugInfo();
  };

  const setToken = () => {
    if (manualToken) {
      localStorage.setItem('token', manualToken);
      updateDebugInfo();
    }
  };

  const refreshDebugInfo = () => {
    setLoading(true);
    updateDebugInfo();
    setTimeout(() => setLoading(false), 500);
  };

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, mb: 2, position: 'fixed', bottom: 0, right: 0, maxWidth: '400px', zIndex: 9999 }}>
      <Typography variant="h6" gutterBottom>
        Production Debug
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Environment:</Typography>
        <Typography variant="body2">NODE_ENV: {debugInfo.environment?.NODE_ENV}</Typography>
        <Typography variant="body2">API URL: {debugInfo.environment?.REACT_APP_API_URL}</Typography>
        <Typography variant="body2">Debug: {debugInfo.environment?.REACT_APP_DEBUG}</Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Authentication:</Typography>
        <Typography variant="body2">Has Token: {debugInfo.hasToken ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">Token Value: {debugInfo.tokenValue}</Typography>
        <Typography variant="body2">Token Length: {debugInfo.tokenLength}</Typography>
        <Typography variant="body2">Valid Value: {debugInfo.isValidValue ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">Valid JWT: {debugInfo.isValidJWT ? 'Yes' : 'No'}</Typography>
        <Typography variant="body2">User ID: {debugInfo.userId || 'Not found'}</Typography>
        <Typography variant="body2">Email: {debugInfo.userEmail || 'Not found'}</Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1">Raw localStorage:</Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
          Token: {debugInfo.localStorage?.token ? `${debugInfo.localStorage.token.substring(0, 20)}...` : 'Not found'}
        </Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Manual Token"
          variant="outlined"
          size="small"
          fullWidth
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={setToken}
          size="small"
          sx={{ mr: 1 }}
        >
          Set Token
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={clearToken}
          size="small"
        >
          Clear Token
        </Button>
      </Box>
      
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={refreshDebugInfo}
        disabled={loading}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Refresh Debug Info'}
      </Button>
    </Paper>
  );
};

export default ProductionDebug; 