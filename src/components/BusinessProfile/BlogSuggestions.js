import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import businessProfileService from '../../services/businessProfileService';

const BlogSuggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      const blogSuggestions = await businessProfileService.getBlogSuggestions();
      setSuggestions(blogSuggestions);
      setGenerated(true);
    } catch (error) {
      console.error('Failed to get blog suggestions:', error);
      setError(error.response?.data?.detail || 'Failed to generate blog suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
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
        Get AI-powered blog topic suggestions based on your business profile. These suggestions can help 
        you create engaging content for your audience.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
            Blog Topic Ideas:
          </Typography>
          
          {suggestions.length > 0 ? (
            <List dense>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: '32px' }}>
                      <CreateIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                  {index < suggestions.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No suggestions available. Try generating new ones.
            </Typography>
          )}
          
          <Button
            variant="outlined"
            color="primary"
            onClick={generateSuggestions}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CreateIcon />}
            sx={{ mt: 2 }}
          >
            {loading ? 'Generating...' : 'Generate New Suggestions'}
          </Button>
        </>
      )}
    </Paper>
  );
};

export default BlogSuggestions; 