import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  DialogContentText,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Tooltip,
  Container,
  AlertTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Google as GoogleIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Chat as ChatIcon,
  Star as StarIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { adCampaignAPI, googleAdsAPI, feedbackAPI } from '../services/api';
import AuthDebug from '../components/AuthDebug';
import ImageGenerator from '../components/ImageGeneration/ImageGenerator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';

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

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { subscription } = useAuth();
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
    startDate: '',
    endDate: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // New state variables for responsive search ads
  const [responsiveAdsDialogOpen, setResponsiveAdsDialogOpen] = useState(false);
  const [responsiveAds, setResponsiveAds] = useState([]);
  const [loadingResponsiveAds, setLoadingResponsiveAds] = useState(false);
  const [responsiveAdUpdateDialogOpen, setResponsiveAdUpdateDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [updatedAdData, setUpdatedAdData] = useState({
    headlines: [],
    descriptions: [],
    finalUrl: ''
  });

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(false);

  // New state variables for response review
  const [reviewTab, setReviewTab] = useState(0); // 0 = Liked, 1 = Disliked
  const [likedResponses, setLikedResponses] = useState([]);
  const [dislikedResponses, setDislikedResponses] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  // Check if user has Pro or Enterprise tier
  const canUseGoogleAds = subscription?.features?.can_use_google_ads || false;
  
  // Check how many campaigns the user can create
  const maxCampaigns = subscription?.features?.max_campaigns || 5;
  const campaignsRemaining = maxCampaigns > 0 ? maxCampaigns - campaigns.length : -1;
  const canCreateCampaign = maxCampaigns === -1 || campaignsRemaining > 0;

  // Check if payment has failed and subscription is in grace period
  const hasPaymentFailed = subscription?.payment_status === 'past_due' || subscription?.payment_status === 'unpaid';
  const graceEndDate = subscription?.grace_period_end 
    ? new Date(subscription.grace_period_end).toLocaleDateString()
    : null;

  // Add a formatCampaignDate helper function near the top of the component (after all your useState declarations)
  const formatCampaignDate = (dateString) => {
    if (!dateString) return 'Not set';
    
    // Handle YYYYMMDD format (raw dates from Google Ads API)
    if (typeof dateString === 'string' && dateString.length === 8 && !dateString.includes('-')) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${month}/${day}/${year}`;
    }
    
    // Handle ISO date format (YYYY-MM-DD)
    if (typeof dateString === 'string' && dateString.includes('-') && dateString.length >= 10) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString();
      } catch (error) {
        console.error("Error parsing ISO date:", error);
        return 'Invalid date format';
      }
    }
    
    // Handle any other date format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error parsing date:", error);
      return 'Invalid date format';
    }
  };

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
          const campaigns = response.data.data.campaigns;
          
          // Debug: Log campaign date information
          console.log("Google Ads Campaigns Data:", campaigns);
          
          // Process campaigns to ensure we have consistent date properties
          const processedCampaigns = campaigns.map(campaign => {
            // Create a copy to avoid mutation
            const processed = { ...campaign };
            
            // Ensure dates are properly set, preferring raw dates if available
            if (campaign.start_date_raw) {
              processed.startDate = campaign.start_date_raw;
            } else if (campaign.start_date) {
              processed.startDate = campaign.start_date;
            }
            
            if (campaign.end_date_raw) {
              processed.endDate = campaign.end_date_raw;
            } else if (campaign.end_date) {
              processed.endDate = campaign.end_date;
            }
            
            // Debug each campaign's dates
            console.log(`Campaign ${campaign.name} dates:`, {
              start_date: campaign.start_date,
              start_date_raw: campaign.start_date_raw,
              end_date: campaign.end_date,
              end_date_raw: campaign.end_date_raw,
              processedStartDate: processed.startDate,
              processedEndDate: processed.endDate
            });
            
            return processed;
          });
          
          setGoogleAdsCampaigns(processedCampaigns);
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

  // Fetch liked and disliked responses
  useEffect(() => {
    // Only fetch when the response review tab is active
    if (activeTab !== 3) return;
    
    const fetchFeedback = async () => {
      try {
        setLoadingFeedback(true);
        setFeedbackError(null);
        
        // Fetch liked responses
        const likedResponse = await feedbackAPI.getLikedMessages();
        setLikedResponses(likedResponse.data);
        
        // Fetch disliked responses
        const dislikedResponse = await feedbackAPI.getDislikedMessages();
        setDislikedResponses(dislikedResponse.data);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setFeedbackError('Failed to load response feedback. Please try again.');
      } finally {
        setLoadingFeedback(false);
      }
    };
    
    fetchFeedback();
  }, [activeTab]);

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
    
    // Process dates for update dialog
    const startDate = campaign.start_date || campaign.startDate;
    const endDate = campaign.end_date || campaign.endDate;
    
    // Format dates to YYYY-MM-DD format if they exist
    let formattedStartDate = '';
    let formattedEndDate = '';
    
    if (startDate) {
      // Handle potential different date formats
      try {
        // Try to parse the date
        const date = new Date(startDate);
        if (!isNaN(date.getTime())) {
          formattedStartDate = date.toISOString().slice(0, 10); // YYYY-MM-DD format
        } else if (typeof startDate === 'string' && startDate.length === 8) {
          // Handle YYYYMMDD format from Google Ads
          formattedStartDate = `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`;
        } else {
          formattedStartDate = startDate;
        }
      } catch (e) {
        console.error('Error formatting start date:', e);
        formattedStartDate = startDate;
      }
    }
    
    if (endDate) {
      try {
        // Try to parse the date
        const date = new Date(endDate);
        if (!isNaN(date.getTime())) {
          formattedEndDate = date.toISOString().slice(0, 10); // YYYY-MM-DD format
        } else if (typeof endDate === 'string' && endDate.length === 8) {
          // Handle YYYYMMDD format from Google Ads
          formattedEndDate = `${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}`;
        } else {
          formattedEndDate = endDate;
        }
      } catch (e) {
        console.error('Error formatting end date:', e);
        formattedEndDate = endDate;
      }
    }
    
    setUpdatedCampaignData({
      name: campaign.name,
      status: campaign.status,
      daily_budget: campaign.budget.toString(),
      startDate: formattedStartDate,
      endDate: formattedEndDate
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

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmitUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Create update payload with all fields including dates
      const updatePayload = {
        name: updatedCampaignData.name,
        status: updatedCampaignData.status,
        daily_budget: updatedCampaignData.daily_budget,
        start_date: updatedCampaignData.startDate,
        end_date: updatedCampaignData.endDate
      };
      
      const response = await googleAdsAPI.updateCampaign(
        selectedCampaign.id,
        updatePayload
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
                start_date: updatedCampaignData.startDate,  // Update start date
                startDate: updatedCampaignData.startDate,   // Also update the alternative property name
                end_date: updatedCampaignData.endDate,      // Update end date
                endDate: updatedCampaignData.endDate        // Also update the alternative property name
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
      setIsUpdating(false);
      handleUpdateDialogClose();
    }
  };
  
  const handleTestDirectUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Create update payload with all fields including dates
      const updatePayload = {
        name: updatedCampaignData.name,
        status: updatedCampaignData.status,
        daily_budget: updatedCampaignData.daily_budget,
        start_date: updatedCampaignData.startDate,
        end_date: updatedCampaignData.endDate
      };
      
      // Use the test update endpoint
      const response = await googleAdsAPI.testUpdateCampaign(
        selectedCampaign.id,
        updatePayload
      );

      if (response.success) {
        // Update the campaign in the state
        const updatedCampaigns = googleAdsCampaigns.map((campaign) =>
          campaign.id === selectedCampaign.id
            ? {
                ...campaign,
                name: updatedCampaignData.name,
                status: updatedCampaignData.status,
                budget: parseFloat(updatedCampaignData.daily_budget),
                start_date: updatedCampaignData.startDate,
                startDate: updatedCampaignData.startDate,
                end_date: updatedCampaignData.endDate,
                endDate: updatedCampaignData.endDate
              }
            : campaign
        );
        setGoogleAdsCampaigns(updatedCampaigns);

        // Show success message
        setSnackbarMessage('Campaign updated successfully (Direct API)');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Show error message
        setSnackbarMessage(response.message || 'Failed to update campaign');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error in direct campaign update:', err);
      setSnackbarMessage('Failed to directly update campaign');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
      handleUpdateDialogClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handler for viewing responsive search ads
  const handleViewResponsiveAds = async (campaignId) => {
    try {
      setLoadingResponsiveAds(true);
      setResponsiveAds([]);
      
      // Get the campaign for context
      const campaign = googleAdsCampaigns.find(c => c.id === campaignId);
      setSelectedCampaign(campaign);
      
      // Fetch responsive search ads
      const adsResponse = await googleAdsAPI.getResponsiveSearchAds(campaignId);
      
      if (adsResponse.data && adsResponse.data.success) {
        setResponsiveAds(adsResponse.data.data.ads || []);
      } else {
        setSnackbarMessage(adsResponse.data?.message || 'Failed to load responsive search ads');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
      
      // Open the dialog
      setResponsiveAdsDialogOpen(true);
    } catch (err) {
      console.error('Error fetching responsive search ads:', err);
      setSnackbarMessage('Failed to load responsive search ads');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingResponsiveAds(false);
    }
  };
  
  // Handler for closing the responsive ads dialog
  const handleResponsiveAdsDialogClose = () => {
    setResponsiveAdsDialogOpen(false);
    setSelectedCampaign(null);
    setResponsiveAds([]);
  };
  
  // Handler for opening the update ad dialog
  const handleUpdateAd = (ad) => {
    setSelectedAd(ad);
    // Ensure proper format for headlines and descriptions
    const headlines = Array.isArray(ad.headlines) ? 
      ad.headlines.map(h => ({
        text: h.text || "",
        pinnedField: h.pinnedField || null
      })) : [];
      
    const descriptions = Array.isArray(ad.descriptions) ? 
      ad.descriptions.map(d => ({
        text: d.text || "",
        pinnedField: d.pinnedField || null
      })) : [];
      
    setUpdatedAdData({
      headlines: headlines,
      descriptions: descriptions,
      finalUrl: ad.finalUrl || ''
    });
    setResponsiveAdUpdateDialogOpen(true);
  };
  
  // Handler for closing the update ad dialog
  const handleUpdateAdDialogClose = () => {
    setResponsiveAdUpdateDialogOpen(false);
    setSelectedAd(null);
  };
  
  // Handler for updating a responsive search ad field
  const handleUpdateAdField = (field, value, index = null) => {
    if (field === 'headline' && index !== null) {
      const newHeadlines = [...updatedAdData.headlines];
      newHeadlines[index] = value;
      setUpdatedAdData({
        ...updatedAdData,
        headlines: newHeadlines
      });
    } else if (field === 'description' && index !== null) {
      const newDescriptions = [...updatedAdData.descriptions];
      newDescriptions[index] = value;
      setUpdatedAdData({
        ...updatedAdData,
        descriptions: newDescriptions
      });
    } else if (field === 'finalUrl') {
      setUpdatedAdData({
        ...updatedAdData,
        finalUrl: value
      });
    }
  };
  
  // Handler for submitting ad updates
  const handleSubmitAdUpdate = async () => {
    try {
      setUpdatingAd(true);
      
      // Prepare the data for the API - ensure we're sending the expected format
      let finalUrl = updatedAdData.finalUrl;
      
      // Ensure final URL has proper format
      if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = "https://" + finalUrl;
      }
      
      const adData = {
        headlines: updatedAdData.headlines.filter(h => h.text && h.text.trim()).map(h => ({
          text: h.text.trim(),
          pinnedField: h.pinnedField
        })),
        descriptions: updatedAdData.descriptions.filter(d => d.text && d.text.trim()).map(d => ({
          text: d.text.trim(),
          pinnedField: d.pinnedField
        })),
        finalUrl: finalUrl
      };
      
      console.log("Sending ad update data:", adData);
      
      // Use the simplified update endpoint instead
      const updateResponse = await googleAdsAPI.updateAdSimple(
        selectedAd.id,
        adData
      );
      
      if (updateResponse.data && updateResponse.data.success) {
        // Update the ad in the state
        const updatedAds = responsiveAds.map(ad => 
          ad.id === selectedAd.id 
            ? {
                ...ad,
                headlines: adData.headlines,
                descriptions: adData.descriptions,
                finalUrl: adData.finalUrl
              }
            : ad
        );
        setResponsiveAds(updatedAds);
        
        // Show success message
        setSnackbarMessage('Ad updated successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Show error message
        setSnackbarMessage(updateResponse.data?.message || 'Failed to update ad');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error updating responsive search ad:', err);
      setSnackbarMessage('Failed to update ad');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUpdatingAd(false);
      handleUpdateAdDialogClose();
    }
  };

  // Handler for opening the delete confirmation dialog
  const handleOpenDeleteDialog = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  // Handler for closing the delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  // Handler for deleting a campaign
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    try {
      setDeletingCampaign(true);
      
      const response = await googleAdsAPI.deleteCampaign(campaignToDelete.id);
      
      if (response.data && response.data.success) {
        // Remove the campaign from the state
        const updatedCampaigns = googleAdsCampaigns.filter(
          (campaign) => campaign.id !== campaignToDelete.id
        );
        setGoogleAdsCampaigns(updatedCampaigns);
        
        // Show success message
        setSnackbarMessage(`Campaign "${campaignToDelete.name}" deleted successfully`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        // Show error message
        setSnackbarMessage(response.data?.message || 'Failed to delete campaign');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setSnackbarMessage(err.response?.data?.detail || 'Failed to delete campaign');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDeletingCampaign(false);
      handleCloseDeleteDialog();
    }
  };

  // Handle removing feedback
  const handleRemoveFeedback = async (feedbackId) => {
    try {
      await feedbackAPI.deleteFeedback(feedbackId);
      
      // Update the lists after removing feedback
      setLikedResponses(prevResponses => 
        prevResponses.filter(feedback => feedback.id !== feedbackId)
      );
      setDislikedResponses(prevResponses => 
        prevResponses.filter(feedback => feedback.id !== feedbackId)
      );
      
      // Show success message
      setSnackbarMessage('Feedback removed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error removing feedback:', err);
      setSnackbarMessage('Failed to remove feedback');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle feedback tabs change
  const handleReviewTabChange = (event, newValue) => {
    setReviewTab(newValue);
  };

  const [updatingAd, setUpdatingAd] = useState(false);

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
    <Container>
      {/* Payment Warning Alert */}
      {hasPaymentFailed && subscription.tier === 'Pro' && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              component={RouterLink} 
              to="/subscriptions"
            >
              Update Payment
            </Button>
          }
        >
          <AlertTitle>Subscription Payment Failed</AlertTitle>
          Your Pro subscription payment has failed. Pro features will be disabled on {graceEndDate}. Please update your payment method to continue using premium features.
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your campaigns and analytics
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Box>
          {canCreateCampaign ? (
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/campaigns/new"
              startIcon={<AddIcon />}
            >
              Create Campaign
            </Button>
          ) : (
            <Tooltip title="You've reached the maximum number of campaigns for your plan">
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  disabled
                  startIcon={<AddIcon />}
                >
                  Create Campaign
                </Button>
              </span>
            </Tooltip>
          )}
          
          {subscription?.tier === 'Free' && (
            <Button
              variant="outlined"
              color="secondary"
              component={RouterLink}
              to="/subscriptions"
              startIcon={<StarIcon />}
              sx={{ ml: 2 }}
            >
              Upgrade to Pro
            </Button>
          )}
        </Box>
      </Box>
      
      {!loading && campaigns.length === 0 && !error && (
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              component={RouterLink}
              to="/campaigns/new"
            >
              Create Campaign
            </Button>
          }
          sx={{ mb: 4 }}
        >
          No campaigns found. Create your first ad campaign to get started!
        </Alert>
      )}
      
      {subscription?.tier === 'Free' && (
        <Alert 
          severity="info" 
          sx={{ mb: 4 }}
          action={
            <Button
              color="inherit"
              size="small"
              component={RouterLink}
              to="/subscriptions"
            >
              Upgrade
            </Button>
          }
        >
          You're on the Free tier. Upgrade to Pro to access Google Ads integration and create up to 50 campaigns!
        </Alert>
      )}
      
      {maxCampaigns > 0 && (
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Campaign limit: {campaigns.length}/{maxCampaigns}
          </Typography>
          {campaignsRemaining <= 2 && (
            <Chip 
              label={`${campaignsRemaining} remaining`} 
              size="small" 
              color={campaignsRemaining === 0 ? "error" : "warning"} 
            />
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        aria-label="dashboard tabs"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Your Campaigns" />
        <Tab label="Google Ads" />
        <Tab label="AI Image Generation" icon={<ImageIcon />} iconPosition="start" />
        <Tab label="Response Review" icon={<ChatIcon />} iconPosition="start" />
      </Tabs>
      
      <TabPanel value={activeTab} index={0}>
        {/* Your Campaigns Tab Content */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : campaigns.length === 0 ? (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary" gutterBottom>
              You don't have any campaigns yet.
            </Typography>
            <Button
              component={RouterLink}
              to="/campaigns/new"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              startIcon={<AddIcon />}
            >
              Create Your First Campaign
            </Button>
          </Box>
        ) : (
          // Your existing campaign list UI
          <Box>
            {/* Group campaigns by platform */}
            {Object.entries(groupCampaignsByPlatform(campaigns)).map(([platform, platformCampaigns]) => (
              <Box key={platform} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {platform} Campaigns
                </Typography>
                <Grid container spacing={3}>
                  {platformCampaigns.map((campaign) => (
                    <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {campaign.image_url ? (
                          <CardMedia
                            component="img"
                            height="140"
                            image={campaign.image_url}
                            alt={campaign.title}
                          />
                        ) : (
                          <Box sx={{ height: 140, bgcolor: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon color="disabled" fontSize="large" />
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
                              {campaign.title}
                            </Typography>
                            <Chip 
                              label={campaign.status} 
                              size="small" 
                              color={getStatusColor(campaign.status)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {campaign.description?.substring(0, 100)}
                            {campaign.description?.length > 100 ? '...' : ''}
                          </Typography>
                          {campaign.budget && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Budget: ${campaign.budget} {campaign.budget_type}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button 
                            size="small" 
                            component={RouterLink} 
                            to={`/campaigns/${campaign.id}`}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="small" 
                            component={RouterLink} 
                            to={`/campaigns/edit/${campaign.id}`}
                            startIcon={<EditIcon />}
                          >
                            Edit
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {!canUseGoogleAds ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ mb: 2 }}>
              <LockIcon fontSize="large" color="action" />
            </Box>
            <Typography variant="h6" gutterBottom>
              Google Ads Integration is a Pro Feature
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Upgrade to Pro tier to connect your Google Ads account and manage campaigns directly.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              component={RouterLink}
              to="/subscriptions"
              startIcon={<StarIcon />}
            >
              Upgrade to Pro
            </Button>
          </Box>
        ) : (
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
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  {googleAdsCampaigns.map((campaign) => (
                    <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div" noWrap gutterBottom>
                            {campaign.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={campaign.status}
                              size="small"
                              color={getStatusColor(campaign.status)}
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {campaign.channel_type || campaign.campaignType || 'Search Campaign'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Budget: ${campaign.budget}/day
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Start Date:</strong> {formatCampaignDate(campaign.startDate || campaign.start_date || campaign.start_date_raw)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>End Date:</strong> {formatCampaignDate(campaign.endDate || campaign.end_date || campaign.end_date_raw)}
                            </Typography>
                          </Box>
                          
                          <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            sx={{ mt: 2 }}
                            onClick={() => handleViewResponsiveAds(campaign.id)}
                          >
                            View & Edit Ads
                          </Button>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<UpdateIcon />}
                            onClick={() => handleUpdateCampaign(campaign)}
                          >
                            Update
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDeleteDialog(campaign)}
                          >
                            Delete
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
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {/* AI Image Generation Tab Content */}
        <ImageGenerator />
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        {/* Response Review Tab Content */}
        {feedbackError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {feedbackError}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={reviewTab} onChange={handleReviewTabChange} aria-label="feedback tabs">
            <Tab 
              label="Liked Responses" 
              icon={<ThumbUpIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="Disliked Responses" 
              icon={<ThumbDownIcon />} 
              iconPosition="start" 
            />
          </Tabs>
        </Box>
        
        {loadingFeedback ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Liked Responses */}
            <TabPanel value={reviewTab} index={0}>
              {likedResponses.length === 0 ? (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    You haven't liked any responses yet.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {likedResponses.map((feedback) => (
                    <Grid item xs={12} key={feedback.id}>
                      <Card sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <ThumbUpIcon color="success" sx={{ mr: 1 }} />
                            Helpful Response
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(feedback.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {feedback.message?.content || 'Content not available'}
                          </ReactMarkdown>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleRemoveFeedback(feedback.id)}
                          >
                            Remove Feedback
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
            
            {/* Disliked Responses */}
            <TabPanel value={reviewTab} index={1}>
              {dislikedResponses.length === 0 ? (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary" gutterBottom>
                    You haven't disliked any responses yet.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {dislikedResponses.map((feedback) => (
                    <Grid item xs={12} key={feedback.id}>
                      <Card sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                            <ThumbDownIcon color="error" sx={{ mr: 1 }} />
                            Unhelpful Response
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(feedback.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {feedback.message?.content || 'Content not available'}
                          </ReactMarkdown>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleRemoveFeedback(feedback.id)}
                          >
                            Remove Feedback
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </>
        )}
      </TabPanel>
      
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
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date (YYYY-MM-DD)"
                  fullWidth
                  margin="normal"
                  value={updatedCampaignData.startDate}
                  disabled={true}
                  InputProps={{
                    readOnly: true,
                  }}
                  placeholder="YYYY-MM-DD"
                  helperText="Start date cannot be modified once campaign has started"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date (YYYY-MM-DD)"
                  fullWidth
                  margin="normal"
                  value={updatedCampaignData.endDate}
                  onChange={(e) => handleUpdateFieldChange('endDate', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  helperText="Leave empty for campaigns with no end date"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateDialogClose}>Cancel</Button>
          <Button 
            onClick={handleTestDirectUpdate} 
            color="secondary" 
            sx={{ mr: 1 }}
            disabled={isUpdating}
          >
            Test Direct Update
          </Button>
          <Button 
            onClick={handleSubmitUpdate} 
            variant="contained" 
            color="primary"
            disabled={isUpdating}
          >
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

      {/* Responsive Search Ads Dialog */}
      <Dialog
        open={responsiveAdsDialogOpen}
        onClose={handleResponsiveAdsDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedCampaign ? `Responsive Search Ads - ${selectedCampaign.name}` : 'Responsive Search Ads'}
        </DialogTitle>
        <DialogContent>
          {loadingResponsiveAds ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : responsiveAds.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1">No responsive search ads found for this campaign.</Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {responsiveAds.map((ad) => (
                <Card key={ad.id} sx={{ mb: 3, p: 2 }}>
                  <Typography variant="h6">Ad ID: {ad.id}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status: {ad.status}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>Headlines:</Typography>
                  <Box sx={{ ml: 2 }}>
                    {ad.headlines.map((headline, index) => (
                      <Typography key={index} variant="body2">
                        {index + 1}. {headline.text} 
                        {headline.pinnedField && (
                          <Chip 
                            label={`Pinned to ${headline.pinnedField}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    ))}
                  </Box>
                  
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>Descriptions:</Typography>
                  <Box sx={{ ml: 2 }}>
                    {ad.descriptions.map((description, index) => (
                      <Typography key={index} variant="body2">
                        {index + 1}. {description.text}
                        {description.pinnedField && (
                          <Chip 
                            label={`Pinned to ${description.pinnedField}`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    ))}
                  </Box>
                  
                  {ad.finalUrl && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      <strong>Final URL:</strong> {ad.finalUrl}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => handleUpdateAd(ad)}
                    >
                      Update Ad
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResponsiveAdsDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Responsive Search Ad Update Dialog */}
      <Dialog
        open={responsiveAdUpdateDialogOpen}
        onClose={handleUpdateAdDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Update Responsive Search Ad</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Google Ads requires a minimum of 3 headlines and 2 descriptions for responsive search ads.
              The system will mix and match your headlines and descriptions to find the best performing combinations.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Headlines</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add 3-15 headlines (min 3, max 15). Each headline can be up to 30 characters.
            </Typography>
            {updatedAdData.headlines.map((headline, index) => (
              <TextField
                key={index}
                label={`Headline ${index + 1}`}
                value={headline.text || ''}
                onChange={(e) => {
                  const newHeadlines = [...updatedAdData.headlines];
                  newHeadlines[index] = { ...headline, text: e.target.value };
                  setUpdatedAdData({
                    ...updatedAdData,
                    headlines: newHeadlines
                  });
                }}
                fullWidth
                margin="normal"
                helperText={headline.pinnedField ? `Pinned to ${headline.pinnedField}` : `${headline.text ? headline.text.length : 0}/30 characters`}
                error={headline.text && headline.text.length > 30}
                InputProps={{
                  endAdornment: (
                    <Typography variant="caption" color={headline.text && headline.text.length > 30 ? "error" : "text.secondary"}>
                      {headline.text ? headline.text.length : 0}/30
                    </Typography>
                  )
                }}
              />
            ))}
            
            {updatedAdData.headlines.length < 15 && (
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1, mb: 3 }}
                onClick={() => {
                  const newHeadlines = [...updatedAdData.headlines, { text: '', pinnedField: null }];
                  setUpdatedAdData({
                    ...updatedAdData,
                    headlines: newHeadlines
                  });
                }}
              >
                + Add Another Headline
              </Button>
            )}
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Descriptions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add 2-4 descriptions (min 2, max 4). Each description can be up to 90 characters.
            </Typography>
            {updatedAdData.descriptions.map((description, index) => (
              <TextField
                key={index}
                label={`Description ${index + 1}`}
                value={description.text || ''}
                onChange={(e) => {
                  const newDescriptions = [...updatedAdData.descriptions];
                  newDescriptions[index] = { ...description, text: e.target.value };
                  setUpdatedAdData({
                    ...updatedAdData,
                    descriptions: newDescriptions
                  });
                }}
                fullWidth
                margin="normal"
                multiline
                rows={2}
                helperText={description.pinnedField ? `Pinned to ${description.pinnedField}` : `${description.text ? description.text.length : 0}/90 characters`}
                error={description.text && description.text.length > 90}
                InputProps={{
                  endAdornment: (
                    <Typography variant="caption" color={description.text && description.text.length > 90 ? "error" : "text.secondary"}>
                      {description.text ? description.text.length : 0}/90
                    </Typography>
                  )
                }}
              />
            ))}
            
            {updatedAdData.descriptions.length < 4 && (
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1, mb: 3 }}
                onClick={() => {
                  const newDescriptions = [...updatedAdData.descriptions, { text: '', pinnedField: null }];
                  setUpdatedAdData({
                    ...updatedAdData,
                    descriptions: newDescriptions
                  });
                }}
              >
                + Add Another Description
              </Button>
            )}
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Final URL</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This is the landing page users will go to when they click your ad.
            </Typography>
            <TextField
              label="Final URL"
              value={updatedAdData.finalUrl || ''}
              onChange={(e) => {
                setUpdatedAdData({
                  ...updatedAdData,
                  finalUrl: e.target.value
                });
              }}
              fullWidth
              margin="normal"
              placeholder="https://www.example.com"
              helperText="Make sure your URL includes http:// or https://"
            />
            
            <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Ad Preview</Typography>
              
              <Box sx={{ 
                mb: 2, 
                p: 2, 
                border: '1px solid #ddd', 
                borderRadius: 1, 
                backgroundColor: '#fff',
                maxWidth: '600px'
              }}>
                {/* URL in green */}
                <Typography variant="body2" sx={{ color: '#1a0dab', fontSize: '16px', fontWeight: 'bold' }}>
                  {updatedAdData.headlines[0]?.text || '[Headline 1]'}
                </Typography>
                
                {/* Display URL in green */}
                <Typography variant="body2" sx={{ color: '#006621', fontSize: '14px' }}>
                  {updatedAdData.finalUrl ? updatedAdData.finalUrl.replace(/^https?:\/\//i, '') : 'www.example.com'}
                </Typography>
                
                {/* Ad copy */}
                <Typography variant="body2" sx={{ color: '#545454', fontSize: '14px', mt: 0.5 }}>
                  {updatedAdData.descriptions[0]?.text || '[Description 1]'}
                </Typography>
                
                {/* Additional headlines */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, gap: 1 }}>
                  {updatedAdData.headlines.slice(1, 4).map((headline, index) => (
                    headline.text ? (
                      <Typography key={index} variant="body2" sx={{ 
                        color: '#1a0dab',
                        fontSize: '14px',
                        '&:not(:last-child)::after': {
                          content: '"|"',
                          color: '#70757a',
                          marginLeft: '4px',
                          marginRight: '4px'
                        }
                      }}>
                        {headline.text}
                      </Typography>
                    ) : null
                  ))}
                </Box>
              </Box>
              
              <Typography variant="caption" color="text.secondary">
                This is a simplified preview. Google Ads will automatically test different combinations of your headlines and descriptions.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateAdDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmitAdUpdate} 
            variant="contained"
            disabled={
              updatedAdData.headlines.filter(h => h.text && h.text.trim()).length < 3 || 
              updatedAdData.descriptions.filter(d => d.text && d.text.trim()).length < 2 ||
              !updatedAdData.finalUrl ||
              updatedAdData.headlines.some(h => h.text && h.text.length > 30) ||
              updatedAdData.descriptions.some(d => d.text && d.text.length > 90) ||
              updatingAd
            }
            startIcon={updatingAd && <CircularProgress size={20} />}
          >
            {updatingAd ? 'Updating...' : 'Update Ad'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Campaign</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the campaign "{campaignToDelete?.name}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingCampaign}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteCampaign} 
            color="error" 
            disabled={deletingCampaign}
            startIcon={deletingCampaign ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deletingCampaign ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add the AuthDebug component */}
      <AuthDebug />
    </Container>
  );
};

export default Dashboard; 