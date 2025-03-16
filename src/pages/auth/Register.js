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

const Register = () => {
  const { register, googleLogin, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    // Register
    const success = await register(email, password);
    
    if (success) {
      navigate('/');
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      const success = await googleLogin(response.access_token);
      
      if (success) {
        navigate('/');
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign Up'}
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
        Sign up with Google
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" variant="body2">
          {"Already have an account? Sign In"}
        </Link>
      </Box>
    </Box>
  );
};

export default Register; 