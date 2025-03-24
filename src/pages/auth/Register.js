import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // Validate form
    if (!email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }

    try {
      // Use new registration flow with verification
      const apiUrl = process.env.REACT_APP_API_URL || '/api';
      await axios.post(`${apiUrl}/auth/request-verification`, {
        email,
        password
      });

      // Navigate to verification page
      navigate('/verify', { 
        state: { 
          email, 
          password // Pass password for resend functionality
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      setFormError(err.response?.data?.detail || 'Registration failed. Please try again.');
      setIsSubmitting(false);
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

  const handleDialogClose = () => {
    setRegistrationSuccess(false);
    navigate('/login');
  };

  const handleLegacyRegister = async () => {
    // Use the original register function for backward compatibility
    const success = await register(email, password);
    
    if (success) {
      setRegisteredEmail(email);
      setRegistrationSuccess(true);
    }
  };

  return (
    <>
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
          disabled={isSubmitting || loading}
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
          disabled={isSubmitting || loading}
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
          disabled={isSubmitting || loading}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Sign Up'}
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
          disabled={isSubmitting || loading}
          sx={{ mb: 2 }}
        >
          Sign up with Google
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login" variant="body2">
            Already have an account? Sign In
          </Link>
        </Box>
      </Box>

      {/* Email Verification Dialog (for legacy flow) */}
      <Dialog
        open={registrationSuccess}
        onClose={handleDialogClose}
        aria-labelledby="verification-dialog-title"
      >
        <DialogTitle id="verification-dialog-title">
          Verification Email Sent
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            We've sent a verification email to <strong>{registeredEmail}</strong>. 
            Please check your inbox and click the verification link to activate your account.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            If you don't see the email, check your spam folder or request a new verification 
            email by logging in.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Register; 