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
} from '@mui/material';

const RedditForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Brand Awareness',
    'Website Traffic',
    'Conversions',
    'App Installs',
    'Video Views',
  ];

  const biddingOptions = [
    'Automatic',
    'Manual',
    'CPC (Cost Per Click)',
    'CPM (Cost Per Mille)',
    'CPV (Cost Per View)',
  ];

  return (
    <Grid container spacing={3}>
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
            value={data.objective || 'Brand Awareness'}
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
          <InputLabel>Bidding</InputLabel>
          <Select
            name="bidding"
            value={data.bidding || 'Automatic'}
            onChange={handleChange}
            label="Bidding"
          >
            {biddingOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            How do you want to manage your bids?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Targeting Subreddits"
          name="targeting_subreddits"
          value={data.targeting_subreddits || ''}
          onChange={handleChange}
          multiline
          rows={2}
          helperText="Enter subreddits to target, separated by commas (e.g., r/marketing, r/smallbusiness)"
        />
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
          error={!!errors['reddit.ad_copy']}
          helperText={errors['reddit.ad_copy'] || 'The main text of your ad (300 characters max)'}
          inputProps={{ maxLength: 300 }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Destination URL"
          name="destination_url"
          value={data.destination_url || ''}
          onChange={handleChange}
          error={!!errors['reddit.destination_url']}
          helperText={errors['reddit.destination_url'] || 'Where users will go when they click your ad'}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Reddit ads work best with images in 1200 x 628px format (1.91:1 aspect ratio). Please upload your creative using the image upload section above.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default RedditForm; 