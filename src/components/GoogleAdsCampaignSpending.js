import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import UpdateIcon from '@mui/icons-material/Update';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaidIcon from '@mui/icons-material/Paid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import googleAdsApi from '../services/googleAdsApi';

const GoogleAdsCampaignSpending = ({ accountStatus, onRefreshAccountStatus }) => {
  const [loading, setLoading] = useState(false);
  const [spendingData, setSpendingData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Get recent transactions to show spending history
  useEffect(() => {
    if (accountStatus?.connectionType === 'created') {
      setLoading(true);
      googleAdsApi.getFunds()
        .then(response => {
          if (response.success) {
            setSpendingData(response.data);
          } else {
            setError('Failed to fetch spending data');
          }
        })
        .catch(err => {
          setError('Error fetching spending data');
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [accountStatus]);
  
  // Function to update real-time spending
  const handleUpdateSpending = () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    
    googleAdsApi.updateCampaignSpending()
      .then(response => {
        if (response.success) {
          setSuccess('Spending data updated successfully');
          setSpendingData(response.data);
          
          // Also refresh the account status to get the latest funds
          if (onRefreshAccountStatus) {
            onRefreshAccountStatus();
          }
        } else {
          setError(response.message || 'Failed to update spending data');
        }
      })
      .catch(err => {
        setError('Error updating spending data');
        console.error(err);
      })
      .finally(() => {
        setUpdating(false);
      });
  };
  
  // Function to refresh spending data without updating from Google Ads
  const handleRefreshData = () => {
    setLoading(true);
    setError(null);
    
    googleAdsApi.getFunds()
      .then(response => {
        if (response.success) {
          setSpendingData(response.data);
        } else {
          setError('Failed to fetch spending data');
        }
      })
      .catch(err => {
        setError('Error fetching spending data');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Format date to readable string
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };
  
  // Format transaction type for display
  const getTransactionTypeDisplay = (type) => {
    switch (type) {
      case 'deposit':
        return <Chip icon={<PaidIcon />} label="Deposit" color="success" size="small" />;
      case 'campaign_creation':
        return <Chip label="Campaign Creation" color="primary" size="small" />;
      case 'spend_tracking':
        return <Chip icon={<UpdateIcon />} label="Spend Tracking" color="secondary" size="small" />;
      case 'campaign_spend':
        return <Chip icon={<MoneyOffIcon />} label="Campaign Spend" color="error" size="small" />;
      case 'spend_adjustment':
        return <Chip icon={<AccountBalanceWalletIcon />} label="Balance Adjustment" color="info" size="small" />;
      default:
        return <Chip label={type} size="small" />;
    }
  };

  if (accountStatus?.connectionType !== 'created') {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Real-time spend tracking is only available for Google Ads accounts created through our platform.
      </Alert>
    );
  }

  return (
    <Card sx={{ mt: 2, overflow: 'visible' }}>
      <CardHeader 
        title="Campaign Spending Tracker" 
        subheader="Track real-time campaign spending and account balance"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh spending data">
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<RefreshIcon />} 
                onClick={handleRefreshData}
                disabled={loading}
              >
                Refresh
              </Button>
            </Tooltip>
            <Tooltip title="Update with latest data from Google Ads">
              <Button 
                variant="contained" 
                color="primary"
                size="small" 
                startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <UpdateIcon />} 
                onClick={handleUpdateSpending}
                disabled={updating}
              >
                Update Now
              </Button>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                  <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                    ${accountStatus?.availableFunds?.toFixed(2) || '0.00'}
                  </Typography>
                </Paper>
              </Grid>
              {spendingData?.campaign_spending && (
                <>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                      <Typography variant="h4" color="error" sx={{ mt: 1 }}>
                        ${spendingData.total_spent?.toFixed(2) || '0.00'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {spendingData.tracked_date ? formatDate(spendingData.tracked_date) : 'Never'}
                      </Typography>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
            
            {spendingData?.recent_transactions && spendingData.recent_transactions.length > 0 ? (
              <Box>
                <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spendingData.recent_transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.created_at)}</TableCell>
                          <TableCell>{getTransactionTypeDisplay(transaction.transaction_type)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell 
                            align="right" 
                            sx={{ 
                              color: transaction.amount > 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              <Alert severity="info">No recent transactions found.</Alert>
            )}
            
            {spendingData?.campaign_spending && Object.keys(spendingData.campaign_spending).length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Campaign Spending</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Campaign</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(spendingData.campaign_spending).map(([id, campaign]) => (
                        <TableRow key={id}>
                          <TableCell>{campaign.name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={campaign.status} 
                              size="small"
                              color={campaign.status === 'ENABLED' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">${campaign.cost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleAdsCampaignSpending; 