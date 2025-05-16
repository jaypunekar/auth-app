import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import { MonetizationOn as MoneyIcon } from '@mui/icons-material';
import googleAdsApi from '../services/googleAdsApi';

const GoogleAdsFundsButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fundsAmount, setFundsAmount] = useState('');
  const [totalFunds, setTotalFunds] = useState(0);
  const [loadingFunds, setLoadingFunds] = useState(false);

  // Fetch total funds on component mount
  useEffect(() => {
    fetchTotalFunds();
  }, []);

  const fetchTotalFunds = async () => {
    try {
      setLoadingFunds(true);
      const response = await googleAdsApi.getTotalFunds();
      if (response && response.success) {
        setTotalFunds(response.data.total_funds || 0);
      }
    } catch (error) {
      console.error('Error fetching total funds:', error);
    } finally {
      setLoadingFunds(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setFundsAmount('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleFundsAmountChange = (e) => {
    // Only allow numbers and a single decimal point
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setFundsAmount(value);
    }
  };

  const handleAddFunds = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!fundsAmount || parseFloat(fundsAmount) <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }
      
      // Create a checkout session
      const response = await googleAdsApi.createFundsCheckout(parseFloat(fundsAmount));
      
      if (response && response.success && response.data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      setError(error.response?.data?.detail || 'Failed to add funds. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={handleOpen}
          startIcon={<MoneyIcon />}
          disabled={loading}
        >
          Add Funds
        </Button>
        
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {loadingFunds ? (
            <CircularProgress size={10} sx={{ mr: 1 }} />
          ) : (
            <MoneyIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
          )}
          ${totalFunds.toFixed(2)} Available
        </Typography>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add Funds to Google Ads</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <Typography variant="body2" paragraph sx={{ mb: 2 }}>
            Add funds to your Google Ads account to run advertising campaigns.
          </Typography>
          
          <TextField
            label="Amount"
            type="text"
            fullWidth
            value={fundsAmount}
            onChange={handleFundsAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Enter the amount you want to add"
            sx={{ mb: 2 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            You will be redirected to a secure payment page to complete the transaction.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddFunds} 
            variant="contained" 
            color="primary"
            disabled={loading || !fundsAmount || parseFloat(fundsAmount) <= 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Continue to Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoogleAdsFundsButton; 