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

const MetaForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Awareness',
    'Traffic',
    'Engagement',
    'App Installs',
    'Video Views',
    'Lead Generation',
    'Conversions',
    'Catalog Sales',
    'Store Traffic',
  ];

  const placements = [
    'Feeds',
    'Stories',
    'Reels',
    'In-Stream',
    'Search',
    'Messages',
    'Apps',
    'Audience Network',
  ];

  const optimizationGoals = [
    'Impressions',
    'Reach',
    'Link Clicks',
    'Landing Page Views',
    'App Installs',
    'Video Views',
    'Lead Generation',
    'Conversions',
  ];

  const adFormats = [
    'Image',
    'Video',
    'Carousel',
    'Collection',
    'Slideshow',
    'Instant Experience',
  ];

  const callToActions = [
    'Learn More',
    'Shop Now',
    'Sign Up',
    'Book Now',
    'Contact Us',
    'Download',
    'Apply Now',
    'Get Offer',
    'Subscribe',
    'Watch More',
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
            value={data.placement || 'Feeds'}
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

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Optimization Goal</InputLabel>
          <Select
            name="optimization_goal"
            value={data.optimization_goal || 'Impressions'}
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

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Ad Format</InputLabel>
          <Select
            name="ad_format"
            value={data.ad_format || 'Image'}
            onChange={handleChange}
            label="Ad Format"
          >
            {adFormats.map((format) => (
              <MenuItem key={format} value={format}>
                {format}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            What type of ad do you want to create?
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
          label="Primary Text"
          name="primary_text"
          value={data.primary_text || ''}
          onChange={handleChange}
          multiline
          rows={3}
          error={!!errors['meta.primary_text']}
          helperText={errors['meta.primary_text'] || 'The main body text of your ad (125 characters recommended)'}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          required
          label="Headline"
          name="headline"
          value={data.headline || ''}
          onChange={handleChange}
          error={!!errors['meta.headline']}
          helperText={errors['meta.headline'] || 'A short, attention-grabbing headline (40 characters recommended)'}
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
    </Grid>
  );
};

export default MetaForm; 