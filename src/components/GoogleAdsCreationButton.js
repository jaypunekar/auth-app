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

const GoogleAdsCreationButton = ({ initialData, open: externalOpen, onClose: externalOnClose }) => {
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

  // Check if the user has a linked Google Ads account
  useEffect(() => {
    const checkAccountStatus = async () => {
      try {
        const response = await googleAdsApi.getAccountStatus();
        if (response && response.data) {
          setAccountStatus({
            isLinked: response.data.is_linked || false,
            customerId: response.data.customer_id || '',
            connectionType: response.data.connection_type || '',
            availableFunds: response.data.available_funds || 0
          });
        }
      } catch (error) {
        console.error('Error checking Google Ads account status:', error);
      }
    };

    checkAccountStatus();
  }, []);

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
      const response = await googleAdsApi.createCampaign(formattedData);
      
      // Show success message
      setSuccess(`Campaign "${formattedData.campaign_name}" created successfully in Google Ads!`);
      
      // Close the dialog after a delay
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Error creating Google Ads campaign:', err);
      setError(err.response?.data?.detail || 'Failed to create Google Ads campaign. Please try again.');
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
    </>
  );
};

GoogleAdsCreationButton.defaultProps = {
  initialData: null,
  open: undefined,
  onClose: undefined
};

export default GoogleAdsCreationButton; 