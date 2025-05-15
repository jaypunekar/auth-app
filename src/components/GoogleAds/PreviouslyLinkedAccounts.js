import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import axios from 'axios';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const PreviouslyLinkedAccounts = ({ onAccountLinked, refreshTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [linkingAccount, setLinkingAccount] = useState(null);

  // Fetch previously linked accounts
  const fetchPreviouslyLinkedAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Not authenticated. Please log in again.");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/google-ads/previously-linked-accounts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        setAccounts(response.data.data.accounts || []);
      } else {
        setError(response.data?.message || "Failed to fetch accounts");
      }
    } catch (err) {
      console.error("Error fetching previously linked accounts:", err);
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Link an existing Google Ads account
  const handleReconnectAccount = async (customerId) => {
    setLinkingAccount(customerId);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Not authenticated. Please log in again.");
        setLinkingAccount(null);
        return;
      }
      
      // First call force-unlink-account to make sure any lingering "linked" status is cleared
      await axios.post(`${API_URL}/google-ads/force-unlink-account`, 
        { customer_id: customerId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Now link the account
      const response = await axios.post(`${API_URL}/google-ads/link-existing-account`, 
        { customer_id: customerId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // Remove this account from the list since it's now active
        setAccounts(accounts.filter(account => account.customer_id !== customerId));
        
        // Notify parent component
        if (onAccountLinked) {
          onAccountLinked(response.data);
        }
      } else {
        setError(response.data?.message || "Failed to link account");
      }
    } catch (err) {
      console.error("Error linking account:", err);
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    } finally {
      setLinkingAccount(null);
    }
  };

  // Load accounts when component mounts or refresh trigger changes
  useEffect(() => {
    fetchPreviouslyLinkedAccounts();
  }, [refreshTrigger]);

  // If there are no previously linked accounts, don't render the component
  if (!loading && accounts.length === 0 && !error) {
    return null;
  }

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Previously Linked Accounts</Typography>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchPreviouslyLinkedAccounts}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : accounts.length > 0 ? (
          <List>
            {accounts.map((account) => (
              <ListItem 
                key={account.customer_id}
                divider
                secondaryAction={
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => handleReconnectAccount(account.customer_id)}
                    disabled={linkingAccount === account.customer_id}
                  >
                    {linkingAccount === account.customer_id ? 'Linking...' : 'Reconnect'}
                  </Button>
                }
              >
                <ListItemText
                  primary={`Account ID: ${account.customer_id}`}
                  secondary={`Last used: ${new Date(account.created_at).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No previously linked accounts found.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviouslyLinkedAccounts; 