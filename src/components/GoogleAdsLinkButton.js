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
  FormLabel,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Snackbar,
  Chip,
  Grid,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoneyIcon from '@mui/icons-material/Money';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import googleAdsApi from '../services/googleAdsApi';

const GoogleAdsLinkButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountType, setAccountType] = useState('new');
  const [customerId, setCustomerId] = useState('');
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: '',
    connectionType: '',
    availableFunds: 0
  });
  const [linkStatus, setLinkStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsLoading, setFundsLoading] = useState(false);
  
  const steps = ['Select Account Type', 'Enter Account ID', 'Link Status'];

  // Check if the user already has a linked account and refresh status periodically
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const response = await googleAdsApi.getAccountStatus();
        if (response && response.data) {
          const newStatus = {
            isLinked: response.data.is_linked || false,
            customerId: response.data.customer_id || '',
            connectionType: response.data.connection_type || '',
            availableFunds: response.data.available_funds || 0
          };
          
          // If status changed from linked to unlinked, reset the component and notify
          if (accountStatus.isLinked && !newStatus.isLinked) {
            console.log("Account link status changed from active to inactive, resetting");
            setCustomerId('');
            setActiveStep(0);
            setLinkStatus(null);
            setError('');
            setSuccess('');
            
            // Show notification about account status change
            setNotification({
              open: true,
              message: 'Your Google Ads account link has been deactivated. Please reconnect your account.'
            });
          }
          
          setAccountStatus(newStatus);
        }
      } catch (error) {
        console.error('Error checking Google Ads account status:', error);
      }
    };

    // Check immediately on mount
    checkAccountStatus();
    
    // Then check every 5 minutes
    const intervalId = setInterval(checkAccountStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [accountStatus.isLinked]);

  // Check link status if customerId is available and we're on the status step
  useEffect(() => {
    if (activeStep === 2 && customerId && !accountStatus.isLinked) {
      const checkLinkStatus = async () => {
        try {
          setLoading(true);
          const response = await googleAdsApi.checkLinkStatus(customerId);
          setLinkStatus(response.data);
          
          // If the account is active, update accountStatus and show success message
          if (response.data && (response.data.is_active || response.data.status === "ACTIVE")) {
            console.log("Account link is active, updating status");
            setAccountStatus({
              isLinked: true,
              customerId: customerId
            });
            setSuccess('Google Ads account successfully linked!');
            
            // Re-fetch the account status to ensure the database is updated
            const statusResponse = await googleAdsApi.getAccountStatus();
            if (statusResponse && statusResponse.data) {
              setAccountStatus({
                isLinked: statusResponse.data.is_linked || false,
                customerId: statusResponse.data.customer_id || customerId
              });
            }
          } else if (response.data && response.data.status === "NOT_FOUND") {
            // If the link is not found, show an error and reset
            setError('Link request not found or expired. Please try again.');
            setTimeout(() => {
              setActiveStep(0);
              setCustomerId('');
            }, 3000);
          }
          setLoading(false);
        } catch (error) {
          console.error('Error checking link status:', error);
          setError(error.response?.data?.detail || 'Failed to check link status. Please try again.');
          setLoading(false);
        }
      };
      
      const intervalId = setInterval(checkLinkStatus, 60000); // Check every minute
      checkLinkStatus(); // Check immediately
      
      return () => clearInterval(intervalId);
    }
  }, [activeStep, customerId, accountStatus.isLinked]);

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setSuccess('');
    setActiveStep(0);
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
    setError('');
    setSuccess('');

    try {
      if (accountType === 'new') {
        const requestData = { generate_new_account: true };
        const response = await googleAdsApi.linkAccount(requestData);
        
        if (response && response.success) {
          setSuccess(response.message);
          setAccountStatus({
            isLinked: true,
            customerId: response.data.customer_id
          });
        } else {
          setError('Failed to create Google Ads account. Please try again.');
        }
      } else {
        // Existing account
        const response = await googleAdsApi.linkExistingAccount(customerId);
        
        if (response && response.success) {
          setSuccess('Link request sent successfully! Check your Google Ads account for an invitation.');
          setActiveStep(2); // Move to status check step
        } else {
          setError('Failed to send link request. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
      setError(error.response?.data?.detail || 'Failed to link Google Ads account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // If we're creating a new account, we should skip the customer ID step
    if (activeStep === 0 && accountType === 'new') {
      handleLinkAccount(); // Directly create account when "new" is selected
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError('');
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormControl component="fieldset" sx={{ mb: 3, mt: 2 }}>
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
                label="Link an existing Google Ads account" 
              />
            </RadioGroup>
          </FormControl>
        );
      case 1:
        return (
          <Box sx={{ my: 2 }}>
            <TextField
              label="Google Ads Customer ID"
              variant="outlined"
              fullWidth
              value={customerId}
              onChange={handleCustomerIdChange}
              placeholder="Format: 123-456-7890"
              required
              helperText="Enter your Google Ads customer ID (e.g., 123-456-7890)"
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              You can find your customer ID in the top right corner of your Google Ads account.
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ my: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : linkStatus ? (
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Link Status: {linkStatus.status}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {linkStatus.message}
                </Typography>
                {linkStatus.is_active ? (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Google Ads account successfully linked!
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Please accept the invitation in your Google Ads account. Status will be checked automatically.
                  </Alert>
                )}
              </Paper>
            ) : (
              <Typography>
                Checking link status...
              </Typography>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const handleUnlinkAccount = async () => {
    if (window.confirm("Are you sure you want to unlink your Google Ads account?")) {
      try {
        setLoading(true);
        const response = await googleAdsApi.unlinkAccount();
        if (response && response.success) {
          setSuccess(response.message || 'Account unlinked successfully');
          setAccountStatus({
            isLinked: false,
            customerId: '',
            connectionType: '',
            availableFunds: 0
          });
          setOpen(false);
          setNotification({
            open: true,
            message: 'Your Google Ads account has been unlinked.'
          });
        } else {
          setError('Failed to unlink account. Please try again.');
        }
      } catch (error) {
        console.error('Error unlinking account:', error);
        setError(error.response?.data?.detail || 'Failed to unlink account. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenAddFundsDialog = () => {
    setShowAddFundsDialog(true);
    setFundsAmount('');
    setError('');
  };

  const handleCloseAddFundsDialog = () => {
    setShowAddFundsDialog(false);
  };

  const handleFundsAmountChange = (event) => {
    // Only allow positive numbers
    const value = event.target.value;
    if (value === '' || (/^\d+(\.\d{0,2})?$/.test(value) && parseFloat(value) > 0)) {
      setFundsAmount(value);
    }
  };

  const handleAddFunds = async () => {
    if (!fundsAmount || parseFloat(fundsAmount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setFundsLoading(true);
      
      // Create Stripe checkout session instead of directly adding funds
      const response = await googleAdsApi.createFundsCheckout(parseFloat(fundsAmount));
      
      if (response && response.success) {
        // Redirect to Stripe checkout
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error.response?.data?.detail || 'Failed to create checkout session. Please try again.');
    } finally {
      setFundsLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Button
        variant="contained"
        color={accountStatus.isLinked ? "success" : "primary"}
        startIcon={accountStatus.isLinked ? <CheckCircleIcon /> : <GoogleIcon />}
        onClick={handleOpen}
        sx={{ ml: 2 }}
      >
        {accountStatus.isLinked ? 'Google Ads Linked' : 'Link Google Ads'}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Google Ads Account</DialogTitle>
        <DialogContent>
          {accountStatus.isLinked ? (
            <Box sx={{ my: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your Google Ads account is linked
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Customer ID: {accountStatus.customerId}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1">
                    Connection Type: 
                    <Chip 
                      label={accountStatus.connectionType === 'created' ? 'Created by Us' : 'Linked External Account'} 
                      color={accountStatus.connectionType === 'created' ? 'secondary' : 'primary'} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                
                {accountStatus.connectionType === 'created' && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, mt: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Available Funds
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        ${accountStatus.availableFunds.toFixed(2)}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddCircleIcon />}
                        onClick={handleOpenAddFundsDialog}
                        sx={{ mt: 1 }}
                      >
                        Add Funds
                      </Button>
                    </Paper>
                  </Grid>
                )}
                
                {accountStatus.connectionType === 'linked' && (
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LinkOffIcon />}
                      onClick={handleUnlinkAccount}
                      disabled={loading}
                    >
                      Unlink Account
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      You can unlink this account since it's an externally managed account
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                To create Google Ads campaigns, you need to link your Google Ads account.
                You can either create a new account or link an existing one.
              </Typography>

              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {getStepContent(activeStep)}

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
          {!accountStatus.isLinked && (
            <>
              {activeStep > 0 && (
                <Button 
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {activeStep === steps.length - 1 ? (
                <Button 
                  onClick={() => googleAdsApi.checkLinkStatus(customerId)}
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Check Status'}
                </Button>
              ) : activeStep === 1 ? (
                <Button 
                  onClick={handleLinkAccount} 
                  variant="contained" 
                  color="primary"
                  disabled={loading || (accountType === 'existing' && !customerId)}
                >
                  {loading ? <CircularProgress size={24} /> : 'Link Account'}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext} 
                  variant="contained" 
                  color="primary"
                  disabled={loading}
                >
                  {activeStep === 0 && accountType === 'new' 
                   ? (loading ? <CircularProgress size={24} /> : 'Create Account') 
                   : 'Next'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onClose={handleCloseAddFundsDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add Funds to Google Ads with Stripe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Add funds to your Google Ads account to run campaigns. Enter an amount and you'll be redirected to Stripe to complete the payment.
          </Typography>
          
          <TextField
            label="Amount"
            variant="outlined"
            fullWidth
            value={fundsAmount}
            onChange={handleFundsAmountChange}
            required
            type="text"
            sx={{ mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MoneyIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddFundsDialog}>Cancel</Button>
          <Button 
            onClick={handleAddFunds} 
            variant="contained" 
            color="primary"
            disabled={fundsLoading || !fundsAmount}
          >
            {fundsLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </>
  );
};

export default GoogleAdsLinkButton; 