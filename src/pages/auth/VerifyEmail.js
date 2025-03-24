import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Container,
  Paper
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';
import axios from 'axios';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      // Get token from query parameters
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        setError('Invalid verification link. No token provided.');
        setLoading(false);
        return;
      }

      try {
        // Call API to verify email
        const apiUrl = process.env.REACT_APP_API_URL || '/api';
        await axios.post(`${apiUrl}/auth/verify-email`, { token });
        
        setSuccess(true);
      } catch (err) {
        console.error('Email verification error:', err);
        setError(err.response?.data?.detail || 'Invalid or expired verification link.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [location.search]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Email Verification
          </Typography>

          {loading ? (
            <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Verifying your email...
              </Typography>
            </Box>
          ) : success ? (
            <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Your email has been successfully verified!
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                You can now sign in to your account.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 4, mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ErrorIcon color="error" sx={{ fontSize: 60 }} />
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error}
              </Alert>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Please try logging in to request a new verification email.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 