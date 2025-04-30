import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControlLabel,
  Radio,
  RadioGroup,
  Chip,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { adCampaignAPI } from '../services/api';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Platform-specific form components
import MetaForm from '../components/adForms/MetaForm';
import GoogleForm from '../components/adForms/GoogleForm';
import TikTokForm from '../components/adForms/TikTokForm';
import SnapchatForm from '../components/adForms/SnapchatForm';
import RedditForm from '../components/adForms/RedditForm';
import PinterestForm from '../components/adForms/PinterestForm';
import LinkedInForm from '../components/adForms/LinkedInForm';

const AdCampaignForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get campaign ID from URL if editing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: 'Google',
    budget: '',
    budget_type: 'Daily',
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
    status: 'Draft',
    target_audience: {
      location: '',
      age_min: '',
      age_max: '',
      gender: '',
      interests: '',
      keywords: '',
    },
    image: null,
    // Google specific fields
    google: {
      campaign_type: 'Search',
      ad_type: 'Responsive Search Ad',
      keywords: '',
      negative_keywords: '',
      headline_1: '',
      headline_2: '',
      headline_3: '',
      description_1: '',
      description_2: '',
      final_url: '',
    }
  });

  const platforms = [
    'Google'
  ];

  // Fetch campaign data if editing
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await adCampaignAPI.getCampaign(id);
        const campaignData = response.data;
        
        // Parse dates
        if (campaignData.start_date) {
          campaignData.start_date = new Date(campaignData.start_date);
        }
        if (campaignData.end_date) {
          campaignData.end_date = new Date(campaignData.end_date);
        }
        
        // Parse target audience if it's a JSON string
        if (typeof campaignData.target_audience === 'string') {
          try {
            campaignData.target_audience = JSON.parse(campaignData.target_audience);
          } catch (e) {
            console.error('Error parsing target_audience:', e);
            campaignData.target_audience = {};
          }
        }
        
        // Parse platform-specific data if available
        const platformData = {};
        if (campaignData.platform_data) {
          try {
            const parsedData = typeof campaignData.platform_data === 'string' 
              ? JSON.parse(campaignData.platform_data) 
              : campaignData.platform_data;
            
            platformData[campaignData.platform.toLowerCase()] = parsedData;
          } catch (e) {
            console.error('Error parsing platform_data:', e);
          }
        }
        
        // Set form data with campaign data
        setFormData({
          ...formData,
          ...campaignData,
          image: null, // Clear image since we can't populate file input
          ...platformData,
        });
        
        setIsEditing(true);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError('Failed to load campaign data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If platform is changed, reset the active tab
    if (name === 'platform') {
      setActiveTab(0);
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: null
      });
    }
  };

  const handleAudienceChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      target_audience: {
        ...formData.target_audience,
        [name]: value,
      },
    });
    
    // Clear field error if it exists
    if (fieldErrors[`target_audience.${name}`]) {
      setFieldErrors({
        ...fieldErrors,
        [`target_audience.${name}`]: null
      });
    }
  };

  const handlePlatformDataChange = (platform, data) => {
    setFormData({
      ...formData,
      [platform.toLowerCase()]: {
        ...formData[platform.toLowerCase()],
        ...data,
      },
    });
  };

  const handleDateChange = (name, date) => {
    console.log(`handleDateChange called for ${name}:`, date);
    
    setFormData({
      ...formData,
      [name]: date,
    });
    
    console.log(`Updated formData.${name}:`, date);
    
    // Clear field error when date is changed
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: null
      });
    }
    
    // If end_date is changed and there was a date range error, check start_date too
    if (name === 'end_date' && fieldErrors.end_date && formData.start_date) {
      if (date > formData.start_date) {
        setFieldErrors({
          ...fieldErrors,
          end_date: null
        });
      }
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
      });
      
      // Clear image field error if it exists
      if (fieldErrors.image) {
        setFieldErrors({
          ...fieldErrors,
          image: null
        });
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Check required fields
    if (!formData.title) {
      errors.title = 'Campaign title is required';
      isValid = false;
    }

    if (!formData.description) {
      errors.description = 'Campaign description is required';
      isValid = false;
    }

    if (!formData.platform) {
      errors.platform = 'Please select a platform';
      isValid = false;
    }

    // Make image required for all platforms
    if (!formData.image && !isEditing) {
      errors.image = 'An image is required for your campaign';
      isValid = false;
    } else if (!formData.image && isEditing && ['Pinterest', 'Snapchat', 'TikTok'].includes(formData.platform)) {
      // For editing, still enforce image requirement for visual platforms
      errors.image = `An image is required for ${formData.platform} campaigns`;
      isValid = false;
    }

    // Validate date range if both dates are provided
    if (formData.start_date && formData.end_date) {
      if (formData.start_date > formData.end_date) {
        errors.end_date = 'End date must be after start date';
        isValid = false;
      }
    }

    // Platform-specific validation
    if (formData.platform === 'Meta') {
      if (!formData.meta.headline) {
        errors['meta.headline'] = 'Headline is required for Meta ads';
        isValid = false;
      }
      if (!formData.meta.primary_text) {
        errors['meta.primary_text'] = 'Primary text is required for Meta ads';
        isValid = false;
      }
    } else if (formData.platform === 'Google') {
      if (!formData.google.headlines[0]) {
        errors['google.headlines.0'] = 'At least one headline is required for Google ads';
        isValid = false;
      }
      if (!formData.google.descriptions[0]) {
        errors['google.descriptions.0'] = 'At least one description is required for Google ads';
        isValid = false;
      }
      if (!formData.google.final_url) {
        errors['google.final_url'] = 'Final URL is required for Google ads';
        isValid = false;
      }
    } else if (formData.platform === 'TikTok') {
      if (!formData.tiktok.ad_copy) {
        errors['tiktok.ad_copy'] = 'Ad copy is required for TikTok ads';
        isValid = false;
      }
    }
    // Add validation for other platforms as needed

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const campaignData = {
        ...formData,
        status: isEditing ? formData.status : 'Draft', // Keep existing status if editing
      };
      
      // Format dates properly
      if (formData.start_date) {
        console.log('Original start_date:', formData.start_date);
        campaignData.start_date = format(formData.start_date, 'yyyy-MM-dd');
        console.log('Formatted start_date:', campaignData.start_date);
      }
      
      if (formData.end_date) {
        console.log('Original end_date:', formData.end_date);
        campaignData.end_date = format(formData.end_date, 'yyyy-MM-dd');
        console.log('Formatted end_date:', campaignData.end_date);
      }
      
      // Ensure target_audience is properly formatted as an object
      if (typeof campaignData.target_audience !== 'object') {
        campaignData.target_audience = {};
      }
      
      // Extract platform-specific data
      if (campaignData.platform) {
        const platformKey = campaignData.platform.toLowerCase();
        if (campaignData[platformKey]) {
          campaignData.platform_data = campaignData[platformKey];
        }
      }
      
      let response;
      
      if (isEditing) {
        // Update existing campaign
        if (formData.image) {
          // With image
          const formPayload = new FormData();
          
          // Add image file
          formPayload.append('image', formData.image);
          
          // Add required fields individually
          formPayload.append('title', campaignData.title);
          formPayload.append('description', campaignData.description);
          formPayload.append('platform', campaignData.platform);
          formPayload.append('status', campaignData.status);
          
          // Add optional fields
          if (campaignData.target_audience) {
            formPayload.append('target_audience', JSON.stringify(campaignData.target_audience));
          }
          if (campaignData.budget) {
            formPayload.append('budget', campaignData.budget);
          }
          if (campaignData.budget_type) {
            formPayload.append('budget_type', campaignData.budget_type);
          }
          if (campaignData.start_date) {
            console.log('Appending start_date to FormData:', campaignData.start_date);
            formPayload.append('start_date', campaignData.start_date);
          }
          if (campaignData.end_date) {
            console.log('Appending end_date to FormData:', campaignData.end_date);
            formPayload.append('end_date', campaignData.end_date);
          }
          if (campaignData.platform_data) {
            formPayload.append('platform_data', JSON.stringify(campaignData.platform_data));
          }
          
          console.log('Sending update with image:', Object.fromEntries(formPayload.entries()));
          response = await adCampaignAPI.updateCampaign(id, formPayload);
        } else {
          // Without image
          console.log('Sending update without image:', campaignData);
          response = await adCampaignAPI.updateCampaign(id, campaignData);
        }
        
        console.log('Campaign updated:', response.data);
      } else {
        // Create new campaign
        if (formData.image) {
          // With image
          const formPayload = new FormData();
          
          // Add image file
          formPayload.append('image', formData.image);
          
          // Add required fields individually
          formPayload.append('title', campaignData.title);
          formPayload.append('description', campaignData.description);
          formPayload.append('platform', campaignData.platform);
          
          // Add optional fields
          if (campaignData.target_audience) {
            formPayload.append('target_audience', JSON.stringify(campaignData.target_audience));
          }
          if (campaignData.budget) {
            formPayload.append('budget', campaignData.budget);
          }
          if (campaignData.budget_type) {
            formPayload.append('budget_type', campaignData.budget_type);
          }
          if (campaignData.start_date) {
            console.log('Appending start_date to FormData:', campaignData.start_date);
            formPayload.append('start_date', campaignData.start_date);
          }
          if (campaignData.end_date) {
            console.log('Appending end_date to FormData:', campaignData.end_date);
            formPayload.append('end_date', campaignData.end_date);
          }
          if (campaignData.platform_data) {
            formPayload.append('platform_data', JSON.stringify(campaignData.platform_data));
          }
          
          console.log('Sending create with image:', Object.fromEntries(formPayload.entries()));
          response = await adCampaignAPI.createCampaignWithImage(formPayload);
        } else {
          // Without image
          console.log('Sending create without image:', campaignData);
          response = await adCampaignAPI.createCampaign(campaignData);
        }
        
        console.log('Campaign created:', response.data);
      }
      
      // Redirect to campaign detail page
      navigate(isEditing ? `/campaigns/${id}` : '/');
    } catch (err) {
      console.error(isEditing ? 'Error updating campaign:' : 'Error creating campaign:', err);
      
      // Extract detailed error message if available
      let errorMessage = isEditing 
        ? 'Failed to update ad campaign. Please try again.'
        : 'Failed to create ad campaign. Please try again.';
      
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            // Handle validation errors array
            errorMessage = err.response.data.detail.map(error => 
              `${error.loc.join('.')} - ${error.msg}`
            ).join(', ');
          } else {
            // Handle string error
            errorMessage = err.response.data.detail;
          }
        } else if (err.response.status === 422) {
          errorMessage = 'Validation error: Please check all required fields and formats.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render platform-specific form based on selected platform
  const renderPlatformForm = () => {
    switch (formData.platform) {
      case 'Google':
        return (
          <GoogleForm 
            data={formData.google} 
            onChange={(data) => handlePlatformDataChange('google', data)}
            errors={fieldErrors}
          />
        );
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Please select a platform to see platform-specific options
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditing ? 'Edit Ad Campaign' : 'Create New Ad Campaign'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Campaign Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Campaign Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={loading}
                error={!!fieldErrors.title}
                helperText={fieldErrors.title}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Campaign Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                helperText={fieldErrors.description || "Describe your campaign goals and target audience"}
                error={!!fieldErrors.description}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!fieldErrors.platform}>
                <InputLabel>Platform</InputLabel>
                <Select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  label="Platform"
                  disabled={loading}
                >
                  {platforms.map((platform) => (
                    <MenuItem key={platform} value={platform}>
                      {platform}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.platform && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, ml: 2 }}>
                    {fieldErrors.platform}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                disabled={loading}
                helperText="e.g. $500"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Budget Type</InputLabel>
                <Select
                  name="budget_type"
                  value={formData.budget_type}
                  onChange={handleChange}
                  label="Budget Type"
                  disabled={loading}
                >
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Lifetime">Lifetime</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={(date) => handleDateChange('start_date', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      disabled: loading,
                      error: !!fieldErrors.start_date,
                      helperText: fieldErrors.start_date || 'Select campaign start date',
                      InputProps: {
                        readOnly: true,
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={(date) => handleDateChange('end_date', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      disabled: loading,
                      error: !!fieldErrors.end_date,
                      helperText: fieldErrors.end_date || 'Select campaign end date',
                      InputProps: {
                        readOnly: true,
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                startIcon={formData.image ? <CheckCircleOutlineIcon /> : <CloudUploadIcon />}
                color={fieldErrors.image ? "error" : formData.image ? "success" : "primary"}
                disabled={loading}
              >
                {formData.image ? 'Image Selected' : 'Upload Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {formData.image && (
                <Typography variant="caption" sx={{ ml: 2 }}>
                  {formData.image.name}
                </Typography>
              )}
              {fieldErrors.image && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {fieldErrors.image}
                </Typography>
              )}
            </Grid>

            {/* Platform-specific form sections */}
            {formData.platform && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {formData.platform} Specific Settings
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  {renderPlatformForm()}
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Campaign' : 'Create Campaign'
                )}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={() => navigate(isEditing ? `/campaigns/${id}` : '/')}
                disabled={loading}
                sx={{ mt: 2, ml: 2 }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdCampaignForm; 