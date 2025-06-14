import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import axios from 'axios';

const ClientManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
    customer_ids: []
  });
  const [resetEmail, setResetEmail] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchGoogleAdsAccounts();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    setError('');
    try {
      // This endpoint would need to be created in the backend
      const response = await axios.get('/api/client-auth/clients');
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleAdsAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await axios.get('/api/google-ads/account-status');
      if (response.data.success && response.data.data) {
        setGoogleAdsAccounts([{
          customer_id: response.data.data.customer_id,
          name: `Account ${response.data.data.customer_id}`
        }]);
      }
    } catch (err) {
      console.error('Error fetching Google Ads accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        email: client.email,
        password: '', // Don't set password when editing
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        company_name: client.company_name || '',
        customer_ids: client.customer_ids || []
      });
    } else {
      setSelectedClient(null);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        company_name: '',
        customer_ids: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleOpenResetDialog = (client) => {
    setSelectedClient(client);
    setResetEmail(client.email);
    setResetPasswordDialog(true);
  };

  const handleCloseResetDialog = () => {
    setResetPasswordDialog(false);
    setSelectedClient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerIdsChange = (e) => {
    setFormData(prev => ({
      ...prev,
      customer_ids: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedClient) {
        // Update existing client
        await axios.put(`/api/client-auth/clients/${selectedClient.id}`, formData);
        setSnackbar({
          open: true,
          message: 'Client updated successfully',
          severity: 'success'
        });
      } else {
        // Create new client
        await axios.post('/api/client-auth/register', formData);
        setSnackbar({
          open: true,
          message: 'Client created successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchClients();
    } catch (err) {
      console.error('Error saving client:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to save client',
        severity: 'error'
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      await axios.post('/api/client-auth/reset-password', { email: resetEmail });
      handleCloseResetDialog();
      setSnackbar({
        open: true,
        message: 'Password reset email sent successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error resetting password:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to reset password',
        severity: 'error'
      });
    }
  };

  const handleSendAnalytics = async (client) => {
    try {
      // This would call the endpoint to send analytics to the client
      await axios.post('/api/google-ads/share-analytics-email', { email: client.email });
      setSnackbar({
        open: true,
        message: 'Analytics sent successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error sending analytics:', err);
      setSnackbar({
        open: true,
        message: 'Failed to send analytics',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Client Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchClients}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Client
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No clients found. Add a client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      {client.first_name} {client.last_name}
                    </TableCell>
                    <TableCell>{client.company_name || '-'}</TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Client">
                        <IconButton onClick={() => handleOpenDialog(client)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton onClick={() => handleOpenResetDialog(client)}>
                          <KeyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Analytics">
                        <IconButton onClick={() => handleSendAnalytics(client)}>
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Client Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            {!selectedClient && (
              <Grid item xs={12} md={6}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!selectedClient}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                name="first_name"
                label="First Name"
                fullWidth
                value={formData.first_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="last_name"
                label="Last Name"
                fullWidth
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="company_name"
                label="Company Name"
                fullWidth
                value={formData.company_name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Google Ads Accounts</InputLabel>
                <Select
                  multiple
                  value={formData.customer_ids}
                  onChange={handleCustomerIdsChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {loadingAccounts ? (
                    <MenuItem disabled>
                      <CircularProgress size={24} />
                    </MenuItem>
                  ) : googleAdsAccounts.length === 0 ? (
                    <MenuItem disabled>No accounts available</MenuItem>
                  ) : (
                    googleAdsAccounts.map((account) => (
                      <MenuItem key={account.customer_id} value={account.customer_id}>
                        {account.name} ({account.customer_id})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedClient ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onClose={handleCloseResetDialog}>
        <DialogTitle>Reset Client Password</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to reset the password for {resetEmail}?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A new random password will be generated and sent to the client's email.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientManagementPage; 