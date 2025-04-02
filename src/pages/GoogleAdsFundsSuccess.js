import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { googleAdsAPI } from '../services/api';

const GoogleAdsFundsSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [transactionDetails, setTransactionDetails] = useState(null);

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
        // Increase wait time for each retry
        const waitTime = 2000 + (retryCount * 1000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        console.log(`🔄 Checking funds (attempt ${retryCount + 1})...`);
        
        // Get the updated account status
        const response = await googleAdsAPI.getFunds();
        
        if (!response.success) {
          setError("Your payment was processed, but we couldn't fetch your updated account balance. Please refresh the dashboard to see your new balance.");
          setLoading(false);
          return;
        }
        
        setCurrentBalance(response.data.available_funds);
        
        // Get the most recent transaction
        if (response.data.recent_transactions && response.data.recent_transactions.length > 0) {
          const latestTransaction = response.data.recent_transactions[0];
          
          // Check if this transaction matches our amount
          if (Math.abs(latestTransaction.amount - amount) < 0.01 && 
              latestTransaction.transaction_type === 'deposit') {
            setTransactionDetails(latestTransaction);
            setLoading(false);
          } else if (retryCount < 3) {
            // If not matching, try again up to 3 times
            setRetryCount(prev => prev + 1);
            // Will retry with the next useEffect cycle
          } else {
            // After 3 retries, just show what we have
            setLoading(false);
            setTransactionDetails(latestTransaction);
          }
        } else if (retryCount < 3) {
          // No transactions found yet, retry
          setRetryCount(prev => prev + 1);
        } else {
          // After 3 retries with no transactions, give up
          setLoading(false);
          setError("Payment was processed but transaction details are not available yet. You can view your updated balance in the dashboard.");
        }
      } catch (err) {
        console.error('Error refreshing funds:', err);
        if (retryCount < 3) {
          // Try again
          setRetryCount(prev => prev + 1);
        } else {
          setError("Your payment was processed, but we couldn't fetch your updated account balance. Please refresh the dashboard to see your new balance.");
          setLoading(false);
        }
      }
    };
    
    refreshFunds();
  }, [location.search, retryCount]);

  const handleGoToDashboard = () => {
    navigate('/google-ads');
  };
  
  const handleCreateCampaign = () => {
    navigate('/google-ads?action=create');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Attempt {retryCount + 1}/4 - Please wait while we verify your funds
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
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, width: '100%', maxWidth: 400 }}>
                  <Typography variant="subtitle1" color="primary.contrastText" gutterBottom>
                    Account Balance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.contrastText' }} />
                    <Typography variant="h4" color="primary.contrastText">
                      ${currentBalance !== null ? currentBalance.toFixed(2) : '—.—'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              
              {transactionDetails && (
                <Box sx={{ mb: 4, mt: 3 }}>
                  <Divider sx={{ mb: 2 }}>
                    <Chip label="Transaction Details" />
                  </Divider>
                  <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Amount:</strong> ${transactionDetails.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Transaction ID:</strong> {transactionDetails.id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Date:</strong> {formatDate(transactionDetails.created_at)}
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      <strong>Status:</strong> Complete
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <Typography variant="body1" sx={{ mb: 4 }}>
                Your funds are now available in your Google Ads account and can be used to run campaigns.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={handleGoToDashboard}
                >
                  View Account
                </Button>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={handleCreateCampaign}
                >
                  Create Campaign
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default GoogleAdsFundsSuccess; 