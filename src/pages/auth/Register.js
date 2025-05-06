import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';
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
  Grid,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, googleLogin, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formError, setFormError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    // Validate form
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setFormError('Please fill in all required fields');
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
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null // Make phone number optional
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

  const handleGoogleLogin = (credentialResponse) => {
    googleLogin(credentialResponse.credential)
      .then(success => {
        if (success) {
          console.log('Google login successful, navigating to dashboard');
          navigate('/');
        } else {
          setFormError(error || 'Google login failed. Please try again.');
        }
      })
      .catch(err => {
        console.error('Google login error:', err);
        setFormError(err.message || 'An error occurred during Google login');
      });
  };

  const handleDialogClose = () => {
    setRegistrationSuccess(false);
    navigate('/login');
  };

  const handleLegacyRegister = async () => {
    // Use the original register function for backward compatibility
    const success = await register(email, password, firstName, lastName, phoneNumber);
    
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

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting || loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting || loading}
            />
          </Grid>
        </Grid>

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting || loading}
        />

        <TextField
          margin="normal"
          fullWidth
          id="phoneNumber"
          label="Phone Number (Optional)"
          name="phoneNumber"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
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

        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => {
            console.error('Google login failed');
            setFormError('Google login failed. Please try again.');
          }}
          useOneTap
          theme="outline"
          text="signup_with"
          shape="rectangular"
          width="100%"
        />

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