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
  const [customerId, setCustomerId] = useState(() => {
    // Initialize from localStorage if exists
    return localStorage.getItem('googleAds_customerId') || '';
  });
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: '',
    connectionType: '',
    availableFunds: 0
  });
  const [linkStatus, setLinkStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(() => {
    // Initialize from localStorage if exists and valid
    const savedStep = parseInt(localStorage.getItem('googleAds_activeStep'));
    return !isNaN(savedStep) ? savedStep : 0;
  });
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsLoading, setFundsLoading] = useState(false);
  
  // State for the unlink confirmation dialogs
  const [unlinkConfirmStep, setUnlinkConfirmStep] = useState(0);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [hasActiveCampaigns, setHasActiveCampaigns] = useState(false);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [pauseCampaigns, setPauseCampaigns] = useState(false);
  const [unlinkSuccess, setUnlinkSuccess] = useState(false);

  const steps = ['Select Account Type', 'Enter Account ID', 'Link Status'];

  // Automatically open dialog if there's a pending invitation
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('googleAds_activeStep'));
    const savedCustomerId = localStorage.getItem('googleAds_customerId');
    
    // If we have a saved step 2 (link status) and a customer ID, and not linked yet
    if (savedStep === 2 && savedCustomerId && !accountStatus.isLinked) {
      setOpen(true);
    }
  }, [accountStatus.isLinked]);

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
            
            // Clear localStorage
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
            
            // Show notification about account status change
            setNotification({
              open: true,
              message: 'Your Google Ads account link has been deactivated. Please reconnect your account.'
            });
          }
          
          // If the account is linked, we should reset the activeStep to avoid showing the link status page
          if (newStatus.isLinked) {
            setActiveStep(0);
            localStorage.removeItem('googleAds_activeStep');
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
            
            // Clear localStorage since we're now linked
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
            
            // Re-fetch the account status to ensure the database is updated
            const statusResponse = await googleAdsApi.getAccountStatus();
            if (statusResponse && statusResponse.data) {
              setAccountStatus({
                isLinked: statusResponse.data.is_linked || false,
                customerId: statusResponse.data.customer_id || customerId
              });
            }
          } else if (response.data && (response.data.status === "DECLINED" || response.data.status === "REFUSED")) {
            // If the invitation was declined, show appropriate message
            setError('The invitation has been declined. Please try again if you want to link this account.');
            // Don't immediately reset - allow user to see the status and errors
          } else if (response.data && response.data.status === "NOT_FOUND") {
            // If the link is not found, show an error and reset
            setError('Link request not found or expired. Please try again.');
            setTimeout(() => {
              setActiveStep(0);
              setCustomerId('');
              
              // Clear localStorage
              localStorage.removeItem('googleAds_customerId');
              localStorage.removeItem('googleAds_activeStep');
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
    // Don't reset activeStep if we're in the middle of waiting for an invitation
    if (!(activeStep === 2 && customerId && !accountStatus.isLinked && linkStatus && linkStatus.status === "PENDING")) {
      setActiveStep(0);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAccountTypeChange = (event) => {
    setAccountType(event.target.value);
  };

  const handleCustomerIdChange = (event) => {
    const newCustomerId = event.target.value;
    setCustomerId(newCustomerId);
    // Save to localStorage
    localStorage.setItem('googleAds_customerId', newCustomerId);
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
          
          // Clear localStorage since we're now linked
          localStorage.removeItem('googleAds_customerId');
          localStorage.removeItem('googleAds_activeStep');
        } else {
          setError('Failed to create Google Ads account. Please try again.');
        }
      } else {
        // Existing account
        const response = await googleAdsApi.linkExistingAccount(customerId);
        
        if (response && response.success) {
          setSuccess('Link request sent successfully! An invitation email has been sent to your registered email address with instructions on how to accept the invitation.');
          setActiveStep(2); // Move to status check step
          
          // Save step to localStorage
          localStorage.setItem('googleAds_activeStep', '2');
          localStorage.setItem('googleAds_customerId', customerId);
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
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      // Save step to localStorage
      localStorage.setItem('googleAds_activeStep', nextStep.toString());
    }
    setError('');
  };

  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    // Save step to localStorage
    localStorage.setItem('googleAds_activeStep', prevStep.toString());
    setError('');
  };

  const handleCheckStatus = async () => {
    if (!customerId) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await googleAdsApi.checkLinkStatus(customerId);
      setLinkStatus(response.data);
      
      // If the account is now active, update accountStatus
      if (response.data && (response.data.is_active || response.data.status === "ACTIVE")) {
        setSuccess('Google Ads account successfully linked!');
        setAccountStatus({
          isLinked: true,
          customerId: customerId
        });
        
        // Clear localStorage since we're now linked
        localStorage.removeItem('googleAds_customerId');
        localStorage.removeItem('googleAds_activeStep');
        
        // Re-fetch the account status to ensure the database is updated
        const statusResponse = await googleAdsApi.getAccountStatus();
        if (statusResponse && statusResponse.data) {
          setAccountStatus({
            isLinked: statusResponse.data.is_linked || false,
            customerId: statusResponse.data.customer_id || customerId
          });
        }
      } else if (response.data && (response.data.status === "DECLINED" || response.data.status === "REFUSED")) {
        // Handle declined invitation
        setError('The invitation has been declined. Please start over if you want to link this account.');
      } else if (response.data && response.data.status === "NOT_FOUND") {
        setError('Link request not found or expired. Please try again.');
      }
    } catch (error) {
      console.error('Error checking link status:', error);
      setError(error.response?.data?.detail || 'Failed to check link status. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  Link Status: <Chip 
                    label={linkStatus.status} 
                    color={
                      linkStatus.status === "ACTIVE" ? "success" : 
                      linkStatus.status === "PENDING" ? "warning" : 
                      (linkStatus.status === "DECLINED" || linkStatus.status === "REFUSED") ? "error" :
                      "default"
                    }
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {linkStatus.message}
                </Typography>
                {linkStatus.is_active || linkStatus.status === "ACTIVE" ? (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Google Ads account successfully linked!
                  </Alert>
                ) : linkStatus.status === "PENDING" ? (
                  <>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Please accept the invitation in your Google Ads account. An email with detailed instructions has been sent to your registered email address. Status will be checked automatically.
                    </Alert>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        color="primary" 
                        onClick={handleCheckStatus}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                      >
                        Check Now
                      </Button>
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                      After accepting the invitation in Google Ads, it may take a few minutes for the status to update.
                    </Typography>
                  </>
                ) : (linkStatus.status === "DECLINED" || linkStatus.status === "REFUSED") ? (
                  <>
                    <Alert severity="error" sx={{ mt: 2 }}>
                      The invitation has been declined. You'll need to start over if you want to link this account.
                    </Alert>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => {
                          // Reset the state
                          setActiveStep(0);
                          setCustomerId('');
                          setLinkStatus(null);
                          
                          // Clear localStorage
                          localStorage.removeItem('googleAds_customerId');
                          localStorage.removeItem('googleAds_activeStep');
                        }}
                      >
                        Start Over
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Your account link status is {linkStatus.status}. Please try again or contact support.
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

  // Function to handle the unlink account process
  const handleUnlinkAccount = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check for active campaigns
      const activeCampaignsResponse = await googleAdsApi.checkActiveCampaigns();
      if (activeCampaignsResponse && activeCampaignsResponse.data) {
        setHasActiveCampaigns(activeCampaignsResponse.data.has_active_campaigns);
        setActiveCampaignCount(activeCampaignsResponse.data.active_campaign_count);
      }
      
      // Open the unlink dialog with step 1
      setUnlinkConfirmStep(1);
      setShowUnlinkDialog(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking active campaigns:', error);
      setError(error.response?.data?.detail || 'Failed to check account status. Please try again.');
      setLoading(false);
    }
  };

  // Handle closing the unlink dialog
  const handleCloseUnlinkDialog = () => {
    setShowUnlinkDialog(false);
    setUnlinkConfirmStep(0);
    setPauseCampaigns(false);
    setUnlinkSuccess(false);
  };

  // Handle the first confirmation step (active campaigns warning)
  const handleFirstConfirmStep = (confirmed) => {
    if (!confirmed) {
      // User chose "No, keep my account"
      handleCloseUnlinkDialog();
      return;
    }
    
    // User chose "Yes, pause my account and unlink anyway"
    if (hasActiveCampaigns) {
      setPauseCampaigns(true);
    }
    
    // Move to step 2 (data deletion warning)
    setUnlinkConfirmStep(2);
  };

  // Handle the second confirmation step (data deletion warning)
  const handleSecondConfirmStep = async (confirmed) => {
    if (!confirmed) {
      // User chose "No, keep my account"
      handleCloseUnlinkDialog();
      return;
    }
    
    // User chose "Yes, unlink my account"
      try {
        setLoading(true);
      const response = await googleAdsApi.unlinkAccount(pauseCampaigns);
      
        if (response && response.success) {
          setSuccess(response.message || 'Account unlinked successfully');
          setAccountStatus({
            isLinked: false,
            customerId: '',
            connectionType: '',
            availableFunds: 0
          });
        
        // Move to step 3 (success and offer to add a different account)
        setUnlinkConfirmStep(3);
        setUnlinkSuccess(true);
        } else {
          setError('Failed to unlink account. Please try again.');
        handleCloseUnlinkDialog();
        }
      } catch (error) {
        console.error('Error unlinking account:', error);
        setError(error.response?.data?.detail || 'Failed to unlink account. Please try again.');
      handleCloseUnlinkDialog();
      } finally {
        setLoading(false);
      }
  };

  // Handle the final step (add a different account)
  const handleAddDifferentAccount = (confirmed) => {
    handleCloseUnlinkDialog();
    
    if (confirmed) {
      // User chose "Yes" to add a different account
      setOpen(true);
      setActiveStep(0);
    } else {
      // User chose "No" - just close everything
      setOpen(false);
    }
    
    // Notify the user about the account being unlinked
    setNotification({
      open: true,
      message: 'Your Google Ads account has been unlinked.'
    });
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
                    {accountStatus.connectionType === 'created' 
                      ? 'This will notify our team to remove your account from our system.'
                      : 'This will remove your account connection from our system.'}
                    </Typography>
                  </Grid>
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
                  onClick={handleCheckStatus}
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

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      />

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onClose={handleCloseAddFundsDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add Funds to Google Ads</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Add funds to your Google Ads account. This will be processed via Stripe.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="text"
            fullWidth
            value={fundsAmount}
            onChange={handleFundsAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddFundsDialog}>Cancel</Button>
          <Button 
            onClick={handleAddFunds} 
            color="primary" 
            variant="contained" 
            disabled={fundsLoading || !fundsAmount}
          >
            {fundsLoading ? <CircularProgress size={24} /> : 'Proceed to Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Account Confirmation Dialog Series */}
      <Dialog 
        open={showUnlinkDialog} 
        onClose={handleCloseUnlinkDialog}
        maxWidth="sm" 
        fullWidth
      >
        {/* Step 1: Active Campaign Warning */}
        {unlinkConfirmStep === 1 && (
          <>
            <DialogTitle>
              {hasActiveCampaigns ? 'Active Campaigns Detected' : 'Unlink Google Ads Account'}
            </DialogTitle>
            <DialogContent>
              {hasActiveCampaigns ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You have {activeCampaignCount} active {activeCampaignCount === 1 ? 'campaign' : 'campaigns'} in your Google Ads account.
                  </Alert>
                  <Typography variant="body1" gutterBottom>
                    Do you want to pause your active campaigns and unlink your account anyway?
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to unlink your Google Ads account?
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleFirstConfirmStep(false)}>
                No, Keep My Account
              </Button>
              <Button 
                onClick={() => handleFirstConfirmStep(true)} 
                color="primary" 
                variant="contained"
                disabled={loading}
              >
                {hasActiveCampaigns ? 'Yes, Pause and Unlink Anyway' : 'Yes, Continue'}
              </Button>
            </DialogActions>
          </>
        )}
        
        {/* Step 2: Data Deletion Warning */}
        {unlinkConfirmStep === 2 && (
          <>
            <DialogTitle>Confirm Account Unlinking</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Unlinking your account will delete your connection data from our system.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to unlink your Google Ads account?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleSecondConfirmStep(false)}>
                No, Keep My Account
              </Button>
              <Button 
                onClick={() => handleSecondConfirmStep(true)} 
                color="primary" 
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Yes, Unlink My Account'}
              </Button>
            </DialogActions>
          </>
        )}
        
        {/* Step 3: Success and Add Different Account */}
        {unlinkConfirmStep === 3 && unlinkSuccess && (
          <>
            <DialogTitle>Account Successfully Unlinked</DialogTitle>
            <DialogContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your account will be deleted from our system within 24 hours.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Would you like to add a different Google Ads account?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleAddDifferentAccount(false)}>
                No
              </Button>
              <Button 
                onClick={() => handleAddDifferentAccount(true)} 
                color="primary" 
                variant="contained"
              >
                Yes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default GoogleAdsLinkButton; 