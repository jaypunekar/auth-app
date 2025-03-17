import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Divider,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Snackbar
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../services/api';
import { debugAuth, storeToken } from '../utils/auth';

const Login = () => {
  const { login, googleLogin, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      // Log environment info
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        isProduction: process.env.NODE_ENV === 'production'
      });
      
      // Log auth state before login
      console.log('Auth state before login:', debugAuth());
      
      // Clear any existing token before login
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      
      // Attempt login
      const response = await authAPI.login(email, password);
      
      console.log('Login response status:', response.status);
      console.log('Login response data:', JSON.stringify(response.data, null, 2));
      
      // Check if login was successful
      if (response.data && response.data.access_token) {
        const token = response.data.access_token;
        
        // Log token details
        console.log('Token received from server:', {
          length: token.length,
          preview: token.substring(0, 10) + '...',
          isString: typeof token === 'string',
          isUndefined: token === 'undefined' || token === undefined
        });
        
        // Manually store the token
        if (token && token !== 'undefined' && token !== undefined) {
          // Direct localStorage access
          try {
            // Validate token format before storing
            if (!token.includes('.') || token.split('.').length !== 3) {
              console.error('Invalid JWT format received from server:', token.substring(0, 10) + '...');
              setFormError('Login failed: Invalid token format received from server');
              return;
            }
            
            // Try to parse the token to verify it's a valid JWT
            try {
              const [header, payload, signature] = token.split('.');
              const decodedPayload = JSON.parse(atob(payload));
              
              // Check if token has required fields
              if (!decodedPayload.exp || !decodedPayload.sub) {
                console.error('Token missing required fields:', decodedPayload);
                setFormError('Login failed: Invalid token received (missing required fields)');
                return;
              }
              
              // Check if token is already expired
              const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
              const currentTime = Date.now();
              
              if (currentTime > expirationTime) {
                console.error('Token already expired:', {
                  exp: new Date(expirationTime).toISOString(),
                  now: new Date(currentTime).toISOString()
                });
                setFormError('Login failed: Token expired');
                return;
              }
              
              console.log('Token validated successfully:', {
                sub: decodedPayload.sub,
                exp: new Date(expirationTime).toISOString(),
                timeToExpiration: Math.floor((expirationTime - currentTime) / 1000) + ' seconds'
              });
            } catch (parseError) {
              console.error('Error parsing JWT token:', parseError);
              // Continue with storing the token even if we can't parse it
            }
            
            // Store the token
            localStorage.setItem('token', token);
            console.log('Token stored directly in localStorage');
            
            // Verify storage
            const storedToken = localStorage.getItem('token');
            console.log('Stored token verification:', {
              length: storedToken ? storedToken.length : 0,
              preview: storedToken ? storedToken.substring(0, 10) + '...' : 'not stored',
              matches: storedToken === token
            });
            
            // Store user info
            if (response.data.user_id) {
              localStorage.setItem('user_id', response.data.user_id);
            }
            if (response.data.email) {
              localStorage.setItem('user_email', response.data.email);
            }
            
            // Log auth state after login
            console.log('Auth state after login:', debugAuth());
            
            console.log('Login successful, navigating to dashboard');
            setShowSnackbar(true);
            
            // Navigate to dashboard after a short delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } catch (storageError) {
            console.error('Error storing token in localStorage:', storageError);
            setFormError('Login failed: Could not store authentication token');
          }
        } else {
          setFormError('Login failed: Invalid token received');
          console.error('Invalid token received:', token);
        }
      } else {
        setFormError('Login failed: No access token received');
        console.error('No access_token in response:', JSON.stringify(response.data));
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        console.error('Error response:', JSON.stringify(err.response.data));
        setFormError(`Login failed: ${err.response.data.detail || 'Unknown error'}`);
      } else {
        setFormError(`Login failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const success = await googleLogin(response.access_token);
        
        if (success) {
          console.log('Google login successful, navigating to dashboard');
          navigate('/');
        } else {
          console.error('Google login failed but no error was thrown');
        }
      } catch (err) {
        console.error('Google login error:', err);
        setFormError(err.message || 'An error occurred during Google login');
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setFormError('Google login failed. Please try again.');
    },
    flow: 'implicit',
    prompt: 'select_account',
  });

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
      
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Login successful! Redirecting to dashboard...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login; 