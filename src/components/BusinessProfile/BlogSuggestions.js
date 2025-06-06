import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Snackbar,
  Tooltip
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import businessProfileService from '../../services/businessProfileService';

const BlogSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [savedSuggestions, setSavedSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState({ open: false, suggestion: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load saved suggestions on component mount
  useEffect(() => {
    loadSavedSuggestions();
  }, []);

  const loadSavedSuggestions = async () => {
    try {
      const saved = await businessProfileService.getSavedBlogSuggestions();
      setSavedSuggestions(saved);
    } catch (error) {
      console.error('Failed to load saved suggestions:', error);
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const blogSuggestions = await businessProfileService.getBlogSuggestions();
      
      // Convert string array to objects with metadata and check if already saved
      const formattedSuggestions = blogSuggestions.map(suggestion => ({
        title: suggestion,
        isSaving: false,
        isSaved: savedSuggestions.some(saved => saved.title.toLowerCase() === suggestion.toLowerCase())
      }));
      
      setSuggestions(formattedSuggestions);
      setGenerated(true);
    } catch (error) {
      console.error('Failed to get blog suggestions:', error);
      setError(error.response?.data?.detail || 'Failed to generate blog suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSuggestions = async () => {
    if (suggestions.length === 0) return;
    
    setLoading(true);
    try {
      // Extract titles from suggestion objects
      const suggestionTitles = suggestions.map(suggestion => suggestion.title);
      await businessProfileService.saveBlogSuggestionsBulk(suggestionTitles);
      await loadSavedSuggestions(); // Refresh saved suggestions
      
      // Mark all suggestions as saved
      const updatedSuggestions = suggestions.map(suggestion => ({
        ...suggestion,
        isSaved: true
      }));
      setSuggestions(updatedSuggestions);
      
      setSnackbar({
        open: true,
        message: 'Blog suggestions saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save suggestions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save suggestions. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to save a single blog suggestion
  const saveSingleSuggestion = async (suggestionTitle, index) => {
    // Create a copy of the suggestions array to track which ones are being saved
    const updatedSuggestions = [...suggestions];
    if (!updatedSuggestions[index].isSaving) {
      updatedSuggestions[index] = { 
        ...updatedSuggestions[index], 
        isSaving: true
      };
      setSuggestions(updatedSuggestions);
    }
    
    try {
      await businessProfileService.createBlogSuggestion({
        title: suggestionTitle,
        description: '',
        tags: ''
      });
      await loadSavedSuggestions(); // Refresh saved suggestions
      
      // Mark suggestion as saved
      const finalSuggestions = [...suggestions];
      finalSuggestions[index] = {
        ...finalSuggestions[index],
        isSaving: false,
        isSaved: true
      };
      setSuggestions(finalSuggestions);
      
      setSnackbar({
        open: true,
        message: 'Blog suggestion saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to save suggestion:', error);
      
      // Reset saving state
      const finalSuggestions = [...suggestions];
      finalSuggestions[index] = {
        ...finalSuggestions[index],
        isSaving: false
      };
      setSuggestions(finalSuggestions);
      
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save suggestion. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleEditSuggestion = (suggestion) => {
    setEditDialog({ open: true, suggestion: { ...suggestion } });
  };

  const handleSaveEdit = async () => {
    const { suggestion } = editDialog;
    if (!suggestion) return;

    try {
      await businessProfileService.updateBlogSuggestion(suggestion.id, {
        title: suggestion.title,
        description: suggestion.description,
        tags: suggestion.tags
      });
      await loadSavedSuggestions(); // Refresh saved suggestions
      setEditDialog({ open: false, suggestion: null });
      setSnackbar({
        open: true,
        message: 'Suggestion updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to update suggestion:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update suggestion. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDeleteSuggestion = async (suggestionId) => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;

    try {
      await businessProfileService.deleteBlogSuggestion(suggestionId);
      await loadSavedSuggestions(); // Refresh saved suggestions
      setSnackbar({
        open: true,
        message: 'Suggestion deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to delete suggestion:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete suggestion. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mt: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <LightbulbIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="h6" component="h2">
          AI Blog Suggestions
        </Typography>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Get AI-powered blog topic suggestions based on your business profile. Generate new ideas and save them for later use.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreateIcon fontSize="small" />
              Generate New
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookmarkIcon fontSize="small" />
              Saved ({savedSuggestions.length})
            </Box>
          } 
        />
      </Tabs>

      {/* Generate New Tab */}
      {tabValue === 0 && (
        <Box>
          {!generated ? (
            <Button
              variant="outlined"
              color="primary"
              onClick={generateSuggestions}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CreateIcon />}
              sx={{ mb: 2 }}
            >
              {loading ? 'Generating...' : 'Generate Blog Suggestions'}
            </Button>
          ) : (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={saveSuggestions}
                  disabled={loading || suggestions.length === 0}
                  startIcon={<SaveIcon />}
                >
                  Save All Suggestions
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={generateSuggestions}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CreateIcon />}
                >
                  {loading ? 'Generating...' : 'Generate New'}
                </Button>
              </Box>

              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                Generated Blog Topic Ideas:
              </Typography>
              
              {suggestions.length > 0 ? (
                <List dense>
                  {suggestions.map((suggestion, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: '32px' }}>
                          <CreateIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={suggestion.title}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={
                            suggestion.isSaving 
                              ? "Saving..." 
                              : suggestion.isSaved 
                                ? "Already saved" 
                                : "Save this suggestion"
                          }>
                            <span> {/* Wrapper needed to show tooltip on disabled button */}
                              <IconButton 
                                edge="end" 
                                onClick={() => saveSingleSuggestion(suggestion.title, index)}
                                color="primary"
                                disabled={suggestion.isSaving || suggestion.isSaved}
                              >
                                {suggestion.isSaving ? (
                                  <CircularProgress size={20} />
                                ) : suggestion.isSaved ? (
                                  <CheckCircleIcon color="success" />
                                ) : (
                                  <SaveIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No suggestions available. Try generating new ones.
                </Typography>
              )}
            </>
          )}
        </Box>
      )}

      {/* Saved Suggestions Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
            Your Saved Blog Suggestions:
          </Typography>
          
          {savedSuggestions.length > 0 ? (
            <List dense>
              {savedSuggestions.map((suggestion) => (
                <React.Fragment key={suggestion.id}>
                  <ListItem sx={{ bgcolor: 'background.default', borderRadius: 1, mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: '32px' }}>
                      <StarIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={suggestion.title}
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {suggestion.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {suggestion.description}
                            </Typography>
                          )}
                          {suggestion.tags && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {suggestion.tags.split(',').map((tag, index) => (
                                <Chip 
                                  key={index} 
                                  label={tag.trim()} 
                                  size="small" 
                                  variant="outlined" 
                                />
                              ))}
                            </Box>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Saved on {new Date(suggestion.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditSuggestion(suggestion)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No saved suggestions yet. Generate some suggestions and save them to see them here.
            </Typography>
          )}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, suggestion: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Blog Suggestion</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editDialog.suggestion?.title || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              suggestion: { ...editDialog.suggestion, title: e.target.value }
            })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={editDialog.suggestion?.description || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              suggestion: { ...editDialog.suggestion, description: e.target.value }
            })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Tags (comma-separated, optional)"
            value={editDialog.suggestion?.tags || ''}
            onChange={(e) => setEditDialog({
              ...editDialog,
              suggestion: { ...editDialog.suggestion, tags: e.target.value }
            })}
            margin="normal"
            helperText="e.g., marketing, tips, industry trends"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, suggestion: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default BlogSuggestions; 