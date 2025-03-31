import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Warning as WarningIcon,
  CreditCard as CreditCardIcon,
  ContactSupport as ContactSupportIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { format, isPast } from 'date-fns';

const Subscriptions = () => {
  const { subscription, updateSubscription, loading, checkSubscription } = useAuth();
  const [tiers, setTiers] = useState({});
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openEnterpriseDialog, setOpenEnterpriseDialog] = useState(false);
  const [openContactSupportDialog, setOpenContactSupportDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your subscription is now active.');
      checkSubscription(); // Refresh the subscription status
    } else if (searchParams.get('canceled') === 'true') {
      setError('Payment process was canceled.');
    }
    
    // Clear query params from URL
    if (searchParams.has('success') || searchParams.has('canceled')) {
      navigate('/subscriptions', { replace: true });
    }
  }, [location.search, navigate, checkSubscription]);

  // Default tiers as fallback
  const defaultTiers = {
    "Free": {
      "price": "0",
      "features": [
        "Create basic ad campaigns",
        "Chat with AI assistant",
        "Website analysis tool",
        "Ad calendar",
        "Social media analyzers",
      ],
      "limitations": [
        "No Google Ads integration",
        "Limited campaign creation",
      ]
    },
    "Pro": {
      "price": "1.00",
      "features": [
        "All Free tier features",
        "Google Ads integration",
        "Advanced campaign creation",
        "Premium AI assistance",
        "Advanced analytics",
      ],
      "limitations": []
    },
    "Enterprise": {
      "price": "Custom pricing",
      "features": [
        "All Pro features",
        "Custom integrations",
        "Dedicated support",
        "Custom AI training",
        "White-label options",
      ],
      "limitations": []
    }
  };

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        console.log('Fetching subscription tiers...');
        const response = await axios.get('/api/subscription/tiers');
        console.log('Subscription tiers response:', response);
        console.log('Subscription tiers data:', response.data);
        setTiers(response.data);
      } catch (err) {
        console.error('Error fetching subscription tiers:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError('Failed to load subscription information. Using default tiers instead.');
        // Use default tiers as fallback
        console.log('Using default tiers as fallback');
        setTiers(defaultTiers);
      } finally {
        setLoadingTiers(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSelectTier = async (tier) => {
    setError('');
    setSuccess('');
    
    if (tier === 'Enterprise') {
      setOpenEnterpriseDialog(true);
      return;
    }
    
    // Handle Pro to Free downgrade - show contact support dialog
    if (tier === 'Free' && subscription.tier === 'Pro') {
      setOpenContactSupportDialog(true);
      return;
    }
    
    // Handle upgrading to Pro via Stripe
    if (tier === 'Pro' && subscription.tier === 'Free') {
      await handleUpgradeToPro();
      return;
    }
    
    // For other cases, use the regular update
    try {
      const result = await updateSubscription(tier);
      if (result) {
        setSuccess(`Successfully updated to ${tier} tier!`);
      } else {
        setError('Failed to update subscription tier. Please try again.');
      }
    } catch (err) {
      if (err.response?.status === 303) {
        // Redirect to checkout if we get 303 See Other
        await handleUpgradeToPro();
      } else {
        setError(err.response?.data?.detail || 'An error occurred. Please try again later.');
      }
      console.error('Error updating subscription:', err);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/api/subscription/checkout');
      
      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create checkout session');
      console.error('Error creating checkout session:', err);
      setIsProcessing(false);
    }
  };
  
  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/api/subscription/billing-portal');
      
      // Redirect to Stripe Billing Portal
      window.location.href = response.data.portal_url;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to access billing portal');
      console.error('Error accessing billing portal:', err);
      setIsProcessing(false);
    }
  };

  const handleCloseEnterpriseDialog = () => {
    setOpenEnterpriseDialog(false);
  };
  
  const handleCloseContactSupportDialog = () => {
    setOpenContactSupportDialog(false);
  };

  if (loadingTiers || isProcessing) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Format the payment status display
  const getPaymentStatusInfo = () => {
    if (!subscription || !subscription.payment_status) {
      return null;
    }
    
    switch (subscription.payment_status) {
      case 'active':
        return {
          message: 'Your subscription is active.',
          severity: 'success',
          date: subscription.current_period_end 
            ? `Next payment: ${format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}`
            : null
        };
      case 'past_due':
      case 'unpaid':
        return {
          message: 'Your payment has failed.',
          severity: 'error',
          date: subscription.grace_period_end 
            ? `Pro features will be disabled on: ${format(new Date(subscription.grace_period_end), 'MMMM dd, yyyy')}`
            : null,
          action: 'Update Payment Method'
        };
      case 'canceled':
        return {
          message: 'Your subscription has been canceled.',
          severity: 'warning',
          date: subscription.current_period_end 
            ? `Access ends on: ${format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}`
            : null
        };
      default:
        return null;
    }
  };
  
  const paymentStatusInfo = getPaymentStatusInfo();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Plans
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Choose the plan that works best for you and your business
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="h6">
            Your current plan: <strong>{subscription.tier}</strong>
            
            {subscription.tier === 'Pro' && (
              <Chip 
                size="small" 
                color="secondary"
                label="PRO"
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
          
          {subscription.tier === 'Pro' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CreditCardIcon />}
              onClick={handleManageBilling}
            >
              Manage Billing
            </Button>
          )}
        </Box>

        {paymentStatusInfo && (
          <Alert 
            severity={paymentStatusInfo.severity} 
            sx={{ mt: 2 }}
            action={
              paymentStatusInfo.action && (
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={handleManageBilling}
                >
                  {paymentStatusInfo.action}
                </Button>
              )
            }
          >
            <AlertTitle>{paymentStatusInfo.message}</AlertTitle>
            {paymentStatusInfo.date && <Typography variant="body2">{paymentStatusInfo.date}</Typography>}
          </Alert>
        )}
      </Paper>

      <Grid container spacing={4}>
        {/* Free Tier */}
        <Grid item xs={12} md={4}>
          {console.log('Rendering Free tier card with data:', tiers.Free)}
          <Card 
            elevation={4}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              bgcolor: subscription.tier === 'Free' ? 'action.selected' : 'background.paper',
            }}
          >
            <CardHeader
              title="Free"
              titleTypographyProps={{ align: 'center', variant: 'h5' }}
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" component="div">
                  $0
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  per month
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                {tiers.Free?.features && Array.isArray(tiers.Free.features) ? (
                  tiers.Free.features.map((feature) => (
                    <ListItem key={feature} disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} primaryTypographyProps={{ color: 'text.primary' }} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemText primary="Features data not available" />
                  </ListItem>
                )}
                {tiers.Free?.limitations && Array.isArray(tiers.Free.limitations) ? (
                  tiers.Free.limitations.map((limitation) => (
                    <ListItem key={limitation} disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CloseIcon color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={limitation} 
                        primaryTypographyProps={{ color: 'text.primary' }} 
                      />
                    </ListItem>
                  ))
                ) : null}
              </List>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant={subscription.tier === 'Free' ? 'outlined' : 'contained'}
                color="primary"
                onClick={() => handleSelectTier('Free')}
                disabled={subscription.tier === 'Free' || loading}
              >
                {subscription.tier === 'Free' ? 'Current Plan' : 'Select Free Plan'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Pro Tier */}
        <Grid item xs={12} md={4}>
          {console.log('Rendering Pro tier card with data:', tiers.Pro)}
          <Card 
            elevation={4}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              bgcolor: subscription.tier === 'Pro' ? 'action.selected' : 'background.paper',
              borderColor: 'secondary.main',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            {/* Recommended Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'secondary.main',
                color: 'secondary.contrastText',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                zIndex: 1,
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                RECOMMENDED
              </Typography>
            </Box>
            <CardHeader
              title="Pro"
              titleTypographyProps={{ align: 'center', variant: 'h5' }}
              sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" component="div">
                  ${tiers.Pro?.price || '1.00'}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  per month
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                {tiers.Pro?.features && Array.isArray(tiers.Pro.features) ? (
                  tiers.Pro.features.map((feature) => (
                    <ListItem key={feature} disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} primaryTypographyProps={{ color: 'text.primary' }} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemText primary="Features data not available" />
                  </ListItem>
                )}
              </List>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant={subscription.tier === 'Pro' ? 'outlined' : 'contained'}
                color="secondary"
                onClick={() => handleSelectTier('Pro')}
                disabled={subscription.tier === 'Pro' && !subscription.payment_failed || loading}
                startIcon={subscription.payment_failed ? <WarningIcon /> : null}
              >
                {subscription.tier === 'Pro' 
                  ? (subscription.payment_failed 
                      ? 'Update Payment Method' 
                      : 'Current Plan') 
                  : 'Upgrade to Pro'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Enterprise Tier */}
        <Grid item xs={12} md={4}>
          {console.log('Rendering Enterprise tier card with data:', tiers.Enterprise)}
          <Card 
            elevation={4}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              bgcolor: subscription.tier === 'Enterprise' ? 'action.selected' : 'background.paper',
            }}
          >
            <CardHeader
              title="Enterprise"
              titleTypographyProps={{ align: 'center', variant: 'h5' }}
              sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" component="div">
                  Custom
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  custom pricing
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List>
                {tiers.Enterprise?.features && Array.isArray(tiers.Enterprise.features) ? (
                  tiers.Enterprise.features.map((feature) => (
                    <ListItem key={feature} disablePadding>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} primaryTypographyProps={{ color: 'text.primary' }} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemText primary="Features data not available" />
                  </ListItem>
                )}
              </List>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                onClick={() => handleSelectTier('Enterprise')}
                disabled={subscription.tier === 'Enterprise' || loading}
              >
                Contact Sales
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Enterprise Contact Dialog */}
      <Dialog open={openEnterpriseDialog} onClose={handleCloseEnterpriseDialog}>
        <DialogTitle>Contact our Enterprise Sales Team</DialogTitle>
        <DialogContent>
          <DialogContentText>
            For enterprise-level solutions, our sales team will create a custom plan 
            that perfectly fits your business needs. Please reach out to us at:
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body1">
              <strong>Email:</strong> enterprise@adtask.ai
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong> +1 (555) 123-4567
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEnterpriseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Contact Support Dialog for Pro to Free downgrade */}
      <Dialog open={openContactSupportDialog} onClose={handleCloseContactSupportDialog}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ContactSupportIcon sx={{ mr: 1 }} color="primary" />
            Contact Support to Downgrade
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            To downgrade from the Pro to Free tier, please contact our support team. 
            This ensures we can properly handle your data and account settings during the transition.
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="body1">
              <strong>Email:</strong> support@adtask.ai
            </Typography>
            <Typography variant="body1">
              <strong>Phone:</strong> +1 (555) 987-6543
            </Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            You can also cancel your subscription through the "Manage Billing" button on this page, 
            but you'll continue to have Pro access until the end of your current billing period.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContactSupportDialog}>Close</Button>
          <Button onClick={handleManageBilling} color="primary" variant="contained" startIcon={<CreditCardIcon />}>
            Manage Billing
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Subscriptions; 