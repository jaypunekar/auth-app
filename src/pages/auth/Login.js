import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { debugAuth } from '../../utils/auth';
import axios from 'axios';

const Login = () => {
  const { login, googleLogin, error: authError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Check for success message from verification
  useEffect(() => {
    if (location.state?.verificationSuccess) {
      setFormSuccess(location.state.message || 'Your account has been verified successfully!');
      // If email was passed, set it in the form
      if (location.state.email) {
        setEmail(location.state.email);
      }
      // Clear location state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

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
      
      // Use the context's login function
      const success = await login(email, password);
      
      if (success) {
        console.log('Login successful, navigating to dashboard');
        setShowSnackbar(true);
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setFormError(authError || 'Login failed. Please try again.');
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
          setFormError(authError || 'Google login failed. Please try again.');
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

  const handleForgotPasswordOpen = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordEmail(email || '');
    setForgotPasswordStatus('');
  };

  const handleForgotPasswordClose = () => {
    setForgotPasswordOpen(false);
  };

  const handleForgotPasswordSubmit = async () => {
    // Validate email
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      setForgotPasswordStatus('Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordStatus('');

    try {
      // Send forgot password request
      const apiUrl = process.env.REACT_APP_API_URL || '/api';
      await axios.post(`${apiUrl}/auth/forgot-password`, {
        email: forgotPasswordEmail
      });
      
      setForgotPasswordStatus('success');
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotPasswordStatus('An error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {(formError || authError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError || authError}
            </Alert>
          )}
          
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {formSuccess}
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
            
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link 
                component="button" 
                variant="body2" 
                onClick={handleForgotPasswordOpen}
              >
                Forgot password?
              </Link>
            </Box>
            
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
              onClick={handleGoogleLogin}
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
        </Paper>
      </Box>
      
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onClose={handleForgotPasswordClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {forgotPasswordStatus === 'success' ? (
            <DialogContentText>
              If an account exists with this email, you will receive a password reset link shortly.
              Please check your email and follow the instructions to reset your password.
            </DialogContentText>
          ) : (
            <>
              <DialogContentText>
                Enter your email address and we'll send you a link to reset your password.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                id="forgotPasswordEmail"
                label="Email Address"
                type="email"
                fullWidth
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                disabled={forgotPasswordLoading}
              />
              {forgotPasswordStatus && forgotPasswordStatus !== 'success' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {forgotPasswordStatus}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          {forgotPasswordStatus === 'success' ? (
            <Button onClick={handleForgotPasswordClose}>Close</Button>
          ) : (
            <>
              <Button onClick={handleForgotPasswordClose} disabled={forgotPasswordLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleForgotPasswordSubmit} 
                color="primary" 
                disabled={forgotPasswordLoading}
              >
                {forgotPasswordLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      
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