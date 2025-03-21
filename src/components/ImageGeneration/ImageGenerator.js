import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { ImageSearch as ImageIcon } from '@mui/icons-material';
import { imageAPI } from '../../services/api';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch existing generated images on component mount
  useEffect(() => {
    fetchGeneratedImages();
  }, []);

  const fetchGeneratedImages = async () => {
    try {
      setError(null);
      const response = await imageAPI.getImages();
      setGeneratedImages(response.data);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images. Please try again.');
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for image generation.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await imageAPI.generateImage(prompt.trim());

      if (response.data.success) {
        // Refresh the list of generated images
        await fetchGeneratedImages();
        setPrompt(''); // Clear the prompt
      } else {
        setError(response.data.message || 'Failed to generate image.');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.response?.data?.detail || 'An error occurred while generating the image.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        AI Image Generation
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter a prompt to generate an image using Google's Gemini AI. Be creative - describe scenes, objects, styles, and moods.
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" noValidate>
          <TextField
            fullWidth
            label="Image Prompt"
            variant="outlined"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="E.g., A futuristic city with flying cars and neon lights"
            disabled={loading}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateImage}
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ImageIcon />}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ mb: 4 }} />

      <Typography variant="h6" gutterBottom>
        Generated Images
      </Typography>

      {generatedImages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No images generated yet. Enter a prompt above to create your first image.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {generatedImages.map((image) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={image.url}
                  alt={image.prompt}
                  sx={{ 
                    objectFit: 'contain',
                    bgcolor: 'rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(image)}
                />
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {new Date(image.created_at).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Image Preview Dialog */}
      {selectedImage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            p: 2,
          }}
          onClick={handleClosePreview}
        >
          <Box 
            sx={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.prompt}
              style={{ 
                maxWidth: '100%', 
                maxHeight: 'calc(90vh - 100px)',
                objectFit: 'contain',
                backgroundColor: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            />
            <Paper sx={{ p: 2, mt: 1, width: '100%', maxWidth: '600px' }}>
              <Typography variant="body2">
                <strong>Created:</strong> {new Date(selectedImage.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Prompt:</strong> {selectedImage.prompt}
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ImageGenerator; 