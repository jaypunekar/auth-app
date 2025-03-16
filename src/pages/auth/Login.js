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
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, googleLogin, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      // Login
      const success = await login(email, password);
      
      if (success) {
        console.log('Login successful, navigating to dashboard');
        navigate('/');
      } else {
        console.error('Login failed but no error was thrown');
        setFormError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setFormError(err.message || 'An unexpected error occurred');
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
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || formError}
        </Alert>
      )}

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
        disabled={loading}
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
        disabled={loading}
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

      <Box sx={{ position: 'relative', my: 3 }}>
        <Divider>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>
      </Box>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={() => handleGoogleLogin()}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Sign in with Google
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link component={RouterLink} to="/register" variant="body2">
          {"Don't have an account? Sign Up"}
        </Link>
      </Box>
    </Box>
  );
};

export default Login; 