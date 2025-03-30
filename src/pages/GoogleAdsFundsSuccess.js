import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { googleAdsAPI } from '../services/api';

const GoogleAdsFundsSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(0);

  // Get query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get('session_id');
    const paymentAmount = searchParams.get('amount');
    
    if (paymentAmount) {
      setAmount(parseFloat(paymentAmount));
    }
    
    // Refresh account funds to ensure the database is updated
    const refreshFunds = async () => {
      try {
        setLoading(true);
        
        // Wait for a moment to allow webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the updated account status
        const response = await googleAdsAPI.getFunds();
        
        if (!response.success) {
          setError("Your payment was processed, but we couldn't fetch your updated account balance. Please refresh the dashboard to see your new balance.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error refreshing funds:', err);
        setError("Your payment was processed, but we couldn't fetch your updated account balance. Please refresh the dashboard to see your new balance.");
        setLoading(false);
      }
    };
    
    refreshFunds();
  }, [location.search]);

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6">
                Processing your payment...
              </Typography>
            </Box>
          ) : (
            <>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="h6" sx={{ mb: 3 }}>
                You've successfully added ${amount.toFixed(2)} to your Google Ads account.
              </Typography>
              
              {error && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <Typography variant="body1" sx={{ mb: 4 }}>
                Your funds are now available in your Google Ads account and can be used to run campaigns.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleGoToDashboard}
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default GoogleAdsFundsSuccess; 