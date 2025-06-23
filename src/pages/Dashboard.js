import React, { useState, useEffect, useCallback } from 'react';
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
  FormControlLabel,
  Switch,
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
} from '@mui/icons-material';
import { adCampaignAPI, googleAdsAPI, feedbackAPI } from '../services/api';
import AuthDebug from '../components/AuthDebug';
import ImageGenerator from '../components/ImageGeneration/ImageGenerator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import TokenDisplay from '../components/TokenDisplay';

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
  const { subscription, token, user } = useAuth();
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
  const [includeDeleted, setIncludeDeleted] = useState(true); // Default to showing deleted ads
  
  // New state for campaign performance data
  const [campaignPerformance, setCampaignPerformance] = useState({});
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceError, setPerformanceError] = useState(null);

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
  const [reviewTab, setReviewTab] = useState(0); // 0 = Liked, 1 = Disliked, 2 = Starred
  const [likedResponses, setLikedResponses] = useState([]);
  const [dislikedResponses, setDislikedResponses] = useState([]);
  const [starredResponses, setStarredResponses] = useState([]); // New state for starred responses
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

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adCampaignAPI.getCampaigns(null, null, includeDeleted);
      setCampaigns(response.data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [includeDeleted]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch Google Ads campaigns, feedback, and performance data when component mounts
  useEffect(() => {
    // Fetch Google Ads campaigns
    const fetchGoogleAdsData = async () => {
      try {
        setGoogleAdsLoading(true);
        setGoogleAdsError(null);
        
        const response = await googleAdsAPI.getCampaigns();
        
        if (response.data && response.data.success && response.data.data && response.data.data.campaigns) {
          const campaigns = response.data.data.campaigns;
          
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
            
            return processed;
          });
          
          setGoogleAdsCampaigns(processedCampaigns);
        } else {
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

    // Fetch feedback data
    const fetchFeedbackData = async () => {
      if (activeTab !== 3) return; // Only fetch when feedback tab is active
      
      try {
        setLoadingFeedback(true);
        setFeedbackError(null);
        
        // Fetch liked responses
        const likedResponse = await feedbackAPI.getLikedMessages();
        setLikedResponses(likedResponse.data);
        
        // Fetch disliked responses
        const dislikedResponse = await feedbackAPI.getDislikedMessages();
        setDislikedResponses(dislikedResponse.data);
        
        // Fetch starred responses
        const starredResponse = await feedbackAPI.getStarredMessages();
        setStarredResponses(starredResponse.data);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setFeedbackError('Failed to load feedback messages');
      } finally {
        setLoadingFeedback(false);
      }
    };

    // Call all the fetch functions
    fetchGoogleAdsData();
    fetchFeedbackData();
    fetchCampaignPerformance();
  }, [activeTab]);

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
      
      // If it's a Google Ads campaign
      if (activeTab === 1) {
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
      } else {
        // For AdTask campaigns (soft delete)
        const response = await adCampaignAPI.deleteCampaign(campaignToDelete.id);
        
        if (response.data) {
          // Refresh campaigns to show updated state
          fetchCampaigns();
          
          // Show success message
          setSnackbarMessage(`Campaign "${campaignToDelete.title}" deleted successfully`);
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          // Show error message
          setSnackbarMessage('Failed to delete campaign');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
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

  // Function to render feedback lists for both liked and disliked responses
  const renderFeedbackList = (feedbackList, type) => {
    if (loadingFeedback) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (feedbackError) {
    return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {feedbackError}
        </Alert>
      );
    }
    
    if (feedbackList.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No {type === 'liked' ? 'liked' : type === 'disliked' ? 'disliked' : 'starred'} responses yet.
        </Alert>
      );
    }
    
    return (
      <Box>
        {feedbackList.map((feedback) => (
          <Card key={feedback.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Message ID: {feedback.message_id}
                </Typography>
              <Box sx={{ 
                background: 'rgba(0,0,0,0.04)', 
                p: 2, 
                borderRadius: 1, 
                mt: 1,
                mb: 2
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {feedback.message ? feedback.message.content : 'Content not available'}
                </ReactMarkdown>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  size="small" 
                  color={type === 'liked' ? 'primary' : type === 'disliked' ? 'error' : 'warning'}
                  icon={type === 'liked' ? <ThumbUpIcon /> : type === 'disliked' ? <ThumbDownIcon /> : <StarIcon />}
                  label={type === 'liked' ? 'Liked' : type === 'disliked' ? 'Disliked' : 'Starred'}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  onClick={() => handleRemoveFeedback(feedback.id)}
                >
                  Remove
                </Button>
              </Box>
            </CardContent>
            </Card>
        ))}
      </Box>
    );
  };

  const [updatingAd, setUpdatingAd] = useState(false);

  // Inside the Dashboard component before the TabPanel index={0}
  // Add this toggle for including deleted ads
  const toggleDeletedAds = () => {
    setIncludeDeleted(!includeDeleted);
  };

  // Function to fetch campaign performance data
  const fetchCampaignPerformance = async (timeRange = "all_time") => {
    try {
      setLoadingPerformance(true);
      setPerformanceError(null);
      
      // Fetch real-time analytics with specified time range
      const response = await googleAdsAPI.getCampaignPerformance({
        time_range: timeRange
      });
      
      if (response.data && response.data.success) {
        // Convert the array to an object keyed by campaign_id for easier lookup
        const performanceMap = {};
        const performanceData = response.data.data.performance_data || [];
        
        performanceData.forEach(item => {
          if (!performanceMap[item.campaign_id]) {
            performanceMap[item.campaign_id] = [];
          }
          performanceMap[item.campaign_id].push(item);
        });
        
        setCampaignPerformance(performanceMap);
      } else {
        console.error("Failed to fetch campaign performance:", response.data?.message);
      }
    } catch (error) {
      console.error("Error fetching campaign performance:", error);
      setPerformanceError("Failed to load campaign performance data");
    } finally {
      setLoadingPerformance(false);
    }
  };

  // Component to render performance data for a campaign
  const CampaignPerformance = ({ campaignId }) => {
    const performanceData = campaignPerformance[campaignId] || [];
    
    if (loadingPerformance) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" sx={{ ml: 1 }}>Loading performance data...</Typography>
        </Box>
      );
    }
    
    if (performanceError) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          {performanceError}
        </Alert>
      );
    }
    
    if (performanceData.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          No performance data available for the selected time period.
        </Alert>
      );
    }
    
    // Calculate totals
    const totals = performanceData.reduce((acc, curr) => {
      acc.impressions += curr.impressions || 0;
      acc.clicks += curr.clicks || 0;
      acc.cost += curr.cost || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0 });
    
    // Calculate averages
    const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Performance (Last 30 Days)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">Impressions</Typography>
              <Typography variant="h6">{totals.impressions.toLocaleString()}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">Clicks</Typography>
              <Typography variant="h6">{totals.clicks.toLocaleString()}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">CTR</Typography>
              <Typography variant="h6">{avgCTR.toFixed(2)}%</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">Cost</Typography>
              <Typography variant="h6">${totals.cost.toFixed(2)}</Typography>
            </Box>
          </Grid>
        </Grid>
        
        {performanceData.length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              By Device
            </Typography>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              {performanceData.map((data, index) => (
                <Grid item xs={12} key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: 'background.paper', borderRadius: 1, mb: 1 }}>
                    <Typography variant="body2">{data.device}</Typography>
                    <Typography variant="body2">{data.impressions.toLocaleString()} impr. / {data.clicks.toLocaleString()} clicks</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    );
  };

  if (loading && googleAdsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const groupedCampaigns = groupCampaignsByPlatform(campaigns);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Display JWT Token */}
      <TokenDisplay token={token} />
      
      {/* Welcome Message */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.first_name || 'there'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your campaigns and analytics
        </Typography>
      </Box>
      
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
        <Tab label="Admin Tools" />
      </Tabs>
      
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Ad Campaigns
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={includeDeleted}
                  onChange={toggleDeletedAds}
                  color="primary"
                />
              }
              label="Show Deleted Campaigns"
            />
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/campaigns/new"
              startIcon={<AddIcon />}
              sx={{ ml: 2 }}
              disabled={!canCreateCampaign}
            >
              Create New Campaign
            </Button>
          </Box>
        </Box>
        
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
            {Object.entries(groupedCampaigns).map(([platform, platformCampaigns]) => (
              <Box key={platform} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {platform} Campaigns
                </Typography>
                <Grid container spacing={3}>
                  {platformCampaigns.map((campaign) => (
                    <Grid item xs={12} sm={6} md={4} key={campaign.id}>
                      <Card sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        opacity: campaign.deleted ? 0.7 : 1 
                      }}>
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
                            {campaign.deleted && (
                              <Chip
                                label="Deleted"
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            )}
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
                          
                          {/* Add campaign performance component for Google campaigns */}
                          {campaign.platform === "Google" && campaign.google_ads_campaign_id && (
                            <CampaignPerformance campaignId={campaign.google_ads_campaign_id} />
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
            <Typography variant="h6" gutterBottom>
              Link Your Google Ads Account
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You can now link your existing Google Ads account to manage campaigns directly in our platform.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/"
              startIcon={<GoogleIcon />}
              sx={{ mr: 2 }}
            >
              Link Account
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Want to create a new Google Ads account managed by us? <RouterLink to="/subscriptions">Upgrade to Pro</RouterLink>
            </Typography>
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
                          
                      {/* Add campaign performance data */}
                      {campaign.id && (
                        <CampaignPerformance campaignId={campaign.id} />
                      )}
                          
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Response Review</Typography>
          <Typography variant="body2" color="text.secondary">
            Review and manage chat responses you've marked as liked or disliked.
          </Typography>
        </Box>
        
        <Tabs value={reviewTab} onChange={handleReviewTabChange} sx={{ mb: 3 }}>
          <Tab label="Liked Responses" icon={<ThumbUpIcon />} iconPosition="start" />
          <Tab label="Disliked Responses" icon={<ThumbDownIcon />} iconPosition="start" />
          <Tab label="Starred Responses" icon={<StarIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Liked/Disliked Responses Content */}
        {loadingFeedback ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : feedbackError ? (
          <Alert severity="error" sx={{ mt: 3 }}>
            {feedbackError}
          </Alert>
        ) : reviewTab === 0 ? (
          renderFeedbackList(likedResponses, 'liked')
        ) : reviewTab === 1 ? (
          renderFeedbackList(dislikedResponses, 'disliked')
        ) : (
          renderFeedbackList(starredResponses, 'starred')
        )}
      </TabPanel>
      
      {/* Admin Tools Tab */}
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Admin Tools</Typography>
          <Typography variant="body2" color="text.secondary">
            Access administrative tools and diagnostics for the application.
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="div">
                  Database Viewer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  View and explore the application database content, schema, and statistics.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/database-viewer" 
                  color="primary"
                >
                  Open Database Viewer
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
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
                fullWidth
                margin="normal"
                value={headline.text}
                onChange={(e) => handleUpdateAdField('headline', e.target.value, index)}
              />
            ))}
            
            <Typography variant="h6" gutterBottom>Descriptions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add 2-10 descriptions (min 2, max 10). Each description can be up to 30 characters.
            </Typography>
            {updatedAdData.descriptions.map((description, index) => (
              <TextField
                key={index}
                label={`Description ${index + 1}`}
                fullWidth
                margin="normal"
                value={description.text}
                onChange={(e) => handleUpdateAdField('description', e.target.value, index)}
              />
            ))}
            
            <TextField
              label="Final URL"
              fullWidth
              margin="normal"
              value={updatedAdData.finalUrl}
              onChange={(e) => handleUpdateAdField('finalUrl', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdateAdDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSubmitAdUpdate} 
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 