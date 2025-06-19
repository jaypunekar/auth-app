import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  TextField
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ApprovedIcon,
  Cancel as DisapprovedIcon,
  Pending as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SharedCampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [aiImproving, setAiImproving] = useState(false);
  const [aiImprovedData, setAiImprovedData] = useState(null);
  const [aiImprovementDialogOpen, setAiImprovementDialogOpen] = useState(false);

  useEffect(() => {
    fetchSharedCampaigns();
  }, []);

  const fetchSharedCampaigns = async () => {
    try {
      setLoading(true);
      
      // Get the authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/campaign-share/my-shared-campaigns`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCampaigns(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching shared campaigns:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to load shared campaigns. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (campaign) => {
    setSelectedCampaign(campaign);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedCampaign(null);
  };

  const handleCopyLink = (shareUrl) => {
    navigator.clipboard.writeText(shareUrl);
    setSnackbarMessage('Share link copied to clipboard!');
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleLaunchAd = async (campaign) => {
    try {
      // Set launching state
      setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, launching: true } : c));
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/campaign-share/launch/${campaign.share_id}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setSnackbarMessage('Ad launched successfully!');
      setSnackbarOpen(true);
      // Update campaign as launched
      setCampaigns((prev) => prev.map((c) =>
        c.id === campaign.id ? { ...c, launched: true, launching: false, google_ads_campaign_id: response.data.google_ads_campaign_id } : c
      ));
    } catch (err) {
      setSnackbarMessage(err.response?.data?.detail || 'Failed to launch ad.');
      setSnackbarOpen(true);
      setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, launching: false } : c));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'disapproved':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon />;
      case 'disapproved':
        return <DisapprovedIcon />;
      case 'pending':
        return <PendingIcon />;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenEditDialog = (campaign) => {
    setEditCampaign(campaign);
    setEditForm({ ...campaign });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditCampaign(null);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditResend = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/campaign-share/${editCampaign.share_id}/edit`,
        { campaign_data: editForm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage('Campaign updated and approval email resent.');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      // Refresh campaigns
      fetchSharedCampaigns();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.detail || 'Failed to update and resend campaign.');
      setSnackbarOpen(true);
    }
  };

  const handleAIImprove = async (campaign) => {
    try {
      setAiImproving(true);
      setEditCampaign(campaign);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/campaign-share/${campaign.share_id}/ai-improve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiImprovedData(response.data);
      setAiImprovementDialogOpen(true);
      setAiImproving(false);
    } catch (err) {
      setSnackbarMessage(err.response?.data?.detail || 'Failed to AI improve campaign.');
      setSnackbarOpen(true);
      setAiImproving(false);
    }
  };

  const handleApplyAiImprovements = async () => {
    if (!editCampaign || !aiImprovedData) {
      setSnackbarMessage('Campaign data not found. Please try again.');
      setSnackbarOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/api/campaign-share/${editCampaign.share_id}/edit`,
        { campaign_data: aiImprovedData.improved_data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbarMessage('AI improvements applied successfully.');
      setSnackbarOpen(true);
      setAiImprovementDialogOpen(false);
      setEditCampaign(null);
      setAiImprovedData(null);
      fetchSharedCampaigns();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.detail || 'Failed to apply AI improvements.');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Shared Campaigns
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {campaigns.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No shared campaigns yet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            When you share campaigns with clients, they will appear here with approval status.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} key={campaign.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {campaign.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {campaign.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`Platform: ${campaign.platform}`} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`Budget: $${campaign.budget}`} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`Shared: ${formatDate(campaign.created_at)}`} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`Email: ${campaign.email}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Tooltip title="Copy share link">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCopyLink(campaign.share_url)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(campaign)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {/* Launch Ad Button */}
                      {campaign.approval_status === 'approved' && !campaign.launched && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => handleLaunchAd(campaign)}
                          disabled={campaign.launching}
                          sx={{ ml: 1 }}
                        >
                          {campaign.launching ? 'Launching...' : 'Launch Ad'}
                        </Button>
                      )}
                      {campaign.launched && (
                        <Chip label="Launched" color="success" size="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </Box>

                  {/* Approval Summary */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<ApprovedIcon />}
                      label={`${campaign.approved_count} Approved`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<DisapprovedIcon />}
                      label={`${campaign.disapproved_count} Disapproved`}
                      color="error"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<PendingIcon />}
                      label={`${campaign.pending_count} Pending`}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>

                  {/* Approvals List */}
                  {campaign.approvals && campaign.approvals.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          View Approval Details ({campaign.total_approvals} total)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Client</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Feedback</TableCell>
                                <TableCell>Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {campaign.approvals.map((approval, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {approval.client_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {approval.client_email}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      icon={getStatusIcon(approval.status)}
                                      label={approval.status}
                                      color={getStatusColor(approval.status)}
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                      {approval.feedback || 'No feedback provided'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {formatDate(approval.approved_at)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {campaign.approval_status === 'disapproved' && (
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button variant="outlined" color="primary" size="small" onClick={() => handleOpenEditDialog(campaign)}>
                        Edit & Resend
                      </Button>
                      <Button variant="contained" color="secondary" size="small" onClick={() => handleAIImprove(campaign)} disabled={aiImproving}>
                        {aiImproving ? 'AI Improving...' : 'AI Review'}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Campaign Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Campaign Details: {selectedCampaign?.title}
        </DialogTitle>
        <DialogContent>
          {selectedCampaign && (
            <Box>
              <Typography variant="h6" gutterBottom>Campaign Information</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Platform</Typography>
                  <Typography variant="body1">{selectedCampaign.platform}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Budget</Typography>
                  <Typography variant="body1">${selectedCampaign.budget}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Start Date</Typography>
                  <Typography variant="body1">{selectedCampaign.start_date}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">End Date</Typography>
                  <Typography variant="body1">{selectedCampaign.end_date}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Website</Typography>
                  <Typography variant="body1">{selectedCampaign.website_url}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Headlines</Typography>
              <List dense>
                {selectedCampaign.headlines && selectedCampaign.headlines.map((headline, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={headline} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>Descriptions</Typography>
              <List dense>
                {selectedCampaign.descriptions && selectedCampaign.descriptions.map((description, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={description} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>Keywords</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedCampaign.keywords && selectedCampaign.keywords.map((keyword, index) => (
                  <Chip key={index} label={keyword} size="small" variant="outlined" />
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Share Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Share URL</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1, wordBreak: 'break-all' }}>
                      {selectedCampaign.share_url}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopyLink(selectedCampaign.share_url)}
                    >
                      <CopyIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => window.open(selectedCampaign.share_url, '_blank')}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Shared Email</Typography>
                  <Typography variant="body1">{selectedCampaign.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Shared Date</Typography>
                  <Typography variant="body1">{formatDate(selectedCampaign.created_at)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit & Resend Campaign</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Title" value={editForm.title || ''} onChange={e => handleEditFormChange('title', e.target.value)} fullWidth />
              <TextField label="Description" value={editForm.description || ''} onChange={e => handleEditFormChange('description', e.target.value)} fullWidth multiline minRows={2} />
              <TextField label="Budget" value={editForm.budget || ''} onChange={e => handleEditFormChange('budget', e.target.value)} fullWidth type="number" />
              <TextField label="Start Date" value={editForm.start_date || ''} onChange={e => handleEditFormChange('start_date', e.target.value)} fullWidth type="date" InputLabelProps={{ shrink: true }} />
              <TextField label="End Date" value={editForm.end_date || ''} onChange={e => handleEditFormChange('end_date', e.target.value)} fullWidth type="date" InputLabelProps={{ shrink: true }} />
              <TextField label="Headlines (comma separated)" value={editForm.headlines ? editForm.headlines.join(', ') : ''} onChange={e => handleEditFormChange('headlines', e.target.value.split(',').map(s => s.trim()))} fullWidth />
              <TextField label="Descriptions (comma separated)" value={editForm.descriptions ? editForm.descriptions.join(', ') : ''} onChange={e => handleEditFormChange('descriptions', e.target.value.split(',').map(s => s.trim()))} fullWidth />
              <TextField label="Keywords (comma separated)" value={editForm.keywords ? editForm.keywords.join(', ') : ''} onChange={e => handleEditFormChange('keywords', e.target.value.split(',').map(s => s.trim()))} fullWidth />
              <TextField label="Website URL" value={editForm.website_url || ''} onChange={e => handleEditFormChange('website_url', e.target.value)} fullWidth />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditResend} variant="contained" color="primary">Resend for Approval</Button>
        </DialogActions>
      </Dialog>

      {/* AI Improvement Dialog */}
      <Dialog
        open={aiImprovementDialogOpen}
        onClose={() => setAiImprovementDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Changes Based on Client Feedback</DialogTitle>
        <DialogContent>
          {aiImprovedData && (
            <>
              {/* Changes Made Section */}
              <Box sx={{ mb: 3, bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Changes Made Based on Feedback
                </Typography>
                <List>
                  {aiImprovedData.improved_data.changes_made?.map((change, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={change} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Detailed Comparison */}
              <Typography variant="h6" gutterBottom>Detailed Comparison:</Typography>
              
              {/* Headlines */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Headlines:</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Original</TableCell>
                        <TableCell>Modified</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiImprovedData.original_data.headlines.map((headline, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{headline}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {aiImprovedData.improved_data.headlines[idx]}
                              {headline !== aiImprovedData.improved_data.headlines[idx] && (
                                <Tooltip title="Changed based on feedback">
                                  <EditIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Descriptions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Descriptions:</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Original</TableCell>
                        <TableCell>Modified</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiImprovedData.original_data.descriptions.map((desc, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{desc}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {aiImprovedData.improved_data.descriptions[idx]}
                              {desc !== aiImprovedData.improved_data.descriptions[idx] && (
                                <Tooltip title="Changed based on feedback">
                                  <EditIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Keywords */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Keywords:</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Original</TableCell>
                        <TableCell>Modified</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          {aiImprovedData.original_data.keywords.join(', ')}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {aiImprovedData.improved_data.keywords.join(', ')}
                            {JSON.stringify(aiImprovedData.original_data.keywords) !== 
                             JSON.stringify(aiImprovedData.improved_data.keywords) && (
                              <Tooltip title="Changed based on feedback">
                                <EditIcon fontSize="small" color="primary" sx={{ ml: 1 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiImprovementDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyAiImprovements}
            variant="contained"
            color="primary"
          >
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SharedCampaignsPage; 