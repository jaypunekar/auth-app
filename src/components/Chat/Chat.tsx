import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, CircularProgress, Divider, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../services/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ImageGenerationRequest {
  business_type: string;
  product_category?: string;
  image_style?: string;
  campaign_theme?: string;
  business_name?: string;
  campaign_objective?: string;
  platform?: string;
}

interface CampaignData {
  title: string;
  platform: string;
  budget: number;
  start_date: string;
  end_date: string;
  headlines: string[];
  descriptions: string[];
  keywords: string[];
  website_url?: string;
  target_audience?: any;
  google_ads_campaign_id?: string;
  google_ads_ad_group_id?: string;
  google_ads_ad_id?: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your AI assistant for creating ad campaigns. I can help you create campaigns for platforms like Meta, Google, LinkedIn, Pinterest, Snapchat, TikTok, and Reddit. What would you like to do today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [campaignsCreated, setCampaignsCreated] = useState(false);
  const [imageGenerationRequested, setImageGenerationRequested] = useState(false);
  const [imageRequestData, setImageRequestData] = useState<ImageGenerationRequest | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await apiClient.post('/chat/send', {
        content: userMessage
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
      
      // Check if campaign data was extracted
      if (response.data.campaign_data) {
        const extractedData = response.data.campaign_data;
        console.log('Extracted campaign data:', extractedData);
        
        // Store the campaign data
        setCampaignData(extractedData);
        
        // Check if campaign was created via API
        if (extractedData.google_ads_campaign_id) {
          setCampaignsCreated(true);
          enqueueSnackbar('Google Ads campaign created successfully!', { variant: 'success' });
          
          // Add a message about the created campaign
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Great news! I've created your Google Ads campaign with ID: ${extractedData.google_ads_campaign_id}. 
            
The campaign "${extractedData.title}" has been set up with your budget of $${extractedData.budget} per day. 
            
Your ad group ID is: ${extractedData.google_ads_ad_group_id}
Your ad ID is: ${extractedData.google_ads_ad_id}
            
The campaign will start on ${extractedData.start_date} and run until ${extractedData.end_date}.
            
You can now monitor your campaign performance in your Google Ads account. Is there anything else you'd like to know about your new campaign?`
          }]);
        }
      }
      
      // Check if campaigns were created
      if (response.data.campaigns_created) {
        setCampaignsCreated(true);
        enqueueSnackbar('Campaign created successfully!', { variant: 'success' });
      }
      
      // Check if image generation was requested
      if (response.data.image_generation_requested) {
        setImageGenerationRequested(true);
        // Store the image generation request data
        if (response.data.image_request) {
          setImageRequestData(response.data.image_request);
        } else {
          // Default values if no specific request data
          setImageRequestData({
            business_type: 'retail',
            product_category: 'clothing',
            image_style: 'professional',
            campaign_theme: 'summer sale',
            business_name: 'Example Business',
            campaign_objective: 'AWARENESS',
            platform: 'Meta'
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      enqueueSnackbar('Error sending message. Please try again.', { variant: 'error' });
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      // Use the image request data from the state or fallback to defaults
      const requestData = imageRequestData || {
        business_type: 'retail',
        product_category: 'clothing',
        image_style: 'professional',
        campaign_theme: 'summer sale',
        business_name: 'Example Business',
        campaign_objective: 'AWARENESS',
        platform: 'Meta'
      };
      
      // Make the API call to generate the image
      const response = await apiClient.post('/chat/generate-image', requestData);

      if (response.data.success) {
        setGeneratedImage(response.data.image_url);
        setImageGenerationRequested(false);
        enqueueSnackbar('Image generated successfully!', { variant: 'success' });
        
        // Add a message about the image
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I've generated an image for your campaign. You can use this in your ads.

![Generated Ad Image](${response.data.image_url})

${response.data.message}

Would you like me to generate another image with different parameters?`
        }]);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      enqueueSnackbar('Error generating image. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewCampaigns = () => {
    navigate('/campaigns');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ flex: 1, mb: 2, p: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {messages.map((message, index) => (
          <Box 
            key={index} 
            sx={{ 
              mb: 2, 
              p: 1.5, 
              borderRadius: 2,
              backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              ml: message.role === 'user' ? 'auto' : 0
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </Typography>
            <Box sx={{ whiteSpace: 'pre-wrap' }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Campaign Creation Status */}
      {campaignsCreated && campaignData && campaignData.google_ads_campaign_id && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success">
            Campaign "{campaignData.title}" created successfully! Campaign ID: {campaignData.google_ads_campaign_id}
          </Alert>
        </Box>
      )}

      {/* Image Generation Request */}
      {imageGenerationRequested && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="info">
            I can generate an image for your campaign. Would you like me to do that?
          </Alert>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGenerateImage}
              disabled={loading}
            >
              Generate Image
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<SendIcon />} 
          onClick={handleSendMessage}
          disabled={loading || input.trim() === ''}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat; 