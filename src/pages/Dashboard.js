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
  Home as HomeIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { adCampaignAPI, googleAdsAPI, feedbackAPI } from '../services/api';
import AuthDebug from '../components/AuthDebug';
import ImageGenerator from '../components/ImageGeneration/ImageGenerator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import DatabaseViewer from '../components/Dashboard/DatabaseViewer';

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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Payment failure alert shown if applicable */}
      {hasPaymentFailed && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            subscription?.payment_url && (
              <Button 
                color="inherit" 
                size="small" 
                variant="outlined"
                onClick={() => window.open(subscription.payment_url, '_blank')}
              >
                Update Payment
              </Button>
            )
          }
        >
          <AlertTitle>Payment Failed</AlertTitle>
          Your subscription payment has failed. Pro features will be disabled on {graceEndDate} unless payment is made.
        </Alert>
      )}
      
      {/* The main content tabs */}
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<HomeIcon />} iconPosition="start" label="Campaigns" />
        {canUseGoogleAds && (
          <Tab icon={<GoogleIcon />} iconPosition="start" label="Google Ads" />
        )}
        <Tab icon={<ChatIcon />} iconPosition="start" label="Message History" />
        <Tab icon={<StorageIcon />} iconPosition="start" label="Database Explorer" />
        {/* Add more tabs here as needed */}
      </Tabs>
      
      {/* Campaigns tab */}
      <TabPanel value={activeTab} index={0}>
        {/* ... existing content ... */}
      </TabPanel>
      
      {/* Google Ads tab (conditionally shown) */}
      {canUseGoogleAds && (
        <TabPanel value={activeTab} index={1}>
          {/* ... existing content ... */}
        </TabPanel>
      )}
      
      {/* Message History tab */}
      <TabPanel value={activeTab} index={canUseGoogleAds ? 2 : 1}>
        {/* ... existing content ... */}
      </TabPanel>
      
      {/* Database Explorer tab */}
      <TabPanel value={activeTab} index={canUseGoogleAds ? 3 : 2}>
        <DatabaseViewer />
      </TabPanel>
    </Container>
  );
};

export default Dashboard; 