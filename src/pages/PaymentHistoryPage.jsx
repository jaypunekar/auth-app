import React from 'react';
import { Container, Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PaymentHistory from '../components/PaymentHistory';

const PaymentHistoryPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component={RouterLink} to="/dashboard" color="inherit">
            Dashboard
          </Link>
          <Typography color="text.primary">Payment History</Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Payment History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and download your payment invoices and receipts
        </Typography>
      </Box>

      {/* Payment History Component */}
      <PaymentHistory />
    </Container>
  );
};

export default PaymentHistoryPage; 