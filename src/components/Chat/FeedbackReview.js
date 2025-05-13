import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, CircularProgress, 
  List, ListItem, Divider, IconButton, Tooltip,
  Card, CardContent, Chip
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarIcon from '@mui/icons-material/Star';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../services/apiClient';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const FeedbackReview = () => {
  const [feedbackType, setFeedbackType] = useState('all');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeedbackMessages();
  }, [feedbackType]);

  const fetchFeedbackMessages = async () => {
    setLoading(true);
    try {
      const endpoint = `/chat/feedback/review${feedbackType !== 'all' ? `?type=${feedbackType}` : ''}`;
      const response = await apiClient.get(endpoint);
      setMessages(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feedback messages:', err);
      setError('Failed to load feedback messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setFeedbackType(newValue);
  };

  const handleOpenChat = (sessionId) => {
    navigate(`/chat/${sessionId}`);
  };

  const getFeedbackIcon = (feedback) => {
    if (feedback.is_liked) return <ThumbUpIcon color="primary" />;
    if (feedback.is_disliked) return <ThumbDownIcon color="error" />;
    if (feedback.is_starred) return <StarIcon color="warning" />;
    return null;
  };

  const getFeedbackLabel = (feedback) => {
    if (feedback.is_liked) return 'Liked';
    if (feedback.is_disliked) return 'Disliked';
    if (feedback.is_starred) return 'Starred';
    return '';
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Response Review
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review your marked assistant responses
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={feedbackType} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Feedback" value="all" />
          <Tab 
            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
              Liked
            </Box>} 
            value="liked" 
          />
          <Tab 
            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThumbDownIcon fontSize="small" sx={{ mr: 1 }} />
              Disliked
            </Box>} 
            value="disliked" 
          />
          <Tab 
            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StarIcon fontSize="small" sx={{ mr: 1 }} />
              Starred
            </Box>} 
            value="starred" 
          />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center', my: 4 }}>
          {error}
        </Typography>
      ) : messages.length === 0 ? (
        <Typography sx={{ textAlign: 'center', my: 4 }}>
          No {feedbackType !== 'all' ? feedbackType : 'feedback'} messages found.
        </Typography>
      ) : (
        <List sx={{ width: '100%' }}>
          {messages.map((item, index) => (
            <React.Fragment key={item.message_id}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      icon={getFeedbackIcon(item.feedback)}
                      label={getFeedbackLabel(item.feedback)}
                      color={item.feedback.is_liked ? 'primary' : item.feedback.is_disliked ? 'error' : 'warning'}
                      size="small"
                    />
                    <Box>
                      <Tooltip title="View in Chat">
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenChat(item.session_id)}
                          sx={{ ml: 1 }}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    From: {item.session_name} • {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                  </Typography>
                  
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    mt: 1
                  }}>
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                  </Box>
                </CardContent>
              </Card>
              {index < messages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FeedbackReview; 