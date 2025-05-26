import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Alert,
  AlertTitle,
  IconButton,
  Grid,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import businessProfileService from '../../services/businessProfileService';
import { useSnackbar } from 'notistack';

const BusinessProfileForm = ({ existingProfile, onProfileUpdated }) => {
  const initialFormState = {
    business_name: '',
    industry: 'Technology',
    products: '',
    services: '',
    website_url: '',
    report_frequency_hours: 24, // Default to daily (24 hours)
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        business_name: existingProfile.business_name || '',
        industry: existingProfile.industry || 'Technology',
        products: existingProfile.products || '',
        services: existingProfile.services || '',
        website_url: existingProfile.website_url || '',
        report_frequency_hours: existingProfile.report_frequency_hours || 24,
      });
    }
  }, [existingProfile]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');

    try {
      let result;
      if (existingProfile) {
        // Update existing profile
        result = await businessProfileService.updateProfile(formData);
        setSuccessMessage('Business profile updated successfully!');
      } else {
        // Create new profile
        result = await businessProfileService.createProfile(formData);
        setSuccessMessage('Business profile created successfully!');
      }

      // Call the callback function with the updated profile
      if (onProfileUpdated) {
        onProfileUpdated(result);
      }

      enqueueSnackbar(
        existingProfile 
          ? 'Your business profile has been updated successfully!' 
          : 'Your business profile has been created successfully!',
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error saving business profile:', error);
      enqueueSnackbar(
        error.response?.data?.detail || 'Failed to save business profile',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingProfile) return;

    const confirmed = window.confirm('Are you sure you want to delete your business profile? This action cannot be undone.');
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await businessProfileService.deleteProfile();
      
      // Call the callback function with null to indicate deletion
      if (onProfileUpdated) {
        onProfileUpdated(null);
      }

      // Reset the form
      setFormData(initialFormState);
      
      enqueueSnackbar('Your business profile has been deleted successfully!', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting business profile:', error);
      enqueueSnackbar(
        error.response?.data?.detail || 'Failed to delete business profile',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', px: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {existingProfile ? 'Edit Business Profile' : 'Create Business Profile'}
      </Typography>

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setSuccessMessage('')}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Success</AlertTitle>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Business Name"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Enter your business name"
              required
              error={!!errors.business_name}
              helperText={errors.business_name}
              fullWidth
            />

            <TextField
              select
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Technology">Technology</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Retail">Retail</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Manufacturing">Manufacturing</MenuItem>
              <MenuItem value="Real Estate">Real Estate</MenuItem>
              <MenuItem value="Food & Beverage">Food & Beverage</MenuItem>
              <MenuItem value="Automotive">Automotive</MenuItem>
              <MenuItem value="Entertainment">Entertainment</MenuItem>
              <MenuItem value="Consulting">Consulting</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Construction">Construction</MenuItem>
              <MenuItem value="Energy">Energy</MenuItem>
              <MenuItem value="Telecommunications">Telecommunications</MenuItem>
              <MenuItem value="Transportation">Transportation</MenuItem>
              <MenuItem value="Agriculture">Agriculture</MenuItem>
              <MenuItem value="Legal">Legal</MenuItem>
              <MenuItem value="Non-Profit">Non-Profit</MenuItem>
              <MenuItem value="Government">Government</MenuItem>
              <MenuItem value="Hospitality">Hospitality</MenuItem>
              <MenuItem value="Fitness">Fitness</MenuItem>
              <MenuItem value="Beauty">Beauty</MenuItem>
              <MenuItem value="Travel">Travel</MenuItem>
              <MenuItem value="Insurance">Insurance</MenuItem>
              <MenuItem value="Publishing">Publishing</MenuItem>
              <MenuItem value="Pharmaceuticals">Pharmaceuticals</MenuItem>
              <MenuItem value="Textiles">Textiles</MenuItem>
              <MenuItem value="Sports">Sports</MenuItem>
              <MenuItem value="Art & Design">Art & Design</MenuItem>
              <MenuItem value="Media">Media</MenuItem>
              <MenuItem value="Logistics">Logistics</MenuItem>
              <MenuItem value="Security">Security</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Software">Software</MenuItem>
              <MenuItem value="E-commerce">E-commerce</MenuItem>
              <MenuItem value="Gaming">Gaming</MenuItem>
              <MenuItem value="Aerospace">Aerospace</MenuItem>
              <MenuItem value="Mining">Mining</MenuItem>
              <MenuItem value="Fashion">Fashion</MenuItem>
              <MenuItem value="Music">Music</MenuItem>
              <MenuItem value="Photography">Photography</MenuItem>
              <MenuItem value="Cleaning Services">Cleaning Services</MenuItem>
              <MenuItem value="Pet Services">Pet Services</MenuItem>
              <MenuItem value="Home Services">Home Services</MenuItem>
              <MenuItem value="Personal Services">Personal Services</MenuItem>
              <MenuItem value="Professional Services">Professional Services</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              label="Website URL (Optional)"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://www.yourbusiness.com"
              fullWidth
            />

            <TextField
              label="Products (Optional)"
              name="products"
              value={formData.products}
              onChange={handleChange}
              placeholder="Enter the products your business offers"
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Services (Optional)"
              name="services"
              value={formData.services}
              onChange={handleChange}
              placeholder="Enter the services your business offers"
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Ad Performance Report Frequency (Hours)"
              name="report_frequency_hours"
              type="number"
              value={formData.report_frequency_hours}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
              helperText="How often would you like to receive ad performance reports (in hours)"
              fullWidth
            />

            <Grid container spacing={2} justifyContent="space-between">
              <Grid item>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (existingProfile ? "Updating..." : "Creating...") 
                    : (existingProfile ? "Update Profile" : "Create Profile")
                  }
                </Button>
              </Grid>

              {existingProfile && (
                <Grid item>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? "Deleting..." : "Delete Profile"}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default BusinessProfileForm; 