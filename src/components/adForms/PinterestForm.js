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

const PinterestForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Traffic',
    'Conversions',
    'Awareness',
    'Catalog Sales',
    'Video Views',
  ];

  const biddingOptions = [
    'Automatic',
    'Manual',
    'CPC (Cost Per Click)',
    'CPM (Cost Per Mille)',
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Pinterest ads perform best with vertical images (2:3 aspect ratio, 1000 x 1500px recommended)
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

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Targeting Interests"
          name="targeting_interests"
          value={data.targeting_interests || ''}
          onChange={handleChange}
          helperText="Enter interests to target, separated by commas (e.g., home decor, fashion, cooking)"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Targeting Keywords"
          name="targeting_keywords"
          value={data.targeting_keywords || ''}
          onChange={handleChange}
          helperText="Enter keywords to target, separated by commas"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Pin Creative
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Pin Title"
          name="title"
          value={data.title || ''}
          onChange={handleChange}
          error={!!errors['pinterest.title']}
          helperText={errors['pinterest.title'] || 'Title for your promoted pin (100 characters max)'}
          inputProps={{ maxLength: 100 }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Destination URL"
          name="destination_url"
          value={data.destination_url || ''}
          onChange={handleChange}
          error={!!errors['pinterest.destination_url']}
          helperText={errors['pinterest.destination_url'] || 'Where users will go when they click your pin'}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Description"
          name="description"
          value={data.description || ''}
          onChange={handleChange}
          multiline
          rows={3}
          error={!!errors['pinterest.description']}
          helperText={errors['pinterest.description'] || 'Description for your pin (500 characters max)'}
          inputProps={{ maxLength: 500 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Pinterest ads require high-quality vertical images. Please upload your image using the image upload section above.
          For best results, use a 2:3 aspect ratio (1000 x 1500px recommended).
        </Typography>
      </Grid>
    </Grid>
  );
};

export default PinterestForm; 