import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { authAPI } from '../services/api';
import { debugAuth, storeToken } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Log auth state before login
      console.log('Auth state before login:', debugAuth());
      
      // Clear any existing token before login
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      
      // Attempt login
      const response = await authAPI.login(email, password);
      
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
          localStorage.setItem('token', token);
          
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
        } else {
          setError('Login failed: Invalid token received');
          console.error('Invalid token received:', token);
        }
      } else {
        setError('Login failed: No access token received');
        console.error('No access_token in response:', response.data);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(`Login failed: ${err.response.data.detail || 'Unknown error'}`);
      } else {
        setError(`Login failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
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