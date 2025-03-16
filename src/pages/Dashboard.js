import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  CalendarMonth as CalendarIcon,
  Google as GoogleIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { adCampaignAPI, googleAdsAPI } from '../services/api';

// Helper function to group campaigns by platform
const groupCampaignsByPlatform = (campaigns) => {
  const grouped = {};
  
  campaigns.forEach((campaign) => {
    if (!grouped[campaign.platform]) {
      grouped[campaign.platform] = [];
    }
    
    grouped[campaign.platform].push(campaign);
  });
  
  return grouped;
};

// Helper function to get status color
const getStatusColor = (status) => {
  switch (status) {
    case 'Active':
    case 'ENABLED':
      return 'success';
    case 'Paused':
    case 'PAUSED':
      return 'warning';
    case 'Draft':
    case 'DRAFT':
      return 'default';
    case 'Scheduled':
      return 'info';
    case 'Completed':
    case 'REMOVED':
      return 'secondary';
    default:
      return 'default';
  }
};

const Dashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [googleAdsCampaigns, setGoogleAdsCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleAdsError, setGoogleAdsError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [updatedCampaignData, setUpdatedCampaignData] = useState({
    name: '',
    status: '',
    daily_budget: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await adCampaignAPI.getCampaigns();
        setCampaigns(response.data);
      } catch (err) {
        setError('Failed to load campaigns. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);

  useEffect(() => {
    const fetchGoogleAdsCampaigns = async () => {
      try {
        setGoogleAdsLoading(true);
        setGoogleAdsError(null);
        
        const response = await googleAdsAPI.getCampaigns();
        
        // Check if the response was successful
        if (response.data && response.data.success && response.data.data && response.data.data.campaigns) {
          setGoogleAdsCampaigns(response.data.data.campaigns);
        } else {
          // Handle unsuccessful response
          setGoogleAdsCampaigns([]);
          if (response.data && !response.data.success) {
            setGoogleAdsError(response.data.message || 'Failed to load Google Ads campaigns');
          }
        }
      } catch (err) {
        console.error('Error fetching Google Ads campaigns:', err);
        setGoogleAdsCampaigns([]);
        setGoogleAdsError('Failed to load Google Ads campaigns. Please try again.');
      } finally {
        setGoogleAdsLoading(false);
      }
    };
    
    fetchGoogleAdsCampaigns();
  }, []);

  const handleGenerateImage = async (campaignId) => {
    try {
      const response = await adCampaignAPI.generateImage(campaignId);
      
      // Update the campaign in the state
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) =>
          campaign.id === campaignId ? response.data : campaign
        )
      );
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUpdateCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setUpdatedCampaignData({
      name: campaign.name,
      status: campaign.status,
      daily_budget: campaign.budget.toString(),
    });
    setUpdateDialogOpen(true);
  };

  const handleUpdateDialogClose = () => {
    setUpdateDialogOpen(false);
    setSelectedCampaign(null);
  };

  const handleUpdateFieldChange = (field, value) => {
    setUpdatedCampaignData({
      ...updatedCampaignData,
      [field]: value,
    });
  };

  const handleSubmitUpdate = async () => {
    try {
      const response = await googleAdsAPI.updateCampaign(
        selectedCampaign.id,
        updatedCampaignData
      );

      if (response.data && response.data.success) {
        // Update the campaign in the state
        const updatedCampaigns = googleAdsCampaigns.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                name: updatedCampaignData.name,
                status: updatedCampaignData.status,
                budget: parseFloat(updatedCampaignData.daily_budget),
              }
            : campaign
        );
        setGoogleAdsCampaigns(updatedCampaigns);

        // Show success message
        setSnackbarMessage('Campaign updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Show error message
        setSnackbarMessage(response.data?.message || 'Failed to update campaign');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error updating campaign:', err);
      setSnackbarMessage('Failed to update campaign');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      handleUpdateDialogClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading && googleAdsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const groupedCampaigns = groupCampaignsByPlatform(campaigns);
  const platforms = Object.keys(groupedCampaigns);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Ad Campaigns
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/campaigns/new"
        >
          Create Campaign
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Internal Campaigns" />
        <Tab label="Google Ads Campaigns" />
      </Tabs>

      {activeTab === 0 && (
        <>
          {campaigns.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No campaigns yet
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Create your first ad campaign to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/campaigns/new"
              >
                Create Campaign
              </Button>
            </Box>
          ) : (
            platforms.map((platform) => (
              <Box key={platform} sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" className="platform-title">
                  {platform}
                </Typography>
                <Grid container spacing={3}>
                  {groupedCampaigns[platform].map((campaign) => (
                    <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                      <Card className="campaign-card">
                        {campaign.image_url ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={campaign.image_url}
                            alt={campaign.title}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: 140,
                              bgcolor: 'grey.200',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No image
                            </Typography>
                          </Box>
                        )}
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" component="div" noWrap>
                              {campaign.title}
                            </Typography>
                            <Chip
                              label={campaign.status}
                              size="small"
                              color={getStatusColor(campaign.status)}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {campaign.description && campaign.description.length > 100
                              ? `${campaign.description.substring(0, 100)}...`
                              : campaign.description}
                          </Typography>
                          {campaign.budget && (
                            <Typography variant="body2">
                              <strong>Budget:</strong> {campaign.budget}
                            </Typography>
                          )}
                        </CardContent>
                        <Divider />
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            component={RouterLink}
                            to={`/campaigns/${campaign.id}`}
                          >
                            View
                          </Button>
                          {['Pinterest', 'Snapchat', 'TikTok'].includes(campaign.platform) && !campaign.image_url && (
                            <Button
                              size="small"
                              startIcon={<ImageIcon />}
                              onClick={() => handleGenerateImage(campaign.id)}
                            >
                              Generate Image
                            </Button>
                          )}
                          <Button
                            size="small"
                            startIcon={<CalendarIcon />}
                            component={RouterLink}
                            to={`/calendar?campaign=${campaign.id}`}
                          >
                            Schedule
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          {googleAdsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {googleAdsError}
            </Alert>
          )}

          {googleAdsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : googleAdsCampaigns.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Google Ads campaigns found
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Create your first Google Ads campaign to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                component={RouterLink}
                to="/google-ads/new"
              >
                Create Google Ads Campaign
              </Button>
            </Box>
          ) : (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" className="platform-title">
                Google Ads
              </Typography>
              <Grid container spacing={3}>
                {googleAdsCampaigns.map((campaign) => (
                  <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                    <Card className="campaign-card">
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <GoogleIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                      </Box>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="div" noWrap>
                            {campaign.name}
                          </Typography>
                          <Chip
                            label={campaign.status}
                            size="small"
                            color={getStatusColor(campaign.status)}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {campaign.channel_type}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Budget:</strong> ${campaign.budget.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Impressions:</strong> {campaign.impressions}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Clicks:</strong> {campaign.clicks}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cost:</strong> ${campaign.cost.toFixed(2)}
                        </Typography>
                        {campaign.start_date && (
                          <Typography variant="body2">
                            <strong>Start Date:</strong> {campaign.start_date}
                          </Typography>
                        )}
                        {campaign.end_date && (
                          <Typography variant="body2">
                            <strong>End Date:</strong> {campaign.end_date}
                          </Typography>
                        )}
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<UpdateIcon />}
                          onClick={() => handleUpdateCampaign(campaign)}
                        >
                          Update Campaign
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Update Campaign Dialog */}
      <Dialog open={updateDialogOpen} onClose={handleUpdateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Update Campaign</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Campaign Name"
              fullWidth
              margin="normal"
              value={updatedCampaignData.name}
              onChange={(e) => handleUpdateFieldChange('name', e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={updatedCampaignData.status}
                label="Status"
                onChange={(e) => handleUpdateFieldChange('status', e.target.value)}
              >
                <MenuItem value="ENABLED">Enabled</MenuItem>
                <MenuItem value="PAUSED">Paused</MenuItem>
                <MenuItem value="REMOVED">Removed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Daily Budget ($)"
              fullWidth
              margin="normal"
              type="number"
              inputProps={{ min: 1, step: 0.01 }}
              value={updatedCampaignData.daily_budget}
              onChange={(e) => handleUpdateFieldChange('daily_budget', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateDialogClose}>Cancel</Button>
          <Button onClick={handleSubmitUpdate} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard; 