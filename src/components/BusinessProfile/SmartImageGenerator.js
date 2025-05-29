import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Typography,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Image as ImageIcon, Download as DownloadIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import axios from 'axios';

const SmartImageGenerator = ({ businessProfileId }) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setGeneratedImage(null);
  };

  const handleClose = () => {
    setOpen(false);
    setPrompt('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.post('/api/images/generate-smart', {
        prompt: prompt.trim(),
        business_profile_id: businessProfileId
      });

      if (response.data.success) {
        setGeneratedImage({
          url: response.data.image_url,
          credits: response.data.credits_remaining
        });
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

  const handleDownload = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const handleOpenFullPreview = () => {
    setShowFullPreview(true);
  };

  const handleCloseFullPreview = () => {
    setShowFullPreview(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<ImageIcon />}
        onClick={handleOpen}
        sx={{ mt: 2 }}
      >
        Generate Smart Image
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Generate Smart Business Image
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your prompt and we'll generate an image that matches your business profile's style and branding.
          </Typography>

          <TextField
            fullWidth
            label="What kind of image would you like to generate?"
            variant="outlined"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {generatedImage && (
            <Card sx={{ mt: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={generatedImage.url}
                  alt="Generated image"
                  sx={{ 
                    height: 300,
                    objectFit: 'contain',
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer'
                  }}
                  onClick={handleOpenFullPreview}
                />
                <Box sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  display: 'flex', 
                  gap: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 1,
                  padding: 0.5
                }}>
                  <Tooltip title="Open in new tab">
                    <IconButton 
                      size="small" 
                      onClick={() => window.open(generatedImage.url, '_blank')}
                    >
                      <OpenInNewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDownload(generatedImage.url)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Credits remaining: {generatedImage.credits}
                </Typography>
              </CardContent>
            </Card>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={isGenerating}>
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={20} /> : <ImageIcon />}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog
        open={showFullPreview}
        onClose={handleCloseFullPreview}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {generatedImage && (
            <>
              <img
                src={generatedImage.url}
                alt="Generated image full preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain'
                }}
              />
              <Box sx={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                display: 'flex', 
                gap: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 1,
                padding: 0.5
              }}>
                <Tooltip title="Open in new tab">
                  <IconButton 
                    size="small" 
                    onClick={() => window.open(generatedImage.url, '_blank')}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton 
                    size="small" 
                    onClick={() => handleDownload(generatedImage.url)}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFullPreview}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SmartImageGenerator; 