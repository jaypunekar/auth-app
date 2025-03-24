import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const VerificationPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();
  
  // Get the email from location state
  const email = location.state?.email || '';
  
  // Redirect to register if no email
  if (!email) {
    navigate('/register');
    return null;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || '/api';
      const response = await axios.post(`${apiUrl}/auth/verify-code`, {
        email,
        code: verificationCode
      });
      
      // Extract token and user data from response
      const { access_token, token_type, id, email: userEmail, is_active } = response.data;
      
      // Set authentication data in context
      setAuthData({
        token: access_token,
        user: {
          id,
          email: userEmail,
          is_active
        },
        isAuthenticated: true
      });
      
      // Store token in localStorage
      localStorage.setItem('auth_token', access_token);
      
      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.detail || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    
    try {
      // Re-request verification code
      const apiUrl = process.env.REACT_APP_API_URL || '/api';
      await axios.post(`${apiUrl}/auth/request-verification`, {
        email,
        password: location.state?.password || '' // The password should be in location state
      });
      
      // Show success
      setError('A new verification code has been sent to your email');
    } catch (err) {
      console.error('Resend code error:', err);
      setError(err.response?.data?.detail || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Verify Your Email
          </Typography>
          
          <Typography variant="body1" align="center" gutterBottom sx={{ mb: 3 }}>
            We've sent a verification code to <strong>{email}</strong>. 
            Please enter the code below to verify your email address.
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert 
                severity={error.includes('has been sent') ? 'success' : 'error'} 
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="verificationCode"
              label="Verification Code"
              name="verificationCode"
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={loading}
              sx={{ 
                input: { 
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  fontSize: '1.2em' 
                } 
              }}
              inputProps={{ maxLength: 6 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Didn't receive the code?{' '}
                <Button
                  variant="text"
                  onClick={handleResendCode}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Resend Code
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerificationPage; 