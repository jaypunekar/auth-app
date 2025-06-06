import React from 'react';
import { Container, Box, Typography, Grid, Paper } from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import ContactForm from '../components/ContactForm';

const ContactPage = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Get in Touch
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ maxWidth: 700, mx: 'auto' }}>
          Need help with your ad campaigns or have questions about our services? 
          Our team is here to help!
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={{ height: '100%' }}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Contact Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Feel free to reach out to us through any of these channels.
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle1">Email</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <a href="mailto:contact@adtask.ai" style={{ color: 'inherit', textDecoration: 'none' }}>
                      contact@adtask.ai
                    </a>
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle1">Phone</Typography>
                  <Typography variant="body2" color="text.secondary">
                    +1 (555) 123-4567
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle1">Address</Typography>
                  <Typography variant="body2" color="text.secondary">
                    123 Ad Campaign Street<br />
                    Marketing City, CA 94103<br />
                    United States
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <ContactForm />
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContactPage; 