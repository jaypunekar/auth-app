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

const SnapchatForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Awareness',
    'Consideration',
    'Conversion',
    'App Installs',
    'Catalog Sales',
  ];

  const placements = [
    'Stories',
    'Discover',
    'Camera',
    'Lenses',
    'Commercials',
    'Spotlight',
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
          Snapchat ads perform best with vertical content (9:16 aspect ratio)
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
            value={data.objective || 'Awareness'}
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
          <InputLabel>Placement</InputLabel>
          <Select
            name="placement"
            value={data.placement || 'Stories'}
            onChange={handleChange}
            label="Placement"
          >
            {placements.map((placement) => (
              <MenuItem key={placement} value={placement}>
                {placement}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Where do you want your ads to appear?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Ad Creative
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Headline"
          name="headline"
          value={data.headline || ''}
          onChange={handleChange}
          error={!!errors['snapchat.headline']}
          helperText={errors['snapchat.headline'] || 'A short, attention-grabbing headline (34 characters max)'}
          inputProps={{ maxLength: 34 }}
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
          Snapchat ads require vertical images or videos (9:16 aspect ratio). Please upload your creative using the image upload section above.
          For videos, keep them between 3-10 seconds for best performance.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default SnapchatForm; 