import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Modal,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Google as GoogleIcon,
  ExpandMore as ExpandMoreIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import googleAdsApi from '../services/googleAdsApi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// Define the modal style
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

const GoogleAdsCreationButton = ({ initialData, open: externalOpen, onClose: externalOnClose, onCampaignCreate }) => {
  const [open, setOpen] = useState(externalOpen || false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: '',
    connectionType: '',
    availableFunds: 0
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // State for unlinked accounts
  const [unlinkedAccounts, setUnlinkedAccounts] = useState([]);
  const [loadingUnlinkedAccounts, setLoadingUnlinkedAccounts] = useState(false);
  
  // State for the unlink confirmation dialogs
  const [unlinkConfirmStep, setUnlinkConfirmStep] = useState(0);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [hasActiveCampaigns, setHasActiveCampaigns] = useState(false);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [pauseCampaigns, setPauseCampaigns] = useState(false);
  const [unlinkSuccess, setUnlinkSuccess] = useState(false);

  const navigate = useNavigate();

  // Form data
  const [formData, setFormData] = useState({
    campaign_name: initialData?.title || '',
    daily_budget: initialData?.budget?.toString() || '10',
    start_date: initialData?.start_date ? new Date(initialData.start_date) : new Date(),
    end_date: initialData?.end_date ? new Date(initialData.end_date) : new Date(new Date().setDate(new Date().getDate() + 30)),
    headlines: initialData?.headlines || [],
    descriptions: initialData?.descriptions || [],
    keywords: initialData?.keywords || [],
    website_url: initialData?.website_url || 'https://www.example.com',
    location_targeting: initialData?.target_audience?.location || 'United States',
    device_targeting: 'all',
    ad_schedule: 'all_day',
    campaign_type: 'search',
    bidding_strategy: 'maximize_clicks',
    max_cpc: '1.00',
  });

  // New item inputs
  const [newHeadline, setNewHeadline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  // Update open state when externalOpen changes
  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        campaign_name: initialData.title || formData.campaign_name,
        daily_budget: initialData.budget?.toString() || formData.daily_budget,
        start_date: initialData.start_date ? new Date(initialData.start_date) : formData.start_date,
        end_date: initialData.end_date ? new Date(initialData.end_date) : formData.end_date,
        headlines: initialData.headlines || formData.headlines,
        descriptions: initialData.descriptions || formData.descriptions,
        keywords: initialData.keywords || formData.keywords,
        website_url: initialData.website_url || formData.website_url,
        location_targeting: initialData.target_audience?.location || formData.location_targeting,
      });
    }
  }, [initialData]);

  // Check account status on mount and when the component updates
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const response = await googleAdsApi.getAccountStatus();
        setAccountStatus(response.data);
        
        // If the component is mounted and no active account, fetch unlinked accounts
        if (!response.data.is_linked) {
          fetchUnlinkedAccounts();
        }
      } catch (error) {
        console.error('Error checking Google Ads account status:', error);
      }
    };

    checkAccountStatus();
    
    // Set up a periodic check every 5 minutes
    const intervalId = setInterval(checkAccountStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to fetch unlinked accounts
  const fetchUnlinkedAccounts = async () => {
    try {
      setLoadingUnlinkedAccounts(true);
      const response = await googleAdsApi.getUnlinkedAccounts();
      if (response && response.success && response.data.accounts) {
        setUnlinkedAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching unlinked accounts:', error);
    } finally {
      setLoadingUnlinkedAccounts(false);
    }
  };
  
  // Handle relinking an unlinked account
  const handleRelinkAccount = async (accountId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleAdsApi.relinkAccount(accountId);
      
      if (response && response.success) {
        setSuccess(response.message || 'Account successfully relinked');
        
        // Update account status
        setAccountStatus({
          isLinked: true,
          customerId: response.data.customer_id,
          connectionType: response.data.connection_type,
          availableFunds: response.data.available_funds || 0
        });
        
        // Close the dialog
        setModalOpen(false);
        
        // Show notification
        setNotification({
          open: true,
          message: 'Your Google Ads account has been relinked successfully.'
        });
      } else {
        setError(response.message || 'Failed to relink account');
      }
    } catch (error) {
      console.error('Error relinking account:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to relink account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new Google Ads account
  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleAdsApi.linkAccount({
        generate_new_account: true
      });
      
      if (response.success) {
        setSuccess("Google Ads account created successfully!");
        
        // Update account status
        setAccountStatus({
          isLinked: true,
          customerId: response.data.customer_id,
          connectionType: response.data.connection_type,
          availableFunds: response.data.available_funds || 0
        });
        
        // Close the modal
        setTimeout(() => {
          setModalOpen(false);
        }, 2000);
      } else {
        // Check if this is an upgrade required message
        if (response.data && response.data.requires_upgrade) {
          setError('Creating a new Google Ads account under our manager requires a Pro subscription. You can link your existing Google Ads account instead.');
        } else {
          setError(response.message || 'Failed to create Google Ads account');
        }
      }
    } catch (error) {
      console.error('Error creating Google Ads account:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to create Google Ads account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setActiveStep(0);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setOpen(false);
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  // Add a headline
  const handleAddHeadline = () => {
    if (!newHeadline.trim()) return;
    
    const updatedHeadlines = [...formData.headlines, newHeadline.trim()];
    setFormData({
      ...formData,
      headlines: updatedHeadlines,
    });
    setNewHeadline('');
  };

  // Remove a headline
  const handleRemoveHeadline = (index) => {
    const updatedHeadlines = [...formData.headlines];
    updatedHeadlines.splice(index, 1);
    setFormData({
      ...formData,
      headlines: updatedHeadlines,
    });
  };

  // Add a description
  const handleAddDescription = () => {
    if (!newDescription.trim()) return;
    
    const updatedDescriptions = [...formData.descriptions, newDescription.trim()];
    setFormData({
      ...formData,
      descriptions: updatedDescriptions,
    });
    setNewDescription('');
  };

  // Remove a description
  const handleRemoveDescription = (index) => {
    const updatedDescriptions = [...formData.descriptions];
    updatedDescriptions.splice(index, 1);
    setFormData({
      ...formData,
      descriptions: updatedDescriptions,
    });
  };

  // Add a keyword
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const updatedKeywords = [...formData.keywords, newKeyword.trim()];
    setFormData({
      ...formData,
      keywords: updatedKeywords,
    });
    setNewKeyword('');
  };

  // Remove a keyword
  const handleRemoveKeyword = (index) => {
    const updatedKeywords = [...formData.keywords];
    updatedKeywords.splice(index, 1);
    setFormData({
      ...formData,
      keywords: updatedKeywords,
    });
  };

  // Handle key press in text fields
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  // Add this function to reset the form
  const resetForm = () => {
    setFormData({
      campaign_name: '',
      daily_budget: '',
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      headline: '',
      description: '',
      keywords: [],
      headlines: [],
      descriptions: [],
      final_url: '',
      locations: [],
      gender: 'all',
      age_range: 'all',
      devices: ['computers', 'mobile', 'tablets'],
      language: 'en'
    });
    setNewHeadline('');
    setNewDescription('');
    setNewKeyword('');
  };

  // Rename the function to better reflect its new purpose
  const handleCreateCampaignViaApi = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Format dates properly for the API
      const formattedData = {
        ...formData,
        start_date: formData.start_date instanceof Date ? formData.start_date.toISOString().split('T')[0] : formData.start_date,
        end_date: formData.end_date instanceof Date ? formData.end_date.toISOString().split('T')[0] : formData.end_date,
        headlines: formData.headlines,
        descriptions: formData.descriptions,
        keywords: formData.keywords
      };
      
      console.log('Creating Google Ads campaign with data:', formattedData);
      
      // Check if the user has a Google Ads account
      if (!accountStatus.isLinked || !accountStatus.customerId) {
        setError('You need to link your Google Ads account first. Please use the "Link Google Ads" button in the top bar.');
        setLoading(false);
        return;
      }
      
      // Check if the account is created under our management and has sufficient funds
      const dailyBudget = parseFloat(formData.daily_budget);
      if (accountStatus.connectionType === 'created') {
        // Calculate the minimum funds required (30 days of daily budget)
        const minimumFundsRequired = dailyBudget * 30;
        
        if (accountStatus.availableFunds < minimumFundsRequired) {
          setError(
            `Insufficient funds. Your campaign requires at least $${minimumFundsRequired.toFixed(2)} ` +
            `(30 days of daily budget), but you only have $${accountStatus.availableFunds.toFixed(2)} available. ` +
            `Please add more funds before creating this campaign.`
          );
          setLoading(false);
          return;
        }
      }
      
      // Add customer ID to the data
      formattedData.customer_id = accountStatus.customerId;
      
      // Call the API to create the campaign
      const campaignResponse = await googleAdsApi.createCampaign(formattedData);
      
      if (campaignResponse.success) {
        setSuccess('Campaign created successfully!');
        
        // Reset form if creating from scratch
        if (!initialData) {
          resetForm();
        }
        
        // Close the dialog after a delay
        setTimeout(() => {
          handleClose();
          
          // Trigger a callback if provided
          if (onCampaignCreate) {
            onCampaignCreate(campaignResponse.data);
          }
          
          // Redirect to dashboard if not using in existing view
          if (!initialData) {
            navigate('/');
          }
        }, 2000);
      } else {
        setError(campaignResponse.message || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      // Fix: Ensure we're setting a string, not an object
      const errorMessage = typeof error.response?.data?.detail === 'object' 
        ? JSON.stringify(error.response?.data?.detail) 
        : error.response?.data?.detail || 'Failed to create campaign. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Validate current step
  const validateStep = () => {
    switch (activeStep) {
      case 0: // Campaign Settings
        return formData.campaign_name && formData.daily_budget;
      case 1: // Ad Content
        return formData.headlines.length >= 3 && formData.descriptions.length >= 2 && formData.website_url;
      case 2: // Keywords & Targeting
        return formData.keywords.length >= 1;
      default:
        return true;
    }
  };

  // Render steps
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Campaign Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Campaign Name"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleChange}
                required
                helperText="Enter a descriptive name for your campaign"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Daily Budget ($)"
                name="daily_budget"
                value={formData.daily_budget}
                onChange={handleChange}
                type="number"
                InputProps={{ inputProps: { min: 5 } }}
                required
                helperText="Minimum daily budget is $5"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Campaign Type</InputLabel>
                <Select
                  name="campaign_type"
                  value={formData.campaign_type}
                  onChange={handleChange}
                  label="Campaign Type"
                >
                  <MenuItem value="search">Search</MenuItem>
                  <MenuItem value="display">Display</MenuItem>
                  <MenuItem value="shopping">Shopping</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date) => handleDateChange('start_date', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(date) => handleDateChange('end_date', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bidding Strategy</InputLabel>
                <Select
                  name="bidding_strategy"
                  value={formData.bidding_strategy}
                  onChange={handleChange}
                  label="Bidding Strategy"
                >
                  <MenuItem value="maximize_clicks">Maximize Clicks</MenuItem>
                  <MenuItem value="manual_cpc">Manual CPC</MenuItem>
                  <MenuItem value="target_roas">Target ROAS</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.bidding_strategy === 'manual_cpc' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max CPC Bid ($)"
                  name="max_cpc"
                  value={formData.max_cpc}
                  onChange={handleChange}
                  type="number"
                  InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                  helperText="Maximum cost-per-click bid"
                />
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Ad Content
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website URL"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                required
                helperText="The landing page URL for your ad"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Headlines (Required: at least 3)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add Headline"
                      value={newHeadline}
                      onChange={(e) => setNewHeadline(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleAddHeadline)}
                      helperText={`${newHeadline.length}/30 characters (max)`}
                      inputProps={{ maxLength: 30 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddHeadline}
                      sx={{ ml: 1, minWidth: 'auto' }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.headlines.map((headline, index) => (
                      <Chip
                        key={index}
                        label={headline}
                        onDelete={() => handleRemoveHeadline(index)}
                      />
                    ))}
                  </Box>
                  
                  {formData.headlines.length < 3 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Please add at least 3 headlines for your ad.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Descriptions (Required: at least 2)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add Description"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      multiline
                      rows={2}
                      helperText={`${newDescription.length}/90 characters (max)`}
                      inputProps={{ maxLength: 90 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddDescription}
                      sx={{ ml: 1, minWidth: 'auto', height: 'fit-content' }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {formData.descriptions.map((description, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                          {description}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRemoveDescription(index)}
                          sx={{ ml: 1 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  
                  {formData.descriptions.length < 2 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Please add at least 2 descriptions for your ad.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Keywords & Targeting
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Keywords (Required: at least 1)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Add Keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, handleAddKeyword)}
                      helperText="Enter keywords that are relevant to your business"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddKeyword}
                      sx={{ ml: 1, minWidth: 'auto' }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.keywords.map((keyword, index) => (
                      <Chip
                        key={index}
                        label={keyword}
                        onDelete={() => handleRemoveKeyword(index)}
                      />
                    ))}
                  </Box>
                  
                  {formData.keywords.length < 1 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Please add at least 1 keyword for your campaign.
                    </Alert>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Targeting"
                name="location_targeting"
                value={formData.location_targeting}
                onChange={handleChange}
                helperText="Enter countries, states, or cities to target"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Device Targeting</InputLabel>
                <Select
                  name="device_targeting"
                  value={formData.device_targeting}
                  onChange={handleChange}
                  label="Device Targeting"
                >
                  <MenuItem value="all">All Devices</MenuItem>
                  <MenuItem value="mobile">Mobile Only</MenuItem>
                  <MenuItem value="desktop">Desktop Only</MenuItem>
                  <MenuItem value="tablet">Tablet Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Ad Schedule</InputLabel>
                <Select
                  name="ad_schedule"
                  value={formData.ad_schedule}
                  onChange={handleChange}
                  label="Ad Schedule"
                >
                  <MenuItem value="all_day">All Day (24/7)</MenuItem>
                  <MenuItem value="business_hours">Business Hours Only</MenuItem>
                  <MenuItem value="weekdays">Weekdays Only</MenuItem>
                  <MenuItem value="weekends">Weekends Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Review & Create
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Campaign Settings
                </Typography>
                <Typography><strong>Name:</strong> {formData.campaign_name}</Typography>
                <Typography><strong>Daily Budget:</strong> ${formData.daily_budget}</Typography>
                <Typography><strong>Campaign Type:</strong> {formData.campaign_type.charAt(0).toUpperCase() + formData.campaign_type.slice(1)}</Typography>
                <Typography><strong>Start Date:</strong> {formData.start_date instanceof Date ? formData.start_date.toLocaleDateString() : formData.start_date}</Typography>
                <Typography><strong>End Date:</strong> {formData.end_date instanceof Date ? formData.end_date.toLocaleDateString() : formData.end_date}</Typography>
                <Typography><strong>Bidding Strategy:</strong> {formData.bidding_strategy.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Typography>
                {formData.bidding_strategy === 'manual_cpc' && (
                  <Typography><strong>Max CPC:</strong> ${formData.max_cpc}</Typography>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ad Content
                </Typography>
                <Typography><strong>Website URL:</strong> {formData.website_url}</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Headlines:</Typography>
                <Box sx={{ pl: 2 }}>
                  {formData.headlines.map((headline, index) => (
                    <Typography key={index}>• {headline}</Typography>
                  ))}
                </Box>
                
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Descriptions:</Typography>
                <Box sx={{ pl: 2 }}>
                  {formData.descriptions.map((description, index) => (
                    <Typography key={index}>• {description}</Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Keywords & Targeting
                </Typography>
                
                <Typography variant="subtitle2">Keywords:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {formData.keywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} />
                  ))}
                </Box>
                
                <Typography><strong>Location Targeting:</strong> {formData.location_targeting}</Typography>
                <Typography><strong>Device Targeting:</strong> {formData.device_targeting.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Typography>
                <Typography><strong>Ad Schedule:</strong> {formData.ad_schedule.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Typography>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  const steps = ['Campaign Settings', 'Ad Content', 'Keywords & Targeting', 'Review & Create'];

  // Function to handle the unlink account process
  const handleUnlinkAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for active campaigns
      const activeCampaignsResponse = await googleAdsApi.checkActiveCampaigns();
      if (activeCampaignsResponse && activeCampaignsResponse.data) {
        setHasActiveCampaigns(activeCampaignsResponse.data.has_active_campaigns);
        setActiveCampaignCount(activeCampaignsResponse.data.active_campaign_count);
      }
      
      // Open the unlink dialog with step 1
      setUnlinkConfirmStep(1);
      setShowUnlinkDialog(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking active campaigns:', error);
      setError(error.response?.data?.detail || 'Failed to check account status. Please try again.');
      setLoading(false);
    }
  };

  // Handle closing the unlink dialog
  const handleCloseUnlinkDialog = () => {
    setShowUnlinkDialog(false);
    setUnlinkConfirmStep(0);
    setPauseCampaigns(false);
    setUnlinkSuccess(false);
  };

  // Handle the first confirmation step (active campaigns warning)
  const handleFirstConfirmStep = (confirmed) => {
    if (!confirmed) {
      // User chose "No, keep my account"
      handleCloseUnlinkDialog();
      return;
    }
    
    // User chose "Yes, pause my account and unlink anyway"
    if (hasActiveCampaigns) {
      setPauseCampaigns(true);
    }
    
    // Move to step 2 (data deletion warning)
    setUnlinkConfirmStep(2);
  };

  // Handle the second confirmation step (data deletion warning)
  const handleSecondConfirmStep = async (confirmed) => {
    if (!confirmed) {
      // User chose "No, keep my account"
      handleCloseUnlinkDialog();
      return;
    }
    
    // User chose "Yes, unlink my account"
    try {
      setLoading(true);
      
      // First attempt: normal unlinking
      const response = await googleAdsApi.unlinkAccount(pauseCampaigns);
      
      if (response && response.success) {
        // Second attempt: reset account status
        try {
          await googleAdsApi.resetAccountStatus();
          
          // Third attempt: check if still linked and force unlink if needed
          const statusCheck = await googleAdsApi.getAccountStatus();
          if (statusCheck?.data?.is_linked) {
            await googleAdsApi.forceUnlinkDb();
          }
        } catch (resetError) {
          console.error('Error during account reset:', resetError);
        }
        
        // Even if steps fail, show success from initial unlink
        setSuccess('Account unlinked successfully');
        setAccountStatus({
          isLinked: false,
          customerId: '',
          connectionType: '',
          availableFunds: 0
        });
        setUnlinkConfirmStep(3);
        setUnlinkSuccess(true);
      } else {
        // First attempt failed, try force DB unlink
        try {
          const forceResult = await googleAdsApi.forceUnlinkDb();
          if (forceResult?.success) {
            setSuccess('Account forcibly unlinked');
            setAccountStatus({
              isLinked: false,
              customerId: '',
              connectionType: '',
              availableFunds: 0
            });
            setUnlinkConfirmStep(3);
            setUnlinkSuccess(true);
          } else {
            setError('Failed to unlink account');
            handleCloseUnlinkDialog();
          }
        } catch (forceError) {
          console.error('Force unlink failed:', forceError);
          // Fix: Ensure we're setting a string, not an object
          const errorMessage = typeof forceError.response?.data?.detail === 'object' 
            ? JSON.stringify(forceError.response?.data?.detail) 
            : forceError.response?.data?.detail || 'All unlink methods failed';
          setError(errorMessage);
          handleCloseUnlinkDialog();
        }
      }
    } catch (error) {
      console.error('Initial unlink failed:', error);
      
      // Try force DB unlink as last resort
      try {
        const forceResult = await googleAdsApi.forceUnlinkDb();
        if (forceResult?.success) {
          setSuccess('Account forcibly unlinked');
          setAccountStatus({
            isLinked: false,
            customerId: '',
            connectionType: '',
            availableFunds: 0
          });
          setUnlinkConfirmStep(3);
          setUnlinkSuccess(true);
        } else {
          // Fix: Ensure we're setting a string, not an object
          const errorMessage = typeof error.response?.data?.detail === 'object' 
            ? JSON.stringify(error.response?.data?.detail) 
            : error.response?.data?.detail || 'All unlink attempts failed';
          setError(errorMessage);
          handleCloseUnlinkDialog();
        }
      } catch (forceError) {
        console.error('Force unlink failed:', forceError);
        // Fix: Ensure we're setting a string, not an object
        const errorMessage = typeof forceError.response?.data?.detail === 'object' 
          ? JSON.stringify(forceError.response?.data?.detail) 
          : forceError.response?.data?.detail || 'All unlink methods failed';
        setError(errorMessage);
        handleCloseUnlinkDialog();
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle the final step (add a different account)
  const handleAddDifferentAccount = (confirmed) => {
    handleCloseUnlinkDialog();
    
    if (confirmed) {
      // User chose "Yes" to add a different account
      // Reset the form and go to step 0
      setActiveStep(0);
    } else {
      // User chose "No" - just close everything
      handleClose();
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Handle showing the unlink dialog
  const handleShowUnlinkDialog = () => {
    setShowUnlinkDialog(true);
    setUnlinkConfirmStep(1);
  };

  return (
    <>
      {!externalOpen && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<GoogleIcon />}
          onClick={handleOpen}
          sx={{ mb: 2 }}
        >
          Create Google Ads Campaign
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GoogleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Create Google Ads Campaign</Typography>
            </Box>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {!accountStatus.isLinked ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              You need to link your Google Ads account before creating campaigns. Please use the "Link Google Ads" button in the top bar.
            </Alert>
          ) : accountStatus.connectionType === 'created' && accountStatus.availableFunds <= 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your Google Ads account has no funds available. Please add funds before creating campaigns.
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              
              {accountStatus.connectionType === 'created' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Available funds: ${accountStatus.availableFunds.toFixed(2)}
                </Alert>
              )}
              
              {/* Account Status & Unlink Button */}
              {accountStatus.isLinked && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0e0e0', p: 2, borderRadius: 1 }}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Connected Account: {accountStatus.customerId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connection Type: {accountStatus.connectionType === 'created' ? 'Created by Us' : 'Linked External Account'}
                    </Typography>
                  </Box>
                  {(accountStatus.connectionType === 'linked') && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<ExitToAppIcon />}
                      onClick={handleUnlinkAccount}
                      disabled={loading}
                    >
                      Unlink Account
                    </Button>
                  )}
                </Box>
              )}
              
              <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {getStepContent(activeStep)}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          
          {accountStatus.isLinked && (
            <>
              {activeStep > 0 && (
                <Button onClick={handleBack} color="inherit">
                  Back
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  variant="contained" 
                  color="primary"
                  disabled={!validateStep()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateCampaignViaApi} 
                  variant="contained" 
                  color="primary"
                  startIcon={<GoogleIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Google Ads using API'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Unlink Account Confirmation Dialog Series */}
      <Dialog 
        open={showUnlinkDialog} 
        onClose={handleCloseUnlinkDialog}
        maxWidth="sm" 
        fullWidth
      >
        {/* Step 1: Active Campaign Warning */}
        {unlinkConfirmStep === 1 && (
          <>
            <DialogTitle>
              {hasActiveCampaigns ? 'Active Campaigns Detected' : 'Unlink Google Ads Account'}
            </DialogTitle>
            <DialogContent>
              {hasActiveCampaigns ? (
                <>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    You have {activeCampaignCount} active {activeCampaignCount === 1 ? 'campaign' : 'campaigns'} in your Google Ads account.
                  </Alert>
                  <Typography variant="body1" gutterBottom>
                    Do you want to pause your active campaigns and unlink your account anyway?
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" gutterBottom>
                  Are you sure you want to unlink your Google Ads account?
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleFirstConfirmStep(false)}>
                No, Keep My Account
              </Button>
              <Button 
                onClick={() => handleFirstConfirmStep(true)} 
                color="primary" 
                variant="contained"
                disabled={loading}
              >
                {hasActiveCampaigns ? 'Yes, Pause and Unlink Anyway' : 'Yes, Continue'}
              </Button>
            </DialogActions>
          </>
        )}
        
        {/* Step 2: Data Deletion Warning */}
        {unlinkConfirmStep === 2 && (
          <>
            <DialogTitle>Confirm Account Unlinking</DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Unlinking your account will delete your connection data from our system.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to unlink your Google Ads account?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleSecondConfirmStep(false)}>
                No, Keep My Account
              </Button>
              <Button 
                onClick={() => handleSecondConfirmStep(true)} 
                color="primary" 
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Yes, Unlink My Account'}
              </Button>
            </DialogActions>
          </>
        )}
        
        {/* Step 3: Success and Add Different Account */}
        {unlinkConfirmStep === 3 && unlinkSuccess && (
          <>
            <DialogTitle>Account Successfully Unlinked</DialogTitle>
            <DialogContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your account will be deleted from our system within 24 hours.
              </Alert>
              <Typography variant="body1" gutterBottom>
                Would you like to add a different Google Ads account?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleAddDifferentAccount(false)}>
                No
              </Button>
              <Button 
                onClick={() => handleAddDifferentAccount(true)} 
                color="primary" 
                variant="contained"
              >
                Yes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpenModal}
        sx={{ mb: 2 }}
      >
        {accountStatus && accountStatus.is_linked ? 
          "Manage Google Ads" : 
          "Create Google Ads Account"
        }
      </Button>
      
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
      >
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" gutterBottom>
            Google Ads Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {accountStatus && accountStatus.is_linked ? (
            // User has an active Google Ads account
            <Box>
              <Typography variant="body1" gutterBottom>
                You have an active Google Ads account.
              </Typography>
              <Typography variant="body2" paragraph>
                Account ID: <strong>{accountStatus.customer_id}</strong>
              </Typography>
              
              {accountStatus.connection_type === "created" && (
                <Box>
                  <Typography variant="body2">
                    Available Funds: <strong>${accountStatus.available_funds.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" paragraph>
                    You can add funds to your account or create campaigns directly.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("/google-ads")}
                    sx={{ mt: 1 }}
                  >
                    Manage Account
                  </Button>
                </Box>
              )}
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleShowUnlinkDialog}
                sx={{ mt: 2 }}
              >
                Unlink Account
              </Button>
            </Box>
          ) : (
            // User does not have an active account
            <Box>
              {/* Unlinked Accounts Section */}
              {unlinkedAccounts.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Your Unlinked Accounts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    You can relink one of your previously unlinked accounts:
                  </Typography>
                  
                  {loadingUnlinkedAccounts ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <List>
                      {unlinkedAccounts.map((account) => (
                        <ListItem
                          key={account.id}
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'background.paper'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography fontWeight="bold">
                                {account.customer_id} 
                                {account.connection_type === 'created' && 
                                  <Chip 
                                    size="small" 
                                    color="success" 
                                    label={`$${account.available_funds.toFixed(2)} available`} 
                                    sx={{ ml: 1 }}
                                  />
                                }
                              </Typography>
                            }
                            secondary={
                              <>
                                {account.connection_type === 'created' ? 'Created account' : 'Linked account'}
                                <br />
                                Unlinked on: {new Date(account.unlinked_at).toLocaleDateString()}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => handleRelinkAccount(account.id)}
                              disabled={loading}
                            >
                              {loading ? <CircularProgress size={24} /> : 'Relink'}
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            
              <Typography variant="body1" paragraph>
                Create a new Google Ads account to start advertising your business.
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateAccount}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Create New Account'}
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary">
                You can also <RouterLink to="/google-ads">link an existing Google Ads account</RouterLink> if you already have one.
              </Typography>
            </Box>
          )}
          
          <Button 
            onClick={handleCloseModal} 
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Box>
      </Modal>
      
      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity || "info"} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

GoogleAdsCreationButton.defaultProps = {
  initialData: null,
  open: undefined,
  onClose: undefined
};

export default GoogleAdsCreationButton; 