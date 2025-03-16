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
  Divider,
} from '@mui/material';

const GoogleForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleHeadlineChange = (index, value) => {
    const newHeadlines = [...data.headlines];
    newHeadlines[index] = value;
    onChange({ headlines: newHeadlines });
  };

  const handleDescriptionChange = (index, value) => {
    const newDescriptions = [...data.descriptions];
    newDescriptions[index] = value;
    onChange({ descriptions: newDescriptions });
  };

  const objectives = [
    'Search',
    'Display',
    'Video',
    'Shopping',
    'App',
    'Smart',
    'Local',
    'Discovery',
  ];

  const biddingStrategies = [
    'Manual CPC',
    'Target CPA',
    'Target ROAS',
    'Maximize Conversions',
    'Maximize Conversion Value',
    'Target Impression Share',
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
            value={data.objective || 'Search'}
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
            What type of Google campaign do you want to create?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Bidding Strategy</InputLabel>
          <Select
            name="bidding_strategy"
            value={data.bidding_strategy || 'Manual CPC'}
            onChange={handleChange}
            label="Bidding Strategy"
          >
            {biddingStrategies.map((strategy) => (
              <MenuItem key={strategy} value={strategy}>
                {strategy}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            How do you want Google to manage your bids?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Keywords"
          name="keywords"
          value={data.keywords || ''}
          onChange={handleChange}
          multiline
          rows={3}
          helperText="Enter keywords separated by commas (for Search campaigns)"
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          Ad Creative
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Headlines (up to 30 characters each)
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          required
          label="Headline 1"
          value={data.headlines[0] || ''}
          onChange={(e) => handleHeadlineChange(0, e.target.value)}
          error={!!errors['google.headlines.0']}
          helperText={errors['google.headlines.0'] || ''}
          inputProps={{ maxLength: 30 }}
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Headline 2"
          value={data.headlines[1] || ''}
          onChange={(e) => handleHeadlineChange(1, e.target.value)}
          inputProps={{ maxLength: 30 }}
          helperText="Optional"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Headline 3"
          value={data.headlines[2] || ''}
          onChange={(e) => handleHeadlineChange(2, e.target.value)}
          inputProps={{ maxLength: 30 }}
          helperText="Optional"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Descriptions (up to 90 characters each)
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Description 1"
          value={data.descriptions[0] || ''}
          onChange={(e) => handleDescriptionChange(0, e.target.value)}
          multiline
          rows={2}
          error={!!errors['google.descriptions.0']}
          helperText={errors['google.descriptions.0'] || ''}
          inputProps={{ maxLength: 90 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Description 2"
          value={data.descriptions[1] || ''}
          onChange={(e) => handleDescriptionChange(1, e.target.value)}
          multiline
          rows={2}
          helperText="Optional"
          inputProps={{ maxLength: 90 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Final URL"
          name="final_url"
          value={data.final_url || ''}
          onChange={handleChange}
          error={!!errors['google.final_url']}
          helperText={errors['google.final_url'] || 'The landing page URL (e.g., https://www.example.com)'}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Display Path"
          name="display_path"
          value={data.display_path || ''}
          onChange={handleChange}
          helperText="Text shown in the URL (e.g., example.com/shoes)"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Ad Extensions"
          name="ad_extensions"
          value={data.ad_extensions || ''}
          onChange={handleChange}
          multiline
          rows={2}
          helperText="Additional information like phone numbers, location, etc."
        />
      </Grid>
    </Grid>
  );
};

export default GoogleForm; 