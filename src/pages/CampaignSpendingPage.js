import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import GoogleAdsCampaignSpending from '../components/GoogleAdsCampaignSpending';
import googleAdsApi from '../services/googleAdsApi';
import { useAuth } from '../context/AuthContext';

const CampaignSpendingPage = () => {
  const { subscription } = useAuth();
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user can use Google Ads
  const canUseGoogleAds = subscription?.features?.can_use_google_ads || false;
  const canCreateGoogleAdsAccount = subscription?.features?.can_create_google_ads_account || false;

  // Fetch Google Ads account status
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoading(true);
        const response = await googleAdsApi.getAccountStatus();
        if (response && response.data) {
          setAccountStatus(response.data);
        }
      } catch (error) {
        console.error('Error fetching Google Ads account status:', error);
        setError('Failed to load account status. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountStatus();
  }, []);

  // Function to refresh account status
  const handleRefreshAccountStatus = async () => {
    try {
      setLoading(true);
      const response = await googleAdsApi.getAccountStatus();
      if (response && response.data) {
        setAccountStatus(response.data);
      }
    } catch (error) {
      console.error('Error refreshing account status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Campaign Spending Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Track your Google Ads campaign spending and account balance in real-time.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <Box>
            {!canUseGoogleAds ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                This feature requires a Pro or Enterprise subscription. Please upgrade to access Google Ads features.
              </Alert>
            ) : !accountStatus?.isLinked ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                You need to link a Google Ads account before you can track campaign spending.
              </Alert>
            ) : accountStatus.connectionType !== 'created' ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Real-time spend tracking is only available for Google Ads accounts created through our platform.
                Linked external accounts do not support this feature.
              </Alert>
            ) : (
              <>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Account Information
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                              <Typography variant="body2" color="text.secondary">
                                Customer ID
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {accountStatus.customerId || 'N/A'}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                              <Typography variant="body2" color="text.secondary">
                                Connection Type
                              </Typography>
                              <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                {accountStatus.connectionType || 'N/A'}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <GoogleAdsCampaignSpending 
                      accountStatus={accountStatus} 
                      onRefreshAccountStatus={handleRefreshAccountStatus}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CampaignSpendingPage; 