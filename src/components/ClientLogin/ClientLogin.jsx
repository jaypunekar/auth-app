import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClientLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/client-auth/login', {
        email,
        password
      });

      // Save token and client info to localStorage
      localStorage.setItem('clientToken', response.data.access_token);
      localStorage.setItem('clientInfo', JSON.stringify({
        id: response.data.client_id,
        email: response.data.email,
        first_name: response.data.first_name,
        last_name: response.data.last_name,
        company_name: response.data.company_name,
        customer_ids: response.data.customer_ids
      }));

      // Redirect to client dashboard
      navigate('/client-dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Client Analytics Portal
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Access your campaign analytics and performance reports
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Forgot your password? Contact your account manager.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link href="/" color="primary">
              Return to main site
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ClientLogin; 