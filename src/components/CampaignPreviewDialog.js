import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { 
  Close as CloseIcon, 
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Pinterest as PinterestIcon,
  Reddit as RedditIcon,
} from '@mui/icons-material';
import { adCampaignAPI } from '../services/api';
import googleAdsApi from '../services/googleAdsApi';

// Platform-specific icons
const PlatformIcon = ({ platform }) => {
  switch (platform) {
    case 'Google':
      return <GoogleIcon />;
    case 'Meta':
      return <FacebookIcon />;
    case 'LinkedIn':
      return <LinkedInIcon />;
    case 'Reddit':
      return <RedditIcon />;
    default:
      return null;
  }
};

const CampaignPreviewDialog = ({ open, onClose, campaignData, onSuccess }) => {
  const [formData, setFormData] = useState(campaignData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newHeadline, setNewHeadline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [platformSpecific, setPlatformSpecific] = useState({});

  // Update formData when campaignData changes
  useEffect(() => {
    if (campaignData) {
      setFormData(campaignData);
      // Initialize platform-specific data
      setPlatformSpecific(campaignData.platform_specific || {});
    }
  }, [campaignData]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData({
      ...formData,
      [name]: date,
    });
  };

  // Handle target audience changes
  const handleTargetAudienceChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      target_audience: {
        ...formData.target_audience,
        [name]: value,
      },
    });
  };

  // Handle platform-specific changes
  const handlePlatformSpecificChange = (e) => {
    const { name, value } = e.target;
    setPlatformSpecific({
      ...platformSpecific,
      [name]: value,
    });
  };

  // Add a keyword
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const updatedKeywords = [...(formData.keywords || []), newKeyword.trim()];
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

  // Add a headline
  const handleAddHeadline = () => {
    if (!newHeadline.trim()) return;
    
    const updatedHeadlines = [...(formData.headlines || []), newHeadline.trim()];
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
    
    const updatedDescriptions = [...(formData.descriptions || []), newDescription.trim()];
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

  // Handle dialog close with proper cancellation
  const handleClose = () => {
    // Just close the dialog without creating a campaign
    onClose(false); // Pass false to indicate cancellation
  };

  // Create the campaign
  const handleCreateCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the data for API
      const apiData = {
        ...formData,
        platform_data: {
          keywords: formData.keywords || [],
          headlines: formData.headlines || [],
          descriptions: formData.descriptions || [],
        },
        platform_specific: platformSpecific,
      };
      
      // Format dates properly for the backend
      if (apiData.start_date instanceof Date) {
        apiData.start_date = apiData.start_date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      
      if (apiData.end_date instanceof Date) {
        apiData.end_date = apiData.end_date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      
      // Ensure target_audience is properly formatted
      if (apiData.target_audience) {
        // Convert numeric strings to numbers
        if (apiData.target_audience.age_min) {
          apiData.target_audience.age_min = Number(apiData.target_audience.age_min);
        }
        if (apiData.target_audience.age_max) {
          apiData.target_audience.age_max = Number(apiData.target_audience.age_max);
        }
      }
      
      // Ensure budget is a number
      if (apiData.budget) {
        apiData.budget = Number(apiData.budget);
      }
      
      // Remove the fields that are now in platform_data
      delete apiData.keywords;
      delete apiData.headlines;
      delete apiData.descriptions;
      
      console.log('Sending campaign data to API:', apiData);
      
      let response;
      
      // If this is a Google Ads campaign, use the Google Ads API
      if (apiData.platform === 'Google') {
        // First check if the user has a Google Ads account linked
        try {
          const accountStatus = await googleAdsApi.getAccountStatus();
          console.log('Google Ads account status:', accountStatus);
          
          if (!accountStatus.data?.is_linked) {
            // User doesn't have a Google Ads account linked, ask if they want to create one
            const confirmLink = window.confirm(
              'You need to link a Google Ads account before creating a campaign. Would you like to link one now?'
            );
            
            if (confirmLink) {
              // Link a new Google Ads account
              const linkResponse = await googleAdsApi.linkAccount({ generate_new_account: true });
              console.log('Google Ads account linked:', linkResponse);
              
              if (!linkResponse.success) {
                throw new Error('Failed to link Google Ads account: ' + linkResponse.message);
              }
            } else {
              // User declined to link an account, create a local campaign only
              response = await adCampaignAPI.createCampaign(apiData);
              console.log('Created local campaign only:', response);
              
              if (onSuccess) {
                onSuccess(response.data);
              }
              
              onClose(true);
              return;
            }
          }
        } catch (accountError) {
          console.error('Error checking Google Ads account status:', accountError);
          // Continue with local campaign creation
          response = await adCampaignAPI.createCampaign(apiData);
          
          if (onSuccess) {
            onSuccess(response.data);
          }
          
          onClose(true);
          return;
        }
        
        // Prepare Google Ads specific data
        const googleAdsData = {
          campaign_name: apiData.title,
          daily_budget: apiData.budget,
          start_date: apiData.start_date,
          end_date: apiData.end_date,
          headlines: apiData.platform_data.headlines,
          descriptions: apiData.platform_data.descriptions,
          keywords: apiData.platform_data.keywords,
          website_url: apiData.platform_specific?.website_url || 'http://www.example.com'
        };
        
        console.log('Sending Google Ads campaign data:', googleAdsData);
        
        // Create the Google Ads campaign
        try {
          const googleAdsResponse = await googleAdsApi.createCampaign(googleAdsData);
          console.log('Google Ads campaign created:', googleAdsResponse);
          
          if (!googleAdsResponse.success) {
            throw new Error('Failed to create Google Ads campaign: ' + googleAdsResponse.message);
          }
          
          // Also create a local campaign record
          response = await adCampaignAPI.createCampaign({
            ...apiData,
            google_ads_campaign_id: googleAdsResponse.data?.campaign_id,
            google_ads_ad_group_id: googleAdsResponse.data?.ad_group_id,
            google_ads_ad_id: googleAdsResponse.data?.ad_id
          });
          
          // Show success message
          alert('Campaign successfully created in Google Ads! You can now see it in your Google Ads account.');
        } catch (googleError) {
          console.error('Error creating Google Ads campaign:', googleError);
          
          // Show error message but continue with local campaign creation
          const continueWithLocal = window.confirm(
            `Failed to create campaign in Google Ads: ${googleError.message || 'Unknown error'}. Would you like to create a local campaign only?`
          );
          
          if (continueWithLocal) {
            // If Google Ads creation fails, still try to create a local campaign
            response = await adCampaignAPI.createCampaign(apiData);
          } else {
            throw new Error('Campaign creation cancelled by user');
          }
        }
      } else {
        // Create a regular campaign for other platforms
        response = await adCampaignAPI.createCampaign(apiData);
      }
      
      // Call the success callback
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close the dialog with success
      onClose(true); // Pass true to indicate successful creation
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(`Failed to create campaign: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press in text fields
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  // Render platform-specific fields
  const renderPlatformSpecificFields = () => {
    const platform = formData.platform;
    
    if (!platform) return null;
    
    switch (platform) {
      case 'Google':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website URL"
                name="website_url"
                value={platformSpecific.website_url || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="https://www.example.com"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Unique Selling Proposition"
                name="usp"
                value={platformSpecific.usp || ''}
                onChange={handlePlatformSpecificChange}
                multiline
                rows={2}
                placeholder="What makes your business unique?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Call to Action"
                name="cta"
                value={platformSpecific.cta || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Shop Now, Learn More, Sign Up"
              />
            </Grid>
          </>
        );
        
      case 'Meta':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Business Page URL"
                name="page_url"
                value={platformSpecific.page_url || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="https://www.facebook.com/yourbusiness"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Brand Voice"
                name="brand_voice"
                value={platformSpecific.brand_voice || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Casual, Professional, Humorous"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Offer"
                name="special_offer"
                value={platformSpecific.special_offer || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., 20% off first purchase, Free consultation"
              />
            </Grid>
          </>
        );
        
      case 'LinkedIn':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Page URL"
                name="company_url"
                value={platformSpecific.company_url || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="https://www.linkedin.com/company/yourcompany"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Industry Value Proposition"
                name="value_prop"
                value={platformSpecific.value_prop || ''}
                onChange={handlePlatformSpecificChange}
                multiline
                rows={2}
                placeholder="How does your product/service benefit professionals in your industry?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Target Job Titles"
                name="job_titles"
                value={platformSpecific.job_titles || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Marketing Manager, CTO, HR Director"
              />
            </Grid>
          </>
        );
        
      case 'TikTok':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Brand Personality"
                name="brand_personality"
                value={platformSpecific.brand_personality || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Energetic, Educational, Entertaining"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Creative Hook"
                name="creative_hook"
                value={platformSpecific.creative_hook || ''}
                onChange={handlePlatformSpecificChange}
                multiline
                rows={2}
                placeholder="What will grab viewers' attention in the first 3 seconds?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Music Preferences"
                name="music"
                value={platformSpecific.music || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Trending sounds, Specific genre, Original audio"
              />
            </Grid>
          </>
        );
        
      case 'Pinterest':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Visual Style"
                name="visual_style"
                value={platformSpecific.visual_style || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Minimalist, Colorful, Rustic"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Seasonal Relevance"
                name="seasonal"
                value={platformSpecific.seasonal || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Summer collection, Holiday special, Year-round"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Related Categories"
                name="categories"
                value={platformSpecific.categories || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Home Decor, Fashion, Recipes"
              />
            </Grid>
          </>
        );
        
      case 'Snapchat':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Geographic Focus"
                name="geo_focus"
                value={platformSpecific.geo_focus || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., City names, Neighborhoods, Radius around locations"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Visual Style"
                name="visual_style"
                value={platformSpecific.visual_style || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Playful filters, Behind-the-scenes, Product demos"
              />
            </Grid>
          </>
        );
        
      case 'Reddit':
        return (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Relevant Subreddits"
                name="subreddits"
                value={platformSpecific.subreddits || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., r/fitness, r/homeimprovement, r/technology"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Community Pain Points"
                name="pain_points"
                value={platformSpecific.pain_points || ''}
                onChange={handlePlatformSpecificChange}
                multiline
                rows={2}
                placeholder="What problems does your product/service solve for this community?"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content Angle"
                name="content_angle"
                value={platformSpecific.content_angle || ''}
                onChange={handlePlatformSpecificChange}
                placeholder="e.g., Educational, Problem-solving, Insider tips"
              />
            </Grid>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <PlatformIcon platform={formData.platform} />
            <Typography variant="h6" sx={{ ml: 1 }}>
              Review Campaign Details
            </Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Campaign Title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                name="platform"
                value={formData.platform || 'Google'}
                onChange={handleChange}
                label="Platform"
              >
                <MenuItem value="Google">Google Ads</MenuItem>
                <MenuItem value="Meta">Meta (Facebook/Instagram)</MenuItem>
                <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                <MenuItem value="TikTok">TikTok</MenuItem>
                <MenuItem value="Pinterest">Pinterest</MenuItem>
                <MenuItem value="Snapchat">Snapchat</MenuItem>
                <MenuItem value="Reddit">Reddit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          
          {/* Budget and Dates */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Budget and Schedule
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Budget"
              name="budget"
              value={formData.budget || ''}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Budget Type</InputLabel>
              <Select
                name="budget_type"
                value={formData.budget_type || 'daily'}
                onChange={handleChange}
                label="Budget Type"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="total">Total</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={formData.start_date || null}
                onChange={(date) => handleDateChange('start_date', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={formData.end_date || null}
                onChange={(date) => handleDateChange('end_date', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Target Audience */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Target Audience
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Age"
              name="age_min"
              value={formData.target_audience?.age_min || ''}
              onChange={handleTargetAudienceChange}
              type="number"
              InputProps={{ inputProps: { min: 13, max: 65 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Age"
              name="age_max"
              value={formData.target_audience?.age_max || ''}
              onChange={handleTargetAudienceChange}
              type="number"
              InputProps={{ inputProps: { min: 13, max: 65 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formData.target_audience?.gender || 'all'}
                onChange={handleTargetAudienceChange}
                label="Gender"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.target_audience?.location || ''}
              onChange={handleTargetAudienceChange}
            />
          </Grid>
          
          {/* Platform-Specific Fields */}
          {formData.platform && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {formData.platform} Specific Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {renderPlatformSpecificFields()}
            </>
          )}
          
          {/* Keywords */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Keywords</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddKeyword)}
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
                  {formData.keywords?.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      onDelete={() => handleRemoveKeyword(index)}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          {/* Headlines */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Headlines</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Headline"
                    value={newHeadline}
                    onChange={(e) => setNewHeadline(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddHeadline)}
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
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {formData.headlines?.map((headline, index) => (
                    <Chip
                      key={index}
                      label={headline}
                      onDelete={() => handleRemoveHeadline(index)}
                      sx={{ maxWidth: '100%' }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          {/* Descriptions */}
          <Grid item xs={12}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Descriptions</Typography>
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
                  {formData.descriptions?.map((description, index) => (
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
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleCreateCampaign}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Campaign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignPreviewDialog; 