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

const LinkedInForm = ({ data, onChange, errors = {} }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const objectives = [
    'Website Visits',
    'Lead Generation',
    'Engagement',
    'Video Views',
    'Brand Awareness',
    'Job Applicants',
  ];

  const placements = [
    'Sponsored Content',
    'Message Ads',
    'Dynamic Ads',
    'Text Ads',
    'Conversation Ads',
  ];

  const callToActions = [
    'Learn More',
    'Sign Up',
    'Subscribe',
    'Register',
    'Apply Now',
    'Download',
    'Request Demo',
    'Contact Us',
    'Get Quote',
    'Join Now',
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1001-5000 employees',
    '5001-10,000 employees',
    '10,001+ employees',
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
            value={data.objective || 'Website Visits'}
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
          <InputLabel>Ad Format</InputLabel>
          <Select
            name="placement"
            value={data.placement || 'Sponsored Content'}
            onChange={handleChange}
            label="Ad Format"
          >
            {placements.map((placement) => (
              <MenuItem key={placement} value={placement}>
                {placement}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            What type of LinkedIn ad do you want to create?
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Audience Targeting
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Job Titles"
          name="targeting_job_titles"
          value={data.targeting_job_titles || ''}
          onChange={handleChange}
          helperText="Enter job titles to target, separated by commas (e.g., Marketing Manager, CEO)"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Industries"
          name="targeting_industries"
          value={data.targeting_industries || ''}
          onChange={handleChange}
          helperText="Enter industries to target, separated by commas (e.g., Technology, Finance)"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Company Size</InputLabel>
          <Select
            name="targeting_company_size"
            value={data.targeting_company_size || ''}
            onChange={handleChange}
            label="Company Size"
          >
            <MenuItem value="">All company sizes</MenuItem>
            {companySizes.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Target companies by their size
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
          error={!!errors['linkedin.ad_copy']}
          helperText={errors['linkedin.ad_copy'] || 'The main text of your ad (150 characters recommended for best visibility)'}
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
          LinkedIn ads work best with professional images in 1200 x 627px format. Please upload your creative using the image upload section above.
        </Typography>
      </Grid>
    </Grid>
  );
};

export default LinkedInForm; 