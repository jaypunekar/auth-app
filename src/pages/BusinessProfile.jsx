import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import axios from 'axios';
import SmartImageGenerator from '../components/BusinessProfile/SmartImageGenerator';

const BusinessProfile = () => {
  const [businessProfile, setBusinessProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    try {
      const response = await axios.get('/api/business-profile');
      setBusinessProfile(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching business profile:', err);
      setError('Failed to load business profile');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Business Profile
        </Typography>

        {businessProfile ? (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6">
                    {businessProfile.business_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Industry
                  </Typography>
                  <Typography>{businessProfile.industry}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography>{businessProfile.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Target Audience
                  </Typography>
                  <Typography>{businessProfile.target_audience}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Brand Colors
                  </Typography>
                  <Typography>{businessProfile.brand_colors}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Brand Voice
                  </Typography>
                  <Typography>{businessProfile.brand_voice}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Divider sx={{ my: 4 }} />

            {/* Smart Image Generation Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Smart Image Generation
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Generate images that perfectly match your business profile and branding.
              </Typography>
              <SmartImageGenerator businessProfileId={businessProfile.id} />
            </Box>
          </>
        ) : (
          <Alert severity="info">
            No business profile found. Please create one to get started.
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default BusinessProfile; 