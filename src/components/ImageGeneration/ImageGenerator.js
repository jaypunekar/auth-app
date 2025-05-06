import React, { useState, useEffect, useContext } from 'react';
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
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { 
  ImageSearch as ImageIcon, 
  OpenInNew as OpenInNewIcon,
  CreditCard as CreditCardIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { imageAPI } from '../../services/api';
import CreditDisplay from '../CreditDisplay';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Create a context to trigger credit refresh in the CreditDisplay component
export const CreditRefreshContext = React.createContext();

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Fetch existing generated images on component mount
  useEffect(() => {
    fetchGeneratedImages();
  }, []);

  // Function to refresh user's credit count
  const refreshCredits = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const apiPath = normalizedBaseUrl.includes('/api') ? '/images/credits' : '/api/images/credits';
      
      const response = await axios.get(
        `${normalizedBaseUrl}${apiPath}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCreditsRemaining(response.data.credits);
      // Trigger refresh of the CreditDisplay component
      setCreditRefreshTrigger(prev => prev + 1);
      
      console.log('Credits refreshed:', response.data.credits);
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  };

  const fetchGeneratedImages = async () => {
    try {
      setError(null);
      const response = await imageAPI.getImages();
      // Ensure we always set an array, even if the API returns something else
      if (Array.isArray(response.data)) {
        setGeneratedImages(response.data);
      } else {
        console.error('API returned non-array data:', response.data);
        setGeneratedImages([]);
        setError('Invalid data format received from server.');
      }
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images. Please try again.');
      setGeneratedImages([]);
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
        // Save the remaining credits
        if (response.data.credits_remaining !== undefined) {
          setCreditsRemaining(response.data.credits_remaining);
          console.log('Credits remaining after generation:', response.data.credits_remaining);
          
          // Refresh the credit display component
          setCreditRefreshTrigger(prev => prev + 1);
        } else {
          // If credits_remaining isn't included in response, refresh credits manually
          await refreshCredits();
        }
        
        // Refresh the list of generated images
        await fetchGeneratedImages();
        setPrompt(''); // Clear the prompt
      } else {
        setError(response.data.message || 'Failed to generate image.');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      
      // Handle insufficient credits error
      if (err.response?.status === 402) {
        setShowSubscriptionDialog(true);
      } else {
      setError(err.response?.data?.detail || 'An error occurred while generating the image.');
      }
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

  const openImageInNewTab = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleUpgradeSubscription = () => {
    setShowSubscriptionDialog(false);
    navigate('/subscriptions');
  };

  return (
    <CreditRefreshContext.Provider value={{ refreshTrigger: creditRefreshTrigger }}>
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
        AI Image Generation
      </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CreditDisplay 
              showBuyButton={true}
              onBuyCredits={() => navigate('/subscriptions')}
              size="medium"
            />
            <IconButton 
              size="small" 
              onClick={refreshCredits} 
              sx={{ ml: 1 }}
              title="Refresh credits"
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter a prompt to generate an image using Google's Gemini AI. Be creative - describe scenes, objects, styles, and moods.
          <strong> Each image generation costs 2 credits.</strong>
      </Typography>
        
        {creditsRemaining !== null && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/subscriptions')}
              >
                Get More
              </Button>
            }
          >
            After your last image generation, you have {creditsRemaining} credits remaining.
          </Alert>
        )}

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
        Your Generated Images
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
                  image={image.thumbnail_url || image.url}
                  alt={image.prompt}
                  sx={{ 
                    objectFit: 'contain',
                    bgcolor: 'rgba(0,0,0,0.05)',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(image)}
                />
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={image.prompt}>
                    {image.prompt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(image.created_at).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<OpenInNewIcon />}
                    onClick={() => openImageInNewTab(image.url)}
                  >
                    Open
                  </Button>
                </CardActions>
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
              <Typography variant="body2" gutterBottom>
                <strong>Prompt:</strong> {selectedImage.prompt}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Created:</strong> {new Date(selectedImage.created_at).toLocaleString()}
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<OpenInNewIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  openImageInNewTab(selectedImage.url);
                }}
                sx={{ mt: 1 }}
              >
                Open in New Tab
              </Button>
            </Paper>
          </Box>
        </Box>
      )}
        
        {/* Insufficient Credits Dialog */}
        <Dialog
          open={showSubscriptionDialog}
          onClose={() => setShowSubscriptionDialog(false)}
          aria-labelledby="insufficient-credits-dialog-title"
        >
          <DialogTitle id="insufficient-credits-dialog-title">
            Insufficient Credits
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              You don't have enough credits to generate an image. Each image generation costs 2 credits.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upgrade to a Pro subscription to receive 250 credits or continue with your free account with 20 credits.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubscriptionDialog(false)} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleUpgradeSubscription} 
              variant="contained" 
              color="primary"
              startIcon={<CreditCardIcon />}
            >
              Upgrade Subscription
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
    </CreditRefreshContext.Provider>
  );
};

export default ImageGenerator; 