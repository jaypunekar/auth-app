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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoneyIcon from '@mui/icons-material/Money';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
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
    availableFunds: 0,
    hasPreviousAccounts: false,
    previousAccounts: []
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
  
  // State for previously linked accounts
  const [previouslyLinkedAccounts, setPreviouslyLinkedAccounts] = useState([]);
  const [loadingPreviousAccounts, setLoadingPreviousAccounts] = useState(false);
  
  // State for unlinked accounts
  const [unlinkedAccounts, setUnlinkedAccounts] = useState([]);
  const [loadingUnlinkedAccounts, setLoadingUnlinkedAccounts] = useState(false);
  
  // State for the unlink confirmation dialogs
  const [unlinkConfirmStep, setUnlinkConfirmStep] = useState(0);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [hasActiveCampaigns, setHasActiveCampaigns] = useState(false);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [pauseCampaigns, setPauseCampaigns] = useState(false);
  const [unlinkSuccess, setUnlinkSuccess] = useState(false);

  // Add new state for account limits
  const [accountLimits, setAccountLimits] = useState({
    linkedCount: 0,
    maxAllowed: 3,
    canLinkMore: true
  });

  const steps = ['Select Account Type', 'Enter Account ID', 'Link Status'];

  // Define the checkAccountStatus function at component level so it can be used in multiple places
  const checkAccountStatus = async () => {
    try {
      // Set loading state while checking status
      setLoading(true);
      
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
        
        // Extract account limits information
        if (response.data.account_limits) {
          setAccountLimits({
            linkedCount: response.data.account_limits.linked_count || 0,
            maxAllowed: response.data.account_limits.max_allowed || 3,
            canLinkMore: response.data.account_limits.can_link_more !== false
          });
        }
        
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
        
        // Update the previously linked accounts if available from the response
        if (newStatus.hasPreviousAccounts && newStatus.previousAccounts.length > 0) {
          setPreviouslyLinkedAccounts(newStatus.previousAccounts);
        }
      }
    } catch (error) {
      console.error('Error checking Google Ads account status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically open dialog if there's a pending invitation
  useEffect(() => {
    const savedStep = parseInt(localStorage.getItem('googleAds_activeStep'));
    const savedCustomerId = localStorage.getItem('googleAds_customerId');
    
    // If we have a saved step 2 (link status) and a customer ID, and not linked yet
    if (savedStep === 2 && savedCustomerId && !accountStatus.isLinked) {
      setOpen(true);
    }
  }, [accountStatus.isLinked]);

  // Prevent automatic checking on component mount
  useEffect(() => {
    // Only check account status when the component mounts
    checkAccountStatus();
    
    // Do NOT automatically check link status anymore - user will do it manually
    
    // Save customerId to localStorage
    if (customerId) {
      localStorage.setItem('googleAds_customerId', customerId);
    }
    
    if (activeStep !== undefined) {
      localStorage.setItem('googleAds_activeStep', activeStep.toString());
    }
  }, [customerId, activeStep]);

  // Check if the user already has a linked account and refresh status only when mounted
  useEffect(() => {
    // Check immediately on mount
    checkAccountStatus();
    
    // No interval for automatic status checks - rely on manual refreshes instead
    // This reduces backend load by preventing frequent API calls
    
    return () => {}; // No interval to clear
  }, [accountStatus.isLinked]);

  // Fetch previously linked accounts when dialog opens
  useEffect(() => {
    if (open && !accountStatus.isLinked) {
      fetchPreviouslyLinkedAccounts();
      fetchUnlinkedAccounts();
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

  // Function to fetch unlinked accounts
  const fetchUnlinkedAccounts = async () => {
    try {
      setLoadingUnlinkedAccounts(true);
      const response = await googleAdsApi.getUnlinkedAccounts();
      if (response && response.success && response.data.accounts) {
        setUnlinkedAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching unlinked accounts:', error);
    } finally {
      setLoadingUnlinkedAccounts(false);
    }
  };

  // Handle reconnecting to a previously linked account
  const handleReconnectAccount = (accountId) => {
    // Find the account in the list
    const account = previouslyLinkedAccounts.find(acc => acc.id === accountId);
    if (account) {
      setCustomerId(account.customer_id);
      setAccountType('existing');
      // Move to the next step
      handleNext();
    }
  };

  // Handle relinking an unlinked account
  const handleRelinkAccount = async (accountId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await googleAdsApi.relinkAccount(accountId);
      
      if (response && response.success) {
        setSuccess(response.message || 'Account successfully relinked');
        
        // Update account status
        setAccountStatus({
          isLinked: true,
          customerId: response.data.customer_id,
          connectionType: response.data.connection_type,
          availableFunds: response.data.available_funds || 0
        });
        
        // Remove the relinked account from unlinked accounts list
        setUnlinkedAccounts(prevAccounts => 
          prevAccounts.filter(acc => acc.id !== accountId)
        );
        
        // Close the dialog
        setOpen(false);
        
        // Show notification
        setNotification({
          open: true,
          message: 'Your Google Ads account has been relinked successfully.'
        });
      } else {
        setError(response.message || 'Failed to relink account');
      }
    } catch (error) {
      console.error('Error relinking account:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to relink account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check link status if customerId is available and we're on the status step
  useEffect(() => {
    if (activeStep === 2 && customerId && !accountStatus.isLinked) {
      // Don't automatically check status - let user do it manually with the button
      console.log("On status check step - waiting for manual check");
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
    try {
      setLoading(true);
      setError('');
      
      // Format customer ID by removing dashes or other formatting if present
      const formattedCustomerId = customerId.replace(/[^0-9]/g, '');
      
      // Determine which API to call based on account type
      let apiMethod;
      let requestData;
      
      if (accountType === 'new') {
        apiMethod = 'linkAccount';
        requestData = { generate_new_account: true };
      } else {
        apiMethod = 'linkExistingAccount';
        // Make sure we're sending a string, not an object with a string in it
        requestData = { customer_id: formattedCustomerId.toString() };
      }
      
      const response = await googleAdsApi[apiMethod](requestData);
      
      if (response.success) {
        // Display success message
        setSuccess(response.message);
        
        // Store customer ID and step for checking status later
        if (accountType === 'existing') {
          localStorage.setItem('googleAds_customerId', formattedCustomerId);
          localStorage.setItem('googleAds_activeStep', '2'); // Link status step
        }
        
        // If account is already linked, update account status
        if (response.data && (response.data.is_linked || response.data.link_status === 'ACTIVE')) {
          setAccountStatus({
            isLinked: true,
            customerId: formattedCustomerId,
            connectionType: response.data.connection_type || ''
          });
          
          // Close dialog after a short delay
          setTimeout(() => {
            setOpen(false);
            setSuccess('');
            setError('');
            setCustomerId('');
            setActiveStep(0);
            localStorage.removeItem('googleAds_customerId');
            localStorage.removeItem('googleAds_activeStep');
          }, 3000);
        } else {
          // Move to next step to display link status
          setLinkStatus(response.data);
          handleNext();
        }
      } else {
        // Check if this is an upgrade required message for creating new accounts
        if (response.data && response.data.requires_upgrade) {
          setError('Creating a new Google Ads account under our manager requires a Pro subscription. You can link your existing Google Ads account instead.');
        } else {
          setError(response.message || 'Failed to link account');
        }
      }
    } catch (error) {
      console.error('Error linking account:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to link account. Please try again.';
      setError(errorMessage);
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
      console.log('Manual status check response:', response);
      setLinkStatus(response.data);
      
      // If the account is now active, update accountStatus
      if (response.data && (response.data.is_active || response.data.status === "ACTIVE")) {
        setSuccess('Google Ads account successfully linked!');
        
        // Update both local state and parent component state
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
          const newStatus = {
            isLinked: statusResponse.data.is_linked || false,
            customerId: statusResponse.data.customer_id || customerId,
            connectionType: statusResponse.data.connection_type || '',
            availableFunds: statusResponse.data.available_funds || 0
          };
          setAccountStatus(newStatus);
          
          // Show a notification of the successful link
          setNotification({
            open: true,
            message: 'Your Google Ads account is now successfully linked!'
          });
          
          // Close the dialog after a delay on success
          setTimeout(() => {
            setOpen(false);
          }, 2000);
        }
      } else if (response.data && (response.data.status === "DECLINED" || response.data.status === "REFUSED")) {
        // Handle declined invitation
        setError('The invitation has been declined. Please start over if you want to link this account.');
      } else if (response.data && response.data.status === "NOT_FOUND") {
        setError('Link request not found or expired. Please try again.');
      } else if (response.data && response.data.status === "PENDING") {
        // For pending status, just show the information without error
        setSuccess(null); // Clear any previous success
        setError(null); // Clear any previous error
      }
    } catch (error) {
      console.error('Error checking link status:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to check link status. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            {/* Account Limits Information */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom>
                Account Limits
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={(accountLimits.linkedCount / accountLimits.maxAllowed) * 100} 
                  sx={{ flexGrow: 1, mr: 2, height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2">
                  {accountLimits.linkedCount} / {accountLimits.maxAllowed}
                </Typography>
              </Box>
              {!accountLimits.canLinkMore && (
                <Alert 
                  severity="warning" 
                  icon={<WarningIcon />}
                  sx={{ mt: 1 }}
                >
                  You've reached your account limit. Please upgrade your subscription to link more accounts.
                </Alert>
              )}
            </Box>

            <FormControl component="fieldset">
              <FormLabel component="legend">Select Account Type</FormLabel>
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
                  disabled={!accountLimits.canLinkMore}
                />
                <FormControlLabel 
                  value="existing" 
                  control={<Radio />} 
                  label="Link an existing Google Ads account" 
                  disabled={!accountLimits.canLinkMore}
                />
              </RadioGroup>
            </FormControl>
            
            {/* Unlinked Accounts Section */}
            {unlinkedAccounts.length > 0 && (
              <Box mt={3} p={2} border={1} borderRadius={1} borderColor="divider">
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinkOffIcon sx={{ mr: 1 }} />
                  Your Unlinked Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  These accounts were previously unlinked by you. You can relink them with one click:
                </Typography>
                
                {loadingUnlinkedAccounts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List>
                    {unlinkedAccounts.map((account) => (
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
                          primary={
                            <Typography fontWeight="bold">
                              {account.customer_id} 
                              {account.connection_type === 'created' && 
                                <Chip 
                                  size="small" 
                                  color="success" 
                                  label={`$${account.available_funds.toFixed(2)} available`} 
                                  sx={{ ml: 1 }}
                                />
                              }
                            </Typography>
                          }
                          secondary={
                            <>
                              {account.connection_type === 'created' ? 'Created account' : 'Linked account'}
                              <br />
                              Unlinked on: {new Date(account.unlinked_at).toLocaleDateString()}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => handleRelinkAccount(account.id)}
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={24} /> : 'Relink'}
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {/* Previously Linked Accounts Section */}
            {previouslyLinkedAccounts.length > 0 && (
              <Box mt={3} p={2} border={1} borderRadius={1} borderColor="divider" id="previously-linked-accounts">
                <Typography variant="h6" gutterBottom>
                  <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Previously Linked Accounts
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You can reconnect to one of your previously linked accounts:
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
                          secondary={
                            <>
                              {account.connection_type === 'created' ? 'Created account' : 'Linked account'}
                              <br />
                              Last linked: {new Date(account.created_at).toLocaleDateString()}
                            </>
                          }
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
                  Enter your Google Ads Customer ID to link your account.
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You can find your Customer ID in your Google Ads account settings or in the top right corner of your Google Ads dashboard.
                </Typography>
            <TextField
                  label="Customer ID"
              value={customerId}
              onChange={handleCustomerIdChange}
                  fullWidth
                  margin="normal"
                  placeholder="e.g. 123-456-7890"
                  helperText="Format: XXX-XXX-XXXX"
              required
                />
              </Box>
            )}
            {accountType === 'new' && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  We will create a new Google Ads account for you.
                </Typography>
            <Typography variant="body2" color="text.secondary">
                  The account will be created under our manager account and will be pre-configured for optimal performance.
            </Typography>
              </Box>
            )}
          </Box>
        );
      case 2:
        return statusStepContent;
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
      
      // First attempt: normal unlinking
      const response = await googleAdsApi.unlinkAccount(pauseCampaigns);
      
        if (response && response.success) {
        // Second attempt: reset account status
        try {
          await googleAdsApi.resetAccountStatus();
          
          // Third attempt: check if still linked and force unlink if needed
          const statusCheck = await googleAdsApi.getAccountStatus();
          if (statusCheck?.data?.is_linked) {
            await googleAdsApi.forceUnlinkDb();
          }
        } catch (resetError) {
          console.error('Error during account reset:', resetError);
        }
        
        // Even if steps fail, show success from initial unlink
        setSuccess('Account unlinked successfully');
          setAccountStatus({
            isLinked: false,
            customerId: '',
            connectionType: '',
            availableFunds: 0
          });
        setUnlinkConfirmStep(3);
        setUnlinkSuccess(true);
        } else {
        // First attempt failed, try force DB unlink
        try {
          const forceResult = await googleAdsApi.forceUnlinkDb();
          if (forceResult?.success) {
            setSuccess('Account forcibly unlinked');
            setAccountStatus({
              isLinked: false,
              customerId: '',
              connectionType: '',
              availableFunds: 0
            });
            setUnlinkConfirmStep(3);
            setUnlinkSuccess(true);
          } else {
            setError('Failed to unlink account');
        handleCloseUnlinkDialog();
          }
        } catch (forceError) {
          console.error('Force unlink failed:', forceError);
          setError('All unlink methods failed');
          handleCloseUnlinkDialog();
        }
        }
      } catch (error) {
      console.error('Initial unlink failed:', error);
      
      // Try force DB unlink as last resort
      try {
        const forceResult = await googleAdsApi.forceUnlinkDb();
        if (forceResult?.success) {
          setSuccess('Account forcibly unlinked');
          setAccountStatus({
            isLinked: false,
            customerId: '',
            connectionType: '',
            availableFunds: 0
          });
          setUnlinkConfirmStep(3);
          setUnlinkSuccess(true);
        } else {
          setError('All unlink attempts failed');
      handleCloseUnlinkDialog();
        }
      } catch (forceError) {
        console.error('Force unlink failed:', forceError);
        setError('All unlink methods failed');
        handleCloseUnlinkDialog();
      }
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
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to create checkout session. Please try again.';
      setError(errorMessage);
    } finally {
      setFundsLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Replace automatic status check with a more prominent manual check UI
  const statusStepContent = (
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
      
      <Typography variant="h6" gutterBottom>
        Google Ads Link Status
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: linkStatus && linkStatus.status === 'ACTIVE' ? '2px solid green' : '1px solid #ddd'
        }}
      >
        <Typography variant="body1" gutterBottom>
          Customer ID: <strong>{customerId}</strong>
        </Typography>
        
        {linkStatus ? (
          <>
            <Typography variant="body1" gutterBottom>
              Status: <Chip 
                label={linkStatus.status || "UNKNOWN"} 
                color={linkStatus.status === 'ACTIVE' ? 'success' : linkStatus.status === 'PENDING' ? 'warning' : 'error'} 
                sx={{ ml: 1 }} 
              />
            </Typography>
            
            <Typography variant="body1" gutterBottom>
              {linkStatus.message || "Please check the status of your link request."}
            </Typography>
            
            {linkStatus.explanation && (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                {linkStatus.explanation}
              </Alert>
            )}
            
            {linkStatus.recommended_action && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Recommended action:</strong> {linkStatus.recommended_action}
              </Typography>
            )}
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Click the button below to check the status of your link request.
          </Typography>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCheckStatus}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            size="large"
            sx={{ px: 4, py: 1 }}
          >
            {loading ? 'Checking...' : 'Check Link Status'}
          </Button>
        </Box>
      </Paper>
      
      <Typography variant="body2" color="text.secondary">
        You'll need to accept the invitation in your Google Ads account before the link can be established.
        We've sent an email with instructions to your registered email address.
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> To reduce server load, status is not checked automatically. 
          Please use the button above to manually check if your account has been linked.
        </Typography>
      </Alert>
    </Box>
  );

  return (
    <>
      {accountStatus.isLinked ? (
        // Show linked account info
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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined" 
                size="small" 
                color="primary"
                onClick={checkAccountStatus}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ 
                  bgcolor: 'white', 
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white'
                  } 
                }}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
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
                Unlink
              </Button>
            </Box>
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
        // Show link button
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleOpen}
            startIcon={<GoogleIcon />}
          >
            Link Google Ads Account
          </Button>
          
          {/* Button to view previously linked accounts */}
          {accountStatus.hasPreviousAccounts && (
                    <Button
                      variant="outlined"
              color="primary"
              onClick={() => {
                handleOpen();
                // Focus on the previously linked accounts section
                setTimeout(() => {
                  const element = document.getElementById('previously-linked-accounts');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 300);
              }}
              startIcon={<HistoryIcon />}
            >
              View Previous Accounts
                    </Button>
          )}
            </Box>
      )}

      {/* Link account dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {activeStep === 0 ? "Link Google Ads Account" : 
           activeStep === 1 ? "Enter Google Ads Customer ID" :
           "Link Status"}
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
            Close
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
              {activeStep === 1 ? "Link Account" : "Next"}
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