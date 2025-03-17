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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import googleAdsApi from '../services/googleAdsApi';

const GoogleAdsLinkButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [accountType, setAccountType] = useState('new');
  const [customerId, setCustomerId] = useState('');
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: ''
  });

  // Check if the user has a linked Google Ads account
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping Google Ads account status check');
          return;
        }

        const response = await googleAdsApi.getAccountStatus();
        
        if (response.error === 'No valid token' || response.error === 'Unauthorized') {
          console.log('Token validation failed, skipping Google Ads account status check');
          return;
        }

        if (response.data && response.data.status) {
          setAccountStatus(response.data.status);
        }
      } catch (error) {
        console.error('Error checking Google Ads account status:', error);
        setAccountStatus({ isLinked: false, customerId: '' });
      }
    };

    checkAccountStatus();
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAccountTypeChange = (event) => {
    setAccountType(event.target.value);
  };

  const handleCustomerIdChange = (event) => {
    setCustomerId(event.target.value);
  };

  const handleLinkAccount = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestData = {
        generate_new_account: accountType === 'new',
        customer_id: accountType === 'existing' ? customerId : undefined
      };

      const response = await googleAdsApi.linkAccount(requestData);
      
      if (response && response.success) {
        setSuccess(response.message);
        setAccountStatus({
          isLinked: true,
          customerId: response.data.customer_id
        });
      } else {
        setError('Failed to link Google Ads account. Please try again.');
      }
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
      setError(error.response?.data?.detail || 'Failed to link Google Ads account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isLinked = accountStatus?.isLinked || false;
  const customerIdValue = accountStatus?.customerId || '';

  return (
    <>
      <Button
        variant="contained"
        color={isLinked ? "success" : "primary"}
        startIcon={isLinked ? <CheckCircleIcon /> : <GoogleIcon />}
        onClick={handleOpen}
        sx={{ ml: 2 }}
      >
        {isLinked ? 'Google Ads Linked' : 'Link Google Ads'}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Link Google Ads Account</DialogTitle>
        <DialogContent>
          {isLinked ? (
            <Box sx={{ my: 2 }}>
              <Alert severity="success">
                Your Google Ads account is already linked. Customer ID: {customerIdValue}
              </Alert>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                To create Google Ads campaigns, you need to link your Google Ads account.
                You can either create a new account or link an existing one.
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">Account Option</FormLabel>
                <RadioGroup
                  value={accountType}
                  onChange={handleAccountTypeChange}
                >
                  <FormControlLabel 
                    value="new" 
                    control={<Radio />} 
                    label="Create a new Google Ads account" 
                  />
                  <FormControlLabel 
                    value="existing" 
                    control={<Radio />} 
                    label="Link an existing Google Ads account (currently disabled)" 
                    disabled
                  />
                </RadioGroup>
              </FormControl>

              {accountType === 'existing' && (
                <TextField
                  label="Google Ads Customer ID"
                  variant="outlined"
                  fullWidth
                  value={customerId}
                  onChange={handleCustomerIdChange}
                  placeholder="Enter your Google Ads Customer ID"
                  disabled
                  sx={{ mb: 2 }}
                />
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {!isLinked && (
            <Button 
              onClick={handleLinkAccount} 
              variant="contained" 
              color="primary"
              disabled={loading || (accountType === 'existing' && !customerId)}
            >
              {loading ? <CircularProgress size={24} /> : 'Link Account'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GoogleAdsLinkButton; 