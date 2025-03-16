import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  FormHelperText,
  Alert,
} from '@mui/material';

const TikTokForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Traffic',
    'App Installs',
    'Conversions',
    'Reach',
    'Video Views',
    'Lead Generation',
    'Catalog Sales',
  ];

  const optimizationGoals = [
    'Clicks',
    'Conversions',
    'App Installs',
    'Reach',
    'Video Views',
    'Engagement',
  ];

  const callToActions = [
    'Learn More',
    'Shop Now',
    'Sign Up',
    'Download',
    'Contact Us',
    'Apply Now',
    'Book Now',
    'Get Offer',
    'Watch More',
    'Install Now',
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          TikTok ads perform best with vertical videos (9:16 aspect ratio)
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          Campaign Settings
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Campaign Objective</InputLabel>
          <Select
            name="objective"
            value={data.objective || 'Traffic'}
            onChange={handleChange}
            label="Campaign Objective"
          >
            {objectives.map((objective) => (
              <MenuItem key={objective} value={objective}>
                {objective}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            What is the primary goal of your campaign?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Optimization Goal</InputLabel>
          <Select
            name="optimization_goal"
            value={data.optimization_goal || 'Clicks'}
            onChange={handleChange}
            label="Optimization Goal"
          >
            {optimizationGoals.map((goal) => (
              <MenuItem key={goal} value={goal}>
                {goal}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            What results do you want to optimize for?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Ad Creative
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Ad Copy"
          name="ad_copy"
          value={data.ad_copy || ''}
          onChange={handleChange}
          multiline
          rows={3}
          error={!!errors['tiktok.ad_copy']}
          helperText={errors['tiktok.ad_copy'] || 'Text that appears with your ad (100 characters recommended)'}
          inputProps={{ maxLength: 100 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Call to Action</InputLabel>
          <Select
            name="call_to_action"
            value={data.call_to_action || 'Learn More'}
            onChange={handleChange}
            label="Call to Action"
          >
            {callToActions.map((cta) => (
              <MenuItem key={cta} value={cta}>
                {cta}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Button text that tells people what action to take
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          TikTok ads require a video file. Please upload a vertical video (9:16 aspect ratio) using the image upload section above.
          For best results, keep videos between 9-15 seconds with engaging content in the first 3 seconds.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default TikTokForm; 