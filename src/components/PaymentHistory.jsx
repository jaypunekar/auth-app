import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalanceWallet as WalletIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const PaymentHistory = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/invoices/payment-history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setPaymentHistory(response.data.data.history || []);
      } else {
        setError('Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError(err.response?.data?.detail || 'Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceNumber) => {
    try {
      setDownloading(prev => ({ ...prev, [invoiceNumber]: true }));
      
      const response = await axios.get(`/api/invoices/download/${invoiceNumber}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [invoiceNumber]: false }));
    }
  };

  const handleViewReceipt = async (paymentId, paymentType) => {
    try {
      let endpoint;
      
      // Determine the correct endpoint based on payment type
      if (paymentType === 'subscription') {
        endpoint = `/api/invoices/subscription-receipt/${paymentId}`;
      } else {
        endpoint = `/api/invoices/receipt/${paymentId}`;
      }
      
      // First try to get the receipt URL from the API
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      // If we got a successful response with a URL, open it
      if (response.data && response.data.success && response.data.data && response.data.data.receipt_url) {
        window.open(response.data.data.receipt_url, '_blank');
      } else {
        // Fallback to direct URL which will handle redirect
        window.open(endpoint, '_blank');
      }
    } catch (err) {
      console.error('Error viewing receipt:', err);
      // Fallback to direct URL which will handle redirect
      const endpoint = paymentType === 'subscription' 
        ? `/api/invoices/subscription-receipt/${paymentId}`
        : `/api/invoices/receipt/${paymentId}`;
      window.open(endpoint, '_blank');
    }
  };

  const getPaymentTypeIcon = (paymentType) => {
    switch (paymentType) {
      case 'subscription':
        return <CreditCardIcon />;
      case 'credits_purchase':
        return <StarIcon />;
      case 'funds_addition':
      case 'google_ads_funds':
        return <WalletIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getPaymentTypeLabel = (paymentType) => {
    switch (paymentType) {
      case 'subscription':
        return 'Subscription';
      case 'credits_purchase':
        return 'Credits Purchase';
      case 'funds_addition':
      case 'google_ads_funds':
        return 'Funds Addition';
      default:
        return paymentType;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Payment History
      </Typography>
      
      {paymentHistory.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No payment history found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your payment history will appear here once you make your first payment.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(payment.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getPaymentTypeIcon(payment.payment_type)}
                      <Typography variant="body2">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.description}
                    </Typography>
                    {payment.invoice_number && (
                      <Typography variant="caption" color="text.secondary">
                        Invoice: {payment.invoice_number}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${payment.amount?.toFixed(2) || '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {payment.has_pdf && (
                        <Tooltip title="Download Invoice">
                          <IconButton
                            onClick={() => handleDownloadInvoice(payment.invoice_number)}
                            disabled={downloading[payment.invoice_number]}
                            color="primary"
                            size="small"
                          >
                            {downloading[payment.invoice_number] ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DownloadIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                      {payment.has_receipt && (
                        <Tooltip title="View Stripe Receipt">
                          <IconButton
                            onClick={() => handleViewReceipt(payment.stripe_payment_id, payment.payment_type)}
                            color="secondary"
                            size="small"
                          >
                            <OpenInNewIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Summary Card */}
      {paymentHistory.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Payments
                </Typography>
                <Typography variant="h4" color="primary">
                  {paymentHistory.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${paymentHistory.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Invoices
                </Typography>
                <Typography variant="h4" color="info.main">
                  {paymentHistory.filter(p => p.has_pdf).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PaymentHistory; 