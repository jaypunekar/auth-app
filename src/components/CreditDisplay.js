import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Box, Typography, Chip, Tooltip, Button, CircularProgress } from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { CreditRefreshContext } from './ImageGeneration/ImageGenerator';
import CreditPurchaseDialog from './CreditPurchaseDialog';

/**
 * Component to display user credit information
 * 
 * @param {Object} props
 * @param {boolean} props.showBuyButton - Whether to show a button to buy more credits
 * @param {Function} props.onBuyCredits - Callback when buy credits button is clicked
 * @param {boolean} props.showIcon - Whether to show the credit card icon
 * @param {string} props.size - Size of the component (small, medium, large)
 * @param {Object} props.sx - Additional MUI styles to apply
 */
const CreditDisplay = ({ 
  showBuyButton = false, 
  onBuyCredits, 
  showIcon = true,
  size = 'medium',
  sx = {}
}) => {
  const { token } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  
  // Get the refreshTrigger from context (if available)
  const creditRefreshContext = useContext(CreditRefreshContext);
  const refreshTrigger = creditRefreshContext?.refreshTrigger || 0;

  // Size variants
  const variants = {
    small: {
      fontSize: '0.75rem',
      iconSize: 'small',
      chipHeight: 24,
    },
    medium: {
      fontSize: '0.875rem',
      iconSize: 'small',
      chipHeight: 32,
    },
    large: {
      fontSize: '1rem',
      iconSize: 'medium',
      chipHeight: 40,
    }
  };
  
  const variant = variants[size] || variants.medium;

  // Listen for credit update events from WebSocket chat
  useEffect(() => {
    const handleCreditUpdate = (event) => {
      console.log("Credit update event received:", event.detail);
      if (event.detail && typeof event.detail.credits === 'number') {
        setCredits(event.detail.credits);
      }
    };

    // Add event listener for custom credit update events
    document.addEventListener('credits-updated', handleCreditUpdate);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('credits-updated', handleCreditUpdate);
    };
  }, []);

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true);
      // Fix the URL - REACT_APP_API_URL likely already includes '/api'
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      // Remove trailing slash if present to avoid double slashes
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // Check if the base URL already includes '/api'
      const apiPath = normalizedBaseUrl.includes('/api') ? '/images/credits' : '/api/images/credits';
      
      console.log(`Fetching credits from: ${normalizedBaseUrl}${apiPath}`);
      
      const response = await axios.get(
        `${normalizedBaseUrl}${apiPath}`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCredits(response.data.credits);
      setError(null);
    } catch (err) {
      console.error('Error fetching credits:', err);
      console.error('Server error response:', err.response?.status, err.response?.data);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCredits();
    }
  }, [token, refreshTrigger, fetchCredits]); // Add fetchCredits as a dependency

  // Function to determine color based on credit amount
  const getColorByCredits = (credits) => {
    if (credits === null) return 'default';
    if (credits <= 5) return 'error';
    if (credits <= 10) return 'warning';
    return 'success';
  };

  const handleBuyCreditsClick = () => {
    if (onBuyCredits) {
      onBuyCredits();
    } else {
      setShowPurchaseDialog(true);
    }
  };

  const handlePurchaseSuccess = () => {
    // Refresh credits after successful purchase
    fetchCredits();
    setShowPurchaseDialog(false);
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        ...sx
      }}
    >
      {loading ? (
        <CircularProgress size={16} />
      ) : error ? (
        <Tooltip title={error}>
          <Chip 
            label="Credits unavailable"
            color="error"
            size="small"
          />
        </Tooltip>
      ) : (
        <>
          <Tooltip title="Available credits for premium features">
            <Chip
              icon={showIcon ? <CreditCardIcon fontSize={variant.iconSize} /> : null}
              label={
                <Typography variant="body2" fontSize={variant.fontSize}>
                  {credits !== null ? `${credits} Credits` : 'Unknown'}
                </Typography>
              }
              color={getColorByCredits(credits)}
              size={size === 'small' ? 'small' : 'medium'}
              sx={{ height: variant.chipHeight }}
            />
          </Tooltip>
          
          {showBuyButton && (
            <Button 
              size="small" 
              variant="outlined" 
              color="primary"
              onClick={handleBuyCreditsClick}
              startIcon={<VerifiedIcon />}
              sx={{ ml: 1, fontSize: variant.fontSize }}
            >
              Get More
            </Button>
          )}
        </>
      )}

      {/* Credit purchase dialog */}
      <CreditPurchaseDialog
        open={showPurchaseDialog}
        onClose={() => setShowPurchaseDialog(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </Box>
  );
};

export default CreditDisplay; 