import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CreditCard as CreditCardIcon, Stars as StarsIcon } from '@mui/icons-material';
import { creditsAPI } from '../services/api';

/**
 * Dialog component for purchasing credits
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when the dialog is closed
 * @param {Function} props.onSuccess - Function to call when credits are successfully purchased
 */
const CreditPurchaseDialog = ({ open, onClose, onSuccess }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    // Fetch available credit packages when dialog opens
    if (open) {
      fetchPackages();
    }
  }, [open]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await creditsAPI.getPackages();
      console.log('Credit packages:', response.data);
      
      // Convert the packages object to an array with ids
      const packagesArray = Object.entries(response.data.packages).map(([id, pkg]) => ({
        id,
        ...pkg
      }));
      
      setPackages(packagesArray);
    } catch (err) {
      console.error('Error fetching credit packages:', err);
      setError('Failed to load credit packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    try {
      setPurchaseLoading(true);
      setError(null);
      
      // Call the API to create a checkout session
      const response = await creditsAPI.purchaseCredits(selectedPackage.id);
      console.log('Purchase response:', response);
      
      if (response.data.success) {
        // Redirect to the checkout URL
        window.location.href = response.data.data.checkout_url;
      } else {
        setError(response.data.message || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error purchasing credits:', err);
      setError(err.response?.data?.detail || 'Failed to purchase credits');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <CreditCardIcon sx={{ mr: 1 }} />
          Purchase Credits
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" gutterBottom>
          Credits are used for premium features like AI image generation and ad campaign creation.
          Choose a package below to purchase additional credits:
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {packages.map((pkg) => (
              <Grid item xs={12} sm={6} key={pkg.id}>
                <Card 
                  variant={selectedPackage?.id === pkg.id ? "outlined" : "elevation"}
                  sx={{ 
                    borderColor: selectedPackage?.id === pkg.id ? 'primary.main' : undefined,
                    borderWidth: selectedPackage?.id === pkg.id ? 2 : undefined,
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {pkg.name}
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      ${pkg.price.toFixed(2)}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={2}>
                      <StarsIcon color="warning" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        {pkg.credits} Credits
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Best value for {pkg.id === 'basic' ? 'new users' : 'regular users'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      Select
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={purchaseLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handlePurchase} 
          variant="contained" 
          color="primary"
          disabled={!selectedPackage || purchaseLoading}
          startIcon={purchaseLoading ? <CircularProgress size={20} /> : <CreditCardIcon />}
        >
          {purchaseLoading ? 'Processing...' : 'Purchase'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreditPurchaseDialog; 