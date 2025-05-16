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
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoneyIcon from '@mui/icons-material/Money';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import HistoryIcon from '@mui/icons-material/History';
import googleAdsApi from '../services/googleAdsApi';

const GoogleAdsLinkButton = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accountType, setAccountType] = useState('new');
  const [customerId, setCustomerId] = useState(() => {
    return localStorage.getItem('googleAds_customerId') || '';
  });
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: '',
    connectionType: '',
    availableFunds: 0,
    hasPreviousAccounts: false,
    previousAccounts: []
  });
  const [linkStatus, setLinkStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(() => {
    const savedStep = parseInt(localStorage.getItem('googleAds_activeStep'));
    return !isNaN(savedStep) ? savedStep : 0;
  });
  const [notification, setNotification] = useState({ open: false, message: '' });
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [fundsAmount, setFundsAmount] = useState('');
  const [fundsLoading, setFundsLoading] = useState(false);
  
  // State for previously linked accounts
  const [previouslyLinkedAccounts, setPreviouslyLinkedAccounts] = useState([]);
  const [loadingPreviousAccounts, setLoadingPreviousAccounts] = useState(false);
  
  // Simplified unlink dialog state
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);

  const steps = ['Select Account Type', 'Enter Account ID', 'Link Status'];

  // Automatically open dialog if there's a pending invitation
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('googleAds_activeStep'));
    const savedCustomerId = localStorage.getItem('googleAds_customerId');
    
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
            availableFunds: response.data.available_funds || 0,
            hasPreviousAccounts: response.data.has_previous_accounts || false,
            previousAccounts: response.data.previous_accounts || []
          };
          
          // If status changed from linked to unlinked, reset the component and notify
          if (accountStatus.isLinked && !newStatus.isLinked) {
            console.log("Account link status changed from active to inactive, resetting");
            setCustomerId('');
            setActiveStep(0);
            setLinkStatus(null);
            setError('');
            setSuccess('');
            
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
            
            setNotification({
              open: true,
              message: 'Your Google Ads account link has been deactivated. Please reconnect your account.'
            });
          }
          
          // If the account is linked, we should reset the activeStep 
          if (newStatus.isLinked) {
            setActiveStep(0);
            localStorage.removeItem('googleAds_activeStep');
          }
          
          setAccountStatus(newStatus);
          
          // Update the previously linked accounts if available from the response
          if (newStatus.hasPreviousAccounts && newStatus.previousAccounts.length > 0) {
            setPreviouslyLinkedAccounts(newStatus.previousAccounts);
          }
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

  // Fetch previously linked accounts when dialog opens
  useEffect(() => {
    if (open && !accountStatus.isLinked) {
      fetchPreviouslyLinkedAccounts();
    }
  }, [open, accountStatus.isLinked]);

  // Function to fetch previously linked accounts
  const fetchPreviouslyLinkedAccounts = async () => {
    try {
      setLoadingPreviousAccounts(true);
      const response = await googleAdsApi.getPreviouslyLinkedAccounts();
      if (response && response.success && response.data.accounts) {
        setPreviouslyLinkedAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching previously linked accounts:', error);
    } finally {
      setLoadingPreviousAccounts(false);
    }
  };

  // Handle reconnecting to a previously linked account
  const handleReconnectAccount = async (accountId) => {
    // Find the account in the list
    const account = previouslyLinkedAccounts.find(acc => acc.id === accountId);
    if (account) {
      setCustomerId(account.customer_id);
      setAccountType('existing');
      
      // Instead of just moving to next step, try to link immediately
      try {
        setLoading(true);
        const response = await googleAdsApi.linkExistingAccount(account.customer_id);
        
        if (response && response.success) {
          // If the account is already active, we're done
          if (response.data.status === "ACTIVE") {
            setSuccess('Google Ads account successfully reconnected!');
            setAccountStatus({
              isLinked: true,
              customerId: response.data.customer_id
            });
            
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
            
            // Close the dialog immediately
            setOpen(false);
          } else {
            // If pending, move to the status step
            setActiveStep(2);
            localStorage.setItem('googleAds_activeStep', "2");
            setLinkStatus(response.data);
          }
        } else {
          setError(response?.message || 'Failed to reconnect Google Ads account.');
        }
      } catch (error) {
        console.error('Error reconnecting account:', error);
        setError(error.response?.data?.detail || 'Failed to reconnect Google Ads account.');
      } finally {
        setLoading(false);
      }
    }
  };

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
            
            // Close the dialog immediately once active
            setOpen(false);
            
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
          
          localStorage.removeItem('googleAds_customerId');
          localStorage.removeItem('googleAds_activeStep');
          
          // Close the dialog immediately on success
          setOpen(false);
        } else {
          setError('Failed to create Google Ads account. Please try again.');
        }
      } else {
        // Existing account
        const response = await googleAdsApi.linkExistingAccount(customerId);
        
        if (response && response.success) {
          // If the account is already active, we're done
          if (response.data.status === "ACTIVE") {
            setSuccess('Google Ads account successfully linked!');
            setAccountStatus({
              isLinked: true,
              customerId: response.data.customer_id
            });
            
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
            
            // Close the dialog immediately
            setOpen(false);
          } else {
            // If pending, move to the next step and show instructions
            setActiveStep(2);
            localStorage.setItem('googleAds_activeStep', "2");
            
            // Set up to check status later
            setLinkStatus(response.data);
          }
        } else {
          // Check for the specific "already has an active account" error
          const errorMessage = response?.message || '';
          if (errorMessage.includes('already has an active Google Ads account')) {
            // Extract the customer ID from the error message using regex
            const idMatch = errorMessage.match(/ID: (\d+)/);
            const existingId = idMatch ? idMatch[1] : null;
            
            setError(
              <>
                {errorMessage}
                <Box mt={2}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={() => handleForceUnlink(existingId)}
                  >
                    Force Unlink Previous Account
                  </Button>
                </Box>
              </>
            );
          } else {
            setError(errorMessage || 'Failed to link Google Ads account. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error linking Google Ads account:', error);
      // Check if the error is about already having an active account
      const errorDetail = error.response?.data?.detail || '';
      if (errorDetail.includes('already has an active Google Ads account')) {
        // Extract the customer ID from the error message using regex
        const idMatch = errorDetail.match(/ID: (\d+)/);
        const existingId = idMatch ? idMatch[1] : null;
        
        setError(
          <>
            {errorDetail}
            <Box mt={2}>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={() => handleForceUnlink(existingId)}
              >
                Force Unlink Previous Account
              </Button>
            </Box>
          </>
        );
      } else {
        setError(errorDetail || 'Failed to link Google Ads account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to force unlink a previous account
  const handleForceUnlink = async (customerId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await googleAdsApi.forceUnlinkAccount(customerId);
      
      if (response && response.success) {
        setSuccess('Previous account successfully unlinked. You can now link your new account.');
        // Refresh the account status
        const statusResponse = await googleAdsApi.getAccountStatus();
        if (statusResponse && statusResponse.data) {
          setAccountStatus({
            isLinked: statusResponse.data.is_linked || false,
            customerId: statusResponse.data.customer_id || '',
            connectionType: statusResponse.data.connection_type || '',
            availableFunds: statusResponse.data.available_funds || 0,
            hasPreviousAccounts: statusResponse.data.has_previous_accounts || false,
            previousAccounts: statusResponse.data.previous_accounts || []
          });
        }
        
        // If we forced an unlink from the existing account flow, stay on the same step
        if (activeStep === 1) {
          // Do nothing, keep the user on step 1
        } else {
          // Otherwise, reset to step 0
          setActiveStep(0);
        }
      } else {
        setError(response?.message || 'Failed to unlink previous account. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error force unlinking account:', error);
      setError(error.response?.data?.detail || 'Failed to unlink previous account. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Before moving to step 1, validate the selection
      if (accountType === 'existing') {
        setActiveStep(1);
        // Save the step to localStorage
        localStorage.setItem('googleAds_activeStep', '1');
      } else if (accountType === 'new') {
        // For new accounts, we can directly submit
        handleLinkAccount();
      }
    } else if (activeStep === 1) {
      // Validate customer ID
      if (!customerId || customerId.trim() === '') {
        setError('Please enter a valid Customer ID');
        return;
      }
      
      // For existing accounts, submit the link request
      handleLinkAccount();
    }
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
        
        // Close the dialog immediately
        setOpen(false);
        
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
          <Box>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Choose an option</FormLabel>
              <RadioGroup
                aria-label="account-type"
                name="account-type"
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
                  label="Connect an existing Google Ads account" 
                />
              </RadioGroup>
            </FormControl>
            
            {/* Previously Linked Accounts Section - Only show if there are any */}
            {previouslyLinkedAccounts.length > 0 && (
              <Box mt={3} p={2} border={1} borderRadius={1} borderColor="divider">
                <Typography variant="subtitle1" gutterBottom>
                  <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Previously Connected Accounts
                </Typography>
                
                {loadingPreviousAccounts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List>
                    {previouslyLinkedAccounts.map((account) => (
                      <ListItem
                        key={account.id}
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: 'background.paper'
                        }}
                      >
                        <ListItemText
                          primary={account.customer_id}
                          secondary={account.connection_type === 'created' ? 'Created account' : 'Linked account'}
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={() => handleReconnectAccount(account.id)}
                          >
                            Reconnect
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>
        );
      case 1:
        return (
          <Box>
            {accountType === 'existing' && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Enter your Google Ads Customer ID
                </Typography>
                <TextField
                  label="Customer ID"
                  value={customerId}
                  onChange={handleCustomerIdChange}
                  fullWidth
                  margin="normal"
                  placeholder="e.g. 123-456-7890"
                  helperText="Find this in your Google Ads account settings"
                  required
                />
              </Box>
            )}
          </Box>
        );
      case 2:
        return (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Checking connection status...
                </Typography>
              </Box>
            ) : (
              <Box>
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
                
                {linkStatus && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Status: {linkStatus.status}
                    </Typography>
                    
                    {linkStatus.status === "PENDING" && (
                      <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Invitation sent to your Google Ads account. Please accept it to complete the connection.
                        </Alert>
                        <Typography variant="body2" gutterBottom>
                          To accept the invitation:
                        </Typography>
                        <ol>
                          <li>Log in to <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer">ads.google.com</a></li>
                          <li>Go to Tools &amp; Settings &gt; Setup &gt; Access and security</li>
                          <li>Accept the invitation from our account</li>
                        </ol>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          This page will update automatically once you accept.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Simplified unlinking process
  const handleUnlinkAccount = async () => {
    setShowUnlinkDialog(true);
  };

  const handleCloseUnlinkDialog = () => {
    setShowUnlinkDialog(false);
  };

  // Simplified unlink confirmation
  const handleConfirmUnlink = async () => {
    try {
      setLoading(true);
      
      // Call API to unlink account
      const response = await googleAdsApi.unlinkAccount(false); // No need to pause campaigns with simplified flow
      
      if (response && response.success) {
        setShowUnlinkDialog(false);
        setAccountStatus({
          isLinked: false,
          customerId: '',
          connectionType: '',
          availableFunds: 0
        });
        
        // Show notification
        setNotification({
          open: true,
          message: 'Your Google Ads account has been disconnected.'
        });
        
        // Ask if they want to connect a different account
        setOpen(true);
        setActiveStep(0);
      } else {
        setError('Failed to disconnect account. Please try again.');
        setShowUnlinkDialog(false);
      }
    } catch (error) {
      console.error('Error unlinking account:', error);
      setError(error.response?.data?.detail || 'Failed to disconnect account. Please try again.');
      setShowUnlinkDialog(false);
    } finally {
      setLoading(false);
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
      {accountStatus.isLinked ? (
        // Show connected account info
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            pl: 2, 
            pr: 2, 
            py: 1, 
            borderRadius: 1, 
            bgcolor: 'success.light',
            color: 'white',
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 1 }} /> 
              Connected to Google Ads {accountStatus.customerId && `(${accountStatus.customerId})`}
            </Typography>
            <Button
              variant="outlined" 
              size="small" 
              color="error"
              onClick={handleUnlinkAccount}
              startIcon={<LinkOffIcon />}
              sx={{ 
                bgcolor: 'white', 
                '&:hover': {
                  bgcolor: 'error.light',
                  color: 'white'
                } 
              }}
            >
              Disconnect
            </Button>
          </Box>
                
          {accountStatus.connectionType === 'created' && (
            <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Available funds: ${accountStatus.availableFunds?.toFixed(2) || '0.00'}
              </Typography>
              <Button
                variant="outlined" 
                size="small"
                onClick={handleOpenAddFundsDialog}
                startIcon={<MoneyIcon />}
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white'
                  } 
                }}
              >
                Add Funds
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        // Show connect button
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleOpen}
            startIcon={<GoogleIcon />}
          >
            Connect Google Ads
          </Button>
          
          {/* Only show this button if there are actually previous accounts */}
          {accountStatus.hasPreviousAccounts && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpen}
              startIcon={<HistoryIcon />}
            >
              View Previous Accounts
            </Button>
          )}
        </Box>
      )}

      {/* Connect account dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {activeStep === 0 ? "Connect Google Ads Account" : 
           activeStep === 1 ? "Enter Account ID" :
           "Connection Status"}
        </DialogTitle>
        <DialogContent>
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
          
          <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {getStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {activeStep > 0 && activeStep < 2 && (
            <Button onClick={handleBack} color="primary">
              Back
            </Button>
          )}
          {activeStep < 2 && !loading && (
            <Button 
              onClick={handleNext} 
              variant="contained" 
              color="primary"
              disabled={activeStep === 1 && (!customerId || customerId.trim() === '')}
            >
              {activeStep === 1 ? "Connect Account" : "Next"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Previously Linked Accounts section with ID for scrolling */}
      <div id="previously-linked-accounts"></div>

      {/* Add funds dialog */}
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

      {/* Simplified Unlink Dialog */}
      <Dialog 
        open={showUnlinkDialog} 
        onClose={handleCloseUnlinkDialog}
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle>Disconnect Google Ads Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to disconnect your Google Ads account?
          </Typography>
          <Alert severity="info" sx={{ mt: 1 }}>
            You can always reconnect this account later.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnlinkDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmUnlink} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Disconnect'}
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