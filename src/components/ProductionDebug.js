import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress, TextField, Divider, IconButton } from '@mui/material';
import { KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { debugAuth } from '../utils/auth';

const ProductionDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [tokenParts, setTokenParts] = useState({ header: null, payload: null, signature: null });
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter or environment variable
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    const debugEnv = process.env.REACT_APP_DEBUG === 'true';
    
    setVisible(debugParam === 'true' || debugEnv);
    
    // Get auth debug info
    updateDebugInfo();
    
    // Set up interval to refresh debug info every 5 seconds
    const interval = setInterval(() => {
      updateDebugInfo();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const updateDebugInfo = () => {
    const authDebugInfo = debugAuth();
    
    // Parse token if it exists
    const token = localStorage.getItem('token');
    let parsedTokenParts = { header: null, payload: null, signature: null };
    
    if (token && token.includes('.') && token.split('.').length === 3) {
      try {
        const [headerPart, payloadPart, signaturePart] = token.split('.');
        
        // Decode header and payload
        const header = JSON.parse(atob(headerPart));
        const payload = JSON.parse(atob(payloadPart));
        
        parsedTokenParts = {
          header,
          payload,
          signature: signaturePart.substring(0, 10) + '...'
        };
        
        setTokenParts(parsedTokenParts);
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
    
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
      },
      tokenParts: parsedTokenParts,
      timestamp: new Date().toISOString()
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

  // Check token expiration
  const isTokenExpired = () => {
    if (tokenParts.payload && tokenParts.payload.exp) {
      const expirationTime = tokenParts.payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      return currentTime > expirationTime;
    }
    return null; // Can't determine
  };

  const toggleMinimized = () => {
    setMinimized(!minimized);
  };

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: minimized ? 1 : 3, 
        mt: 2, 
        mb: 2, 
        position: 'fixed', 
        bottom: 0, 
        right: 0, 
        maxWidth: minimized ? '200px' : '500px', 
        maxHeight: minimized ? '50px' : '80vh', 
        overflow: 'auto', 
        zIndex: 9999,
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: minimized ? 0 : 2 }}>
        <Typography variant={minimized ? "body2" : "h6"} component="div">
          {minimized ? "Debug" : "Production Debug"}
        </Typography>
        <IconButton 
          size="small" 
          onClick={toggleMinimized} 
          sx={{ ml: 1 }}
          aria-label={minimized ? "Expand debug panel" : "Minimize debug panel"}
        >
          {minimized ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      </Box>
      
      {!minimized && (
        <>
          <Typography variant="caption" display="block" gutterBottom>
            Last updated: {debugInfo.timestamp}
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Environment:</Typography>
            <Typography variant="body2">NODE_ENV: {debugInfo.environment?.NODE_ENV}</Typography>
            <Typography variant="body2">API URL: {debugInfo.environment?.REACT_APP_API_URL}</Typography>
            <Typography variant="body2">Debug: {debugInfo.environment?.REACT_APP_DEBUG}</Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
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
          
          {tokenParts.payload && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Token Details:</Typography>
                <Typography variant="body2">Issuer (iss): {tokenParts.payload.iss || 'Not found'}</Typography>
                <Typography variant="body2">Subject (sub): {tokenParts.payload.sub || 'Not found'}</Typography>
                <Typography variant="body2">Issued At: {tokenParts.payload.iat ? new Date(tokenParts.payload.iat * 1000).toLocaleString() : 'Not found'}</Typography>
                <Typography variant="body2">Expires At: {tokenParts.payload.exp ? new Date(tokenParts.payload.exp * 1000).toLocaleString() : 'Not found'}</Typography>
                <Typography variant="body2" color={isTokenExpired() === true ? 'error' : isTokenExpired() === false ? 'success' : 'text.primary'}>
                  Status: {isTokenExpired() === true ? 'EXPIRED' : isTokenExpired() === false ? 'VALID' : 'UNKNOWN'}
                </Typography>
              </Box>
            </>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Raw localStorage:</Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              Token: {debugInfo.localStorage?.token ? `${debugInfo.localStorage.token.substring(0, 20)}...` : 'Not found'}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
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
        </>
      )}
    </Paper>
  );
};

export default ProductionDebug; 