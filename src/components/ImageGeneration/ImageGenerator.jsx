import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Image as ImageIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [creditsRemaining, setCreditsRemaining] = useState(null);

  useEffect(() => {
    // Load existing images on component mount
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const response = await axios.get('/api/images/list');
      setGeneratedImages(response.data);
    } catch (err) {
      console.error('Error loading images:', err);
      setError('Failed to load existing images');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.post('/api/images/generate', {
        prompt: prompt.trim()
      });

      if (response.data.success) {
        // Update credits remaining
        setCreditsRemaining(response.data.credits_remaining);
        
        // Reload images to include the new one
        await loadImages();
        
        // Clear prompt
        setPrompt('');
      } else {
        setError(response.data.message || 'Failed to generate image');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.response?.data?.detail || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = (imageUrl) => {
    navigator.clipboard.writeText(imageUrl);
    // You could add a toast notification here
  };

  const handleDownload = async (imageUrl) => {
    try {
      window.open(imageUrl, '_blank');
    } catch (err) {
      console.error('Error downloading image:', err);
      setError('Failed to download image');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Image Generation
      </Typography>
      
      {creditsRemaining !== null && (
        <Typography variant="subtitle1" gutterBottom color="textSecondary">
          Credits remaining: {creditsRemaining}
        </Typography>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Enter your image prompt"
            variant="outlined"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            multiline
            rows={2}
          />
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            startIcon={isGenerating ? <CircularProgress size={20} /> : <ImageIcon />}
            sx={{ minWidth: '120px' }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Generated Images
      </Typography>

      <Grid container spacing={3}>
        {generatedImages.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  backgroundColor: '#f5f5f5',
                }}
              >
                <Box
                  component="img"
                  src={image.web_view_link}
                  alt={`Generated image ${index + 1}`}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
                  {image.prompt}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Tooltip title="Share">
                    <IconButton onClick={() => handleShare(image.web_view_link)} size="small">
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton onClick={() => handleDownload(image.web_view_link)} size="small">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ImageGenerator; 