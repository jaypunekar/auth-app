import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarIcon from '@mui/icons-material/Star';
import { apiClient } from '../../services/apiClient';

const MessageFeedback = ({ messageId, sessionId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial feedback state
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await apiClient.get(`/chat/feedback/${messageId}`);
        setIsLiked(response.data.is_liked);
        setIsDisliked(response.data.is_disliked);
        setIsStarred(response.data.is_starred);
      } catch (error) {
        console.error('Error fetching message feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    if (messageId) {
      fetchFeedback();
    }
  }, [messageId]);

  const submitFeedback = async (type, value) => {
    try {
      const requestData = {
        message_id: messageId
      };

      // Set the appropriate field based on feedback type
      if (type === 'like') {
        requestData.is_liked = value;
        requestData.is_disliked = false; // Reset dislike if liking
      } else if (type === 'dislike') {
        requestData.is_disliked = value;
        requestData.is_liked = false; // Reset like if disliking
      } else if (type === 'star') {
        requestData.is_starred = value;
      }

      // Submit the feedback to the API
      await apiClient.post('/chat/feedback', requestData);
    } catch (error) {
      console.error(`Error submitting message ${type} feedback:`, error);
      // Revert state on error
      if (type === 'like') setIsLiked(!value);
      if (type === 'dislike') setIsDisliked(!value);
      if (type === 'star') setIsStarred(!value);
    }
  };

  const handleLike = () => {
    const newValue = !isLiked;
    setIsLiked(newValue);
    if (newValue) setIsDisliked(false); // Ensure dislike is off when liking
    submitFeedback('like', newValue);
  };

  const handleDislike = () => {
    const newValue = !isDisliked;
    setIsDisliked(newValue);
    if (newValue) setIsLiked(false); // Ensure like is off when disliking
    submitFeedback('dislike', newValue);
  };

  const handleStar = () => {
    const newValue = !isStarred;
    setIsStarred(newValue);
    submitFeedback('star', newValue);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        mt: 1,
        opacity: 0.7,
        '&:hover': {
          opacity: 1
        }
      }}
    >
      <Tooltip title={isLiked ? "Remove Like" : "Like"}>
        <IconButton 
          size="small" 
          onClick={handleLike}
          color={isLiked ? "primary" : "default"}
          sx={{ mr: 1 }}
        >
          {isLiked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={isDisliked ? "Remove Dislike" : "Dislike"}>
        <IconButton 
          size="small" 
          onClick={handleDislike}
          color={isDisliked ? "error" : "default"}
          sx={{ mr: 1 }}
        >
          {isDisliked ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      
      <Tooltip title={isStarred ? "Unstar" : "Star"}>
        <IconButton 
          size="small" 
          onClick={handleStar}
          color={isStarred ? "warning" : "default"}
        >
          {isStarred ? <StarIcon fontSize="small" /> : <StarOutlineIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default MessageFeedback; 