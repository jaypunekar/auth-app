import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Snackbar,
} from "@mui/material";
import {
  Send as SendIcon,
  Chat as ChatIcon,
  SmartToy as BotIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
} from "@mui/icons-material";
import { chatAPI, feedbackAPI } from "../services/api";
import { keyframes } from "@mui/system";
import CampaignPreviewDialog from "../components/CampaignPreviewDialog";
import MultiPlatformPreviewDialog from "../components/MultiPlatformPreviewDialog";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";

// Define pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Custom styles for Markdown content
const markdownStyles = {
  p: {
    marginBottom: "0.5rem",
    marginTop: "0.5rem",
  },
  h3: {
    marginTop: "1rem",
    marginBottom: "0.5rem",
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  h4: {
    marginTop: "0.75rem",
    marginBottom: "0.5rem",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  ul: {
    paddingLeft: "1.5rem",
    marginBottom: "0.5rem",
  },
  ol: {
    paddingLeft: "1.5rem",
    marginBottom: "0.5rem",
  },
  li: {
    marginBottom: "0.25rem",
  },
  a: {
    color: "primary.main",
    textDecoration: "underline",
  },
  code: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: "0.1rem 0.2rem",
    borderRadius: "3px",
    fontFamily: "monospace",
  },
  pre: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: "0.5rem",
    borderRadius: "4px",
    overflowX: "auto",
    marginBottom: "0.5rem",
  },
  blockquote: {
    borderLeft: "3px solid rgba(0, 0, 0, 0.1)",
    paddingLeft: "1rem",
    fontStyle: "italic",
    margin: "0.5rem 0",
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
};

// Message component with Markdown support
const ChatMessage = ({ message }) => {
  const isAssistant = message.role === "assistant";
  const [feedbackState, setFeedbackState] = useState({
    loading: false,
    feedback: null, // null = no feedback, true = thumbs up, false = thumbs down
    feedbackId: null,
  });
  
  // Check if the message contains an image
  const [hasImage, setHasImage] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [driveImageUrl, setDriveImageUrl] = useState(null);
  
  // Parse message for image data and Google Drive URLs
  useEffect(() => {
    if (isAssistant && message.content) {
      try {
        // Extract prompt text from message if possible
        let promptText = '';
        const promptMatch = message.content.match(/prompt: ["']([^"']+)["']/i) || 
                          message.content.match(/generated image for: ["']([^"']+)["']/i) ||
                          message.content.match(/image of ["']([^"']+)["']/i);
        
        if (promptMatch && promptMatch[1]) {
          promptText = promptMatch[1];
        }

        // Check for Google Drive URL in the message using multiple patterns
        const driveUrlPatterns = [
          /available at: (https:\/\/drive\.google\.com\/[^\s]+)/i,
          /\[View in Google Drive\]\((https:\/\/drive\.google\.com\/[^\s\)]+)\)/i,
          /Google Drive: (https:\/\/drive\.google\.com\/[^\s]+)/i,
          /(https:\/\/drive\.google\.com\/file\/d\/[-\w]{25,}[^\s]*)/i,
          /(https:\/\/drive\.google\.com\/open\?id=[-\w]{25,}[^\s]*)/i
        ];
        
        let driveUrl = null;
        for (const pattern of driveUrlPatterns) {
          const match = message.content.match(pattern);
          if (match && match[1]) {
            driveUrl = match[1];
            break;
          }
        }
        
        if (driveUrl) {
          console.log("Found Google Drive URL:", driveUrl);
          setDriveImageUrl({
            url: driveUrl,
            prompt: promptText
          });
        }
        
        // Original image data extraction logic
        // Try to parse potential JSON content
        if (message.content.includes('"display_type":"image"') || 
            message.content.includes('"file_info"')) {
          
          // Find JSON in message content - look for the first { and the matching }
          let jsonContent = null;
          const startIdx = message.content.indexOf('{');
          if (startIdx >= 0) {
            let braceCount = 0;
            let endIdx = -1;
            
            for (let i = startIdx; i < message.content.length; i++) {
              if (message.content[i] === '{') braceCount++;
              if (message.content[i] === '}') braceCount--;
              
              if (braceCount === 0) {
                endIdx = i;
                break;
              }
            }
            
            if (endIdx > startIdx) {
              try {
                jsonContent = JSON.parse(message.content.substring(startIdx, endIdx + 1));
              } catch (e) {
                console.error("Error parsing potential JSON in message:", e);
              }
            }
          }
          
          // Check if we found valid image data
          if (jsonContent && 
              jsonContent.display_type === 'image' && 
              jsonContent.file_info) {
            
            setHasImage(true);
            setImageData({
              fileInfo: jsonContent.file_info,
              thumbnail: jsonContent.file_info.thumbnail,
              prompt: jsonContent.prompt || '',
              additionalText: jsonContent.additional_text || ''
            });
            
            // Continue processing the rest of the message
          }
        }
      } catch (error) {
        console.error("Error parsing message content for image:", error);
      }
    }
  }, [isAssistant, message.content]);

  // Handle feedback button click
  const handleFeedback = async (isPositive) => {
    // Skip if not an assistant message
    if (!isAssistant) return;
    
    // If already giving the same feedback, remove it
    if (feedbackState.feedback === isPositive) {
      try {
        setFeedbackState((prev) => ({ ...prev, loading: true }));
        
        // If we have a feedback ID, delete it
        if (feedbackState.feedbackId) {
          await feedbackAPI.deleteFeedback(feedbackState.feedbackId);
        }
        
        setFeedbackState({
          loading: false,
          feedback: null,
          feedbackId: null,
        });
      } catch (error) {
        console.error("Error removing feedback:", error);
        setFeedbackState((prev) => ({ ...prev, loading: false }));
      }
    } else {
      // Otherwise, submit new or update existing feedback
      try {
        setFeedbackState((prev) => ({ ...prev, loading: true }));
        
        const response = await feedbackAPI.submitFeedback(message.id, isPositive);
        
        setFeedbackState({
          loading: false,
          feedback: isPositive,
          feedbackId: response.data.id,
        });
      } catch (error) {
        console.error("Error submitting feedback:", error);
        setFeedbackState((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  return (
    <ListItem
      alignItems="flex-start"
      sx={{ flexDirection: isAssistant ? "row" : "row-reverse" }}
    >
      <ListItemAvatar sx={{ minWidth: 40 }}>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isAssistant ? "primary.main" : "secondary.main",
            fontSize: "0.875rem",
          }}
        >
          {isAssistant ? "AI" : "You"}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box
            sx={{
              backgroundColor: isAssistant ? "primary.light" : "grey.100",
              color: isAssistant ? "primary.contrastText" : "text.primary",
              borderRadius: 2,
              padding: 2,
              maxWidth: hasImage ? "95%" : "80%",
              ml: isAssistant ? 0 : "auto",
              mr: isAssistant ? "auto" : 0,
            }}
          >
            {isAssistant ? (
              <>
                {/* Display markdown content */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => (
                      <Typography
                        variant="body2"
                        sx={markdownStyles.p}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <Typography
                        variant="h6"
                        sx={markdownStyles.h3}
                        {...props}
                      />
                    ),
                    h4: ({ node, ...props }) => (
                      <Typography
                        variant="subtitle1"
                        sx={markdownStyles.h4}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <Box component="ul" sx={markdownStyles.ul} {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <Box component="ol" sx={markdownStyles.ol} {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <Box component="li" sx={markdownStyles.li} {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <Box
                        component="a"
                        sx={markdownStyles.a}
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <Box
                          component="code"
                          sx={markdownStyles.code}
                          {...props}
                        />
                      ) : (
                        <Box component="pre" sx={markdownStyles.pre} {...props} />
                      ),
                    blockquote: ({ node, ...props }) => (
                      <Box
                        component="blockquote"
                        sx={markdownStyles.blockquote}
                        {...props}
                      />
                    ),
                    strong: ({ node, ...props }) => (
                      <Box
                        component="strong"
                        sx={markdownStyles.strong}
                        {...props}
                      />
                    ),
                    em: ({ node, ...props }) => (
                      <Box component="em" sx={markdownStyles.em} {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                
                {/* Display Google Drive image preview if available */}
                {driveImageUrl && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                      {driveImageUrl.prompt 
                        ? `Generated image for: "${driveImageUrl.prompt}"`
                        : 'Generated image - Click to view in Google Drive'}
                    </Typography>
                    
                    <Box 
                      component="a"
                      href={driveImageUrl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ 
                        display: 'block',
                        position: 'relative',
                        maxWidth: '90%',
                        margin: '0 auto',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      {/* Thumbnail image with extracted Google Drive ID */}
                      <Box
                        component="img" 
                        src={(() => {
                          // Extract file ID from Google Drive URL
                          try {
                            // Handle different Google Drive URL formats
                            let fileId = null;
                            
                            // Format: https://drive.google.com/file/d/FILE_ID/view
                            const fileMatch = driveImageUrl.url.match(/\/file\/d\/([-\w]{25,})/);
                            if (fileMatch && fileMatch[1]) {
                              fileId = fileMatch[1];
                            }
                            
                            // Format: https://drive.google.com/open?id=FILE_ID
                            const idMatch = driveImageUrl.url.match(/[?&]id=([-\w]{25,})/);
                            if (!fileId && idMatch && idMatch[1]) {
                              fileId = idMatch[1];
                            }
                            
                            // Generic match for any 25+ character alphanumeric ID
                            if (!fileId) {
                              const genericMatch = driveImageUrl.url.match(/[-\w]{25,}/);
                              if (genericMatch && genericMatch[0]) {
                                fileId = genericMatch[0];
                              }
                            }
                            
                            if (fileId) {
                              return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
                            }
                            
                            // If we can't extract the ID, return a placeholder
                            return '/static/images/image-placeholder.svg';
                          } catch (e) {
                            console.error("Error extracting file ID:", e);
                            return '/static/images/image-placeholder.svg';
                          }
                        })()}
                        alt="Generated image preview"
                        sx={{
                          width: '100%',
                          maxHeight: '250px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          boxShadow: 2,
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          }
                        }}
                        onError={(e) => {
                          // If thumbnail fails to load, show a placeholder
                          e.target.src = '/static/images/image-placeholder.svg';
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          padding: '8px',
                          textAlign: 'center',
                          fontSize: '0.85rem',
                          borderBottomLeftRadius: 1,
                          borderBottomRightRadius: 1,
                        }}
                      >
                        View in Google Drive
                      </Box>
                    </Box>
                  </Box>
                )}
                
                {/* Display image if present */}
                {hasImage && imageData && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                      {imageData.prompt ? `Generated image for: "${imageData.prompt}"` : 'Generated image'}
                    </Typography>
                    
                    {/* Display either the thumbnail or load the image from the server */}
                    {imageData.thumbnail ? (
                      <Box 
                        component="img"
                        src={`data:${imageData.fileInfo.mime_type || 'image/png'};base64,${imageData.thumbnail}`}
                        alt={imageData.prompt || "Generated image thumbnail"}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: 1,
                          boxShadow: 2,
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(`/api/images/${imageData.fileInfo.file_name}`, '_blank')}
                      />
                    ) : (
                      <Box 
                        component="img"
                        src={`/api/images/${imageData.fileInfo.file_name}`}
                        alt={imageData.prompt || "Generated image"}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: 1,
                          boxShadow: 2
                        }}
                      />
                    )}
                    
                    {imageData.additionalText && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {imageData.additionalText}
                      </Typography>
                    )}
                  </Box>
                )}
                
                {/* Feedback buttons for assistant messages */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 1,
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <Tooltip title={feedbackState.feedback === true ? "Remove helpful feedback" : "Mark as helpful"}>
                    <IconButton
                      size="small"
                      color={feedbackState.feedback === true ? "primary" : "default"}
                      disabled={feedbackState.loading}
                      onClick={() => handleFeedback(true)}
                    >
                      <ThumbUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={feedbackState.feedback === false ? "Remove not helpful feedback" : "Mark as not helpful"}>
                    <IconButton
                      size="small"
                      color={feedbackState.feedback === false ? "error" : "default"}
                      disabled={feedbackState.loading}
                      onClick={() => handleFeedback(false)}
                    >
                      <ThumbDownIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Typography variant="body2">{message.content}</Typography>
            )}
          </Box>
        }
        secondary={
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: isAssistant ? "left" : "right",
              mt: 0.5,
            }}
          >
            {typeof message.created_at === 'number' 
              ? new Date(message.created_at * 1000).toLocaleTimeString()
              : new Date(message.created_at).toLocaleTimeString()}
          </Typography>
        }
        disableTypography
      />
    </ListItem>
  );
};

const ChatPage = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [multiPlatformDialogOpen, setMultiPlatformDialogOpen] = useState(false);
  const [campaignDataList, setCampaignDataList] = useState([]);
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [createdCampaigns, setCreatedCampaigns] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  // Fetch chat history for a session
  const fetchChatHistory = useCallback(async (sessionId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await chatAPI.getChatHistory(sessionId);
      setMessages(response.data.messages);
    } catch (err) {
      setError("Failed to load chat history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle message sending
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    setNewMessage("");
    setLoading(true);

    // Add the user message to the UI
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Send the message to the API
      chatAPI
        .sendMessage(activeSession.session_id, messageText)
        .then((response) => {
          // Add the assistant response to the UI
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, response.data];
            // Check if the response contains campaign data
            checkForCampaignData(response.data.content, updatedMessages);
            return updatedMessages;
          });

          // Check if this is a Google Ads response
          if (response.data.needs_google_account) {
            // Show a notification that the user needs to link their Google Ads account
            setSnackbarMessage(
              "To create Google Ads, you need to link your Google Ads account first. Use the 'Link Google Ads' button in the top bar."
            );
            setSnackbarOpen(true);
          }

          // Check if Google Ads were created
          if (response.data.google_ads_result) {
            const { campaign_id, ad_group_id, ad_id } =
              response.data.google_ads_result;
            setSnackbarMessage(
              `Google Ads campaign created successfully! Campaign ID: ${campaign_id}`
            );
            setSnackbarOpen(true);
          }

          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to send message. Please try again.");
          console.error(err);
          setLoading(false);
        });
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  // Check if the assistant response contains campaign data
  const checkForCampaignData = async (content, allMessages) => {
    // Check if the message indicates a campaign creation
    const campaignCreationPhrases = [
      "campaign has been created",
      "created a draft campaign",
      "i've created a campaign",
      "your ad campaign is ready",
      "campaign is now set up",
      "campaign has been set up",
      "i'll create a campaign for you",
      "let me create a campaign",
      "i can create this campaign",
      "i will set up a campaign",
      "i've set up a campaign",
      "i've set up the campaign",
      "i have set up a campaign",
      "i have set up the campaign",
      "i have created a campaign",
      "i have created the campaign",
      "set up the campaign for you",
      "set up a campaign for you",
      "created the campaign for you",
      "created a campaign for you",
    ];

    const shouldCreateCampaign = campaignCreationPhrases.some((phrase) =>
      content.toLowerCase().includes(phrase)
    );

    if (shouldCreateCampaign) {
      // Get the full conversation history to extract more accurate data
      const conversationHistory = allMessages
        .map((msg) => msg.content)
        .join("\n\n");

      // Extract campaign data from the full conversation
      await extractCampaignData(conversationHistory + "\n\n" + content);
    }
  };

  // Function to complete missing campaign fields using Claude API
  const completeWithClaude = async (campaignData) => {
    try {
      // Check if there are any missing fields that need completion
      const needsCompletion =
        !campaignData.keywords ||
        !campaignData.headlines ||
        !campaignData.descriptions ||
        !campaignData.target_audience ||
        !campaignData.platform_specific;

      if (!needsCompletion) {
        return campaignData; // No completion needed
      }

      console.log("Completing campaign data with Claude API");

      // Prepare the prompt for Claude
      const prompt = `
      I need to complete missing fields for a ${
        campaignData.platform
      } ad campaign.
      
      Here's what I know about the campaign:
      - Title: ${campaignData.title || "Not specified"}
      - Description: ${campaignData.description || "Not specified"}
      - Platform: ${campaignData.platform}
      - Budget: ${campaignData.budget || "Not specified"} (${
        campaignData.budget_type || "daily"
      })
      - Target Audience: ${JSON.stringify(campaignData.target_audience || {})}
      
      Please provide the following in JSON format:
      1. Keywords (5-10 relevant keywords)
      2. Headlines (3-5 compelling headlines, each under 30 characters)
      3. Descriptions (2-3 descriptions, each under 90 characters)
      4. Additional target audience details (age range, gender, interests, location)
      5. Platform-specific details for ${campaignData.platform}
      
      Format your response as a valid JSON object with these keys: keywords, headlines, descriptions, target_audience, platform_specific
      `;

      // Call Claude API
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
        }
      );

      // Extract the JSON from Claude's response
      const claudeResponse = response.data.content[0].text;
      const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const completionData = JSON.parse(jsonMatch[0]);

        // Merge the completion data with the original campaign data
        const completedData = {
          ...campaignData,
          keywords: campaignData.keywords || completionData.keywords || [],
          headlines: campaignData.headlines || completionData.headlines || [],
          descriptions:
            campaignData.descriptions || completionData.descriptions || [],
          target_audience: {
            ...campaignData.target_audience,
            ...(completionData.target_audience || {}),
          },
          platform_specific: {
            ...campaignData.platform_specific,
            ...(completionData.platform_specific || {}),
          },
        };

        console.log("Completed campaign data:", completedData);
        return completedData;
      }

      return campaignData; // Return original if completion failed
    } catch (error) {
      console.error("Error completing campaign data with Claude:", error);
      return campaignData; // Return original on error
    }
  };

  // Handle campaign preview dialog close
  const handlePreviewDialogClose = async (success) => {
    // Only close the dialog, don't create a campaign if success is false
    setPreviewDialogOpen(false);

    // If the dialog was cancelled, don't do anything else
    if (!success) {
      console.log("Campaign creation cancelled");
    }
  };

  // Handle multi-platform preview dialog close
  const handleMultiPlatformDialogClose = async (success) => {
    // Only close the dialog, don't create campaigns if success is false
    setMultiPlatformDialogOpen(false);

    // If the dialog was cancelled, don't do anything else
    if (!success) {
      console.log("Multi-platform campaign creation cancelled");
    }
  };

  // Extract campaign data from the message
  const extractCampaignData = async (content) => {
    // Try to extract platforms mentioned in the content
    const platformMentions = extractPlatforms(content);

    if (platformMentions.length > 0) {
      // Create campaign data for each platform
      const campaignDataList = await Promise.all(
        platformMentions.map(async (platform) => {
          const platformData = {
            title:
              extractTitle(content, platform) ||
              `${platform} Campaign from Chat`,
            description: `Generated ${platform} campaign from conversation with AI assistant`,
            platform: platform,
            target_audience: {
              age_min: 25,
              age_max: 45,
              gender: "all",
              location: extractLocation(content) || "United States",
            },
            budget: extractBudget(content) || "10.0",
            budget_type: "daily",
            start_date: new Date(),
            end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
            keywords: extractKeywords(content, platform) || [],
            headlines: extractHeadlines(content, platform) || [],
            descriptions: extractDescriptions(content, platform) || [],
          };

          // Complete missing fields with Claude
          return await completeWithClaude(platformData);
        })
      );

      // Set the campaign data list and open the multi-platform preview dialog
      setCampaignDataList(campaignDataList);
      setMultiPlatformDialogOpen(true);
    } else {
      // Default to a single platform (Google) if no platforms are mentioned
      let defaultData = {
        title: extractTitle(content) || "Campaign from Chat",
        description: "Generated from conversation with AI assistant",
        platform: "Google",
        target_audience: {
          age_min: 25,
          age_max: 45,
          gender: "all",
          location: extractLocation(content) || "United States",
        },
        budget: extractBudget(content) || "10.0",
        budget_type: "daily",
        start_date: new Date(),
        end_date: new Date(new Date().setDate(new Date().getDate() + 30)),
        keywords: extractKeywords(content) || [],
        headlines: extractHeadlines(content) || [],
        descriptions: extractDescriptions(content) || [],
      };

      // Complete missing fields with Claude
      defaultData = await completeWithClaude(defaultData);

      // Set the campaign data and open the preview dialog
      setCampaignData(defaultData);
      setPreviewDialogOpen(true);
    }
  };

  // Extract platforms mentioned in the content
  const extractPlatforms = (content) => {
    const platformMap = {
      google: "Google"
    };

    const platforms = new Set();
    const lowerContent = content.toLowerCase();

    // Look for platform mentions in the content
    for (const [key, value] of Object.entries(platformMap)) {
      if (lowerContent.includes(key)) {
        platforms.add(value);
      }
    }

    return Array.from(platforms);
  };

  // Extract location from content
  const extractLocation = (content) => {
    const locationRegex = /location[:\s]+([^\.]+)/i;
    const match = content.match(locationRegex);
    return match ? match[1].trim() : null;
  };

  // Extract budget from content
  const extractBudget = (content) => {
    const budgetRegex = /budget[:\s]+\$?(\d+)/i;
    const match = content.match(budgetRegex);
    return match ? match[1].trim() : null;
  };

  // Extract title from content, optionally for a specific platform
  const extractTitle = (content, platform = null) => {
    let titleRegex;
    if (platform) {
      titleRegex = new RegExp(
        `${platform}[^"']*titled\\s+["']([^"']+)["']`,
        "i"
      );
    } else {
      titleRegex = /titled\s+["']([^"']+)["']/i;
    }
    const match = content.match(titleRegex);
    return match ? match[1] : null;
  };

  // Extract keywords from content, optionally for a specific platform
  const extractKeywords = (content, platform = null) => {
    let keywordsSection;
    if (platform) {
      const platformKeywordsRegex = new RegExp(
        `${platform}[^:]*keywords?[:\\s]+([^\\.]+)`,
        "i"
      );
      keywordsSection = content.match(platformKeywordsRegex);
    } else {
      keywordsSection = content.match(/keywords?[:\s]+([^\.]+)/i);
    }

    if (keywordsSection) {
      const keywordText = keywordsSection[1];
      return keywordText
        .split(/,|\sand\s|\n-\s/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
    return null;
  };

  // Extract headlines from content, optionally for a specific platform
  const extractHeadlines = (content, platform = null) => {
    let headlinesSection;
    if (platform) {
      const platformHeadlinesRegex = new RegExp(
        `${platform}[^:]*headlines?[:\\s]+([^\\.]+)`,
        "i"
      );
      headlinesSection = content.match(platformHeadlinesRegex);
    } else {
      headlinesSection = content.match(/headlines?[:\s]+([^\.]+)/i);
    }

    if (headlinesSection) {
      const headlineText = headlinesSection[1];
      return headlineText
        .split(/,|\sand\s|\n-\s/)
        .map((h) => h.trim())
        .filter((h) => h.length > 0);
    }
    return null;
  };

  // Extract descriptions from content, optionally for a specific platform
  const extractDescriptions = (content, platform = null) => {
    let descriptionsSection;
    if (platform) {
      const platformDescriptionsRegex = new RegExp(
        `${platform}[^:]*descriptions?[:\\s]+([^\\.]+)`,
        "i"
      );
      descriptionsSection = content.match(platformDescriptionsRegex);
    } else {
      descriptionsSection = content.match(/descriptions?[:\s]+([^\.]+)/i);
    }

    if (descriptionsSection) {
      const descriptionText = descriptionsSection[1];
      return descriptionText
        .split(/,|\sand\s|\n-\s/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }
    return null;
  };

  // Handle campaign creation success for a single platform
  const handleCampaignSuccess = (campaign) => {
    setSnackbarMessage(`Campaign "${campaign.title}" created successfully!`);
    setSnackbarOpen(true);

    // Add a message to the chat about the created campaign
    const successMessage = {
      id: Date.now(),
      role: "assistant",
      content: `I've created a campaign titled "${campaign.title}". You can view and edit it in the Campaigns section.`,
      created_at: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, successMessage]);

    // Add to created campaigns list
    setCreatedCampaigns((prev) => [...prev, campaign]);
  };

  // Handle completion of all platform campaigns
  const handleAllCampaignsCompleted = (campaigns) => {
    setSnackbarMessage(`${campaigns.length} campaigns created successfully!`);
    setSnackbarOpen(true);

    // Add a message to the chat about all created campaigns
    const platformNames = campaigns.map((c) => c.platform).join(", ");
    const successMessage = {
      id: Date.now(),
      role: "assistant",
      content: `I've created ${campaigns.length} campaigns for the following platforms: ${platformNames}. You can view and edit them in the Campaigns section.`,
      created_at: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, successMessage]);

    // Update created campaigns list
    setCreatedCampaigns(campaigns);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Navigate to campaigns page
  const goToCampaigns = () => {
    navigate("/campaigns");
  };

  // Update the sendMessage function to use handleSendMessage
  const sendMessage = async (e) => {
    e.preventDefault();
    handleSendMessage(newMessage);
  };

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        setTranscript(currentTranscript);
        setNewMessage(currentTranscript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    }
  }, []); // Initialize only once

  // Handle auto-send when speech recognition ends
  useEffect(() => {
    // If speech recognition just ended and we have content
    if (!isListening && autoSendVoice && transcript.trim()) {
      // Small delay to ensure UI is updated
      const timer = setTimeout(() => {
        handleSendMessage(transcript);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isListening, autoSendVoice, transcript, handleSendMessage]);

  // Toggle speech recognition
  const toggleListening = () => {
    if (!speechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      speechRecognition.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      speechRecognition.start();
      setIsListening(true);
    }
  };

  // Fetch chat sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await chatAPI.getChatSessions();
      setSessions(response.data);

      // If there are sessions, set the first one as active
      if (response.data.length > 0) {
        setActiveSession(response.data[0]);
        await fetchChatHistory(response.data[0].session_id);
      }
    } catch (err) {
      setError("Failed to load chat sessions. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchChatHistory]);

  // Fetch chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Start a new chat session
  const startNewChat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await chatAPI.startChat();

      // Add the new session to the list
      setSessions((prevSessions) => [response.data, ...prevSessions]);

      // Set the new session as active
      setActiveSession(response.data);

      // Set the welcome message
      setMessages(response.data.messages);

      // Switch to the chat tab
      setTabValue(1);
    } catch (err) {
      console.error(err);

      // Provide a more informative error message
      let errorMessage = "Failed to start a new chat. Please try again.";

      if (err.response) {
        if (err.response.status === 500) {
          errorMessage =
            "Server error: The chat service is currently unavailable. This might be due to API configuration issues.";
        } else if (err.response.data && err.response.data.detail) {
          errorMessage = `Error: ${err.response.data.detail}`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle session click
  const handleSessionClick = useCallback(
    async (session) => {
      if (session.id === activeSession?.id) return;

      setActiveSession(session);
      await fetchChatHistory(session.session_id);
      setTabValue(1);
    },
    [activeSession, fetchChatHistory]
  );

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Chat with Ad Assistant
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{ p: 0, height: 600, display: "flex", flexDirection: "column" }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="chat tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Sessions" />
          <Tab label="Chat" />
        </Tabs>

        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
          {/* Sessions Panel */}
          <Box
            sx={{
              width: 300,
              borderRight: 1,
              borderColor: "divider",
              display: tabValue === 0 ? "block" : { xs: "none", md: "block" },
              overflow: "auto",
            }}
          >
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={startNewChat}
                disabled={loading}
              >
                New Chat
              </Button>
            </Box>

            <Divider />

            <List sx={{ p: 0 }}>
              {sessions.map((session) => (
                <ListItem
                  key={session.id}
                  button
                  selected={session.id === activeSession?.id}
                  onClick={() => handleSessionClick(session)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <ChatIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      session.created_at
                        ? new Date(session.created_at).toLocaleDateString()
                        : "New Chat"
                    }
                    secondary={`${session.messages.length} messages`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Chat Panel */}
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              display: tabValue === 1 ? "flex" : { xs: "flex", md: "flex" },
            }}
          >
            {activeSession ? (
              <>
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    p: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <List>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </List>

                  {loading && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </Box>

                {isListening && (
                  <Box
                    sx={{
                      mb: 1,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mx: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <MicIcon
                        sx={{
                          mr: 1,
                          animation: `${pulse} 1.5s infinite ease-in-out`,
                        }}
                      />
                      <Typography variant="body2">
                        {transcript ? transcript : "Listening..."}
                      </Typography>
                    </Box>
                    <Tooltip
                      title={
                        autoSendVoice
                          ? "Auto-send enabled"
                          : "Auto-send disabled"
                      }
                    >
                      <Button
                        size="small"
                        variant={autoSendVoice ? "contained" : "outlined"}
                        onClick={() => setAutoSendVoice(!autoSendVoice)}
                        sx={{ ml: 1, minWidth: "auto", fontSize: "0.7rem" }}
                      >
                        Auto
                      </Button>
                    </Tooltip>
                  </Box>
                )}

                <Box
                  component="form"
                  onSubmit={sendMessage}
                  sx={{
                    p: 2,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs>
                      <TextField
                        fullWidth
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={loading || isListening}
                        variant="outlined"
                        size="small"
                      />
                    </Grid>
                    <Grid item>
                      <Tooltip
                        title={isListening ? "Stop listening" : "Voice input"}
                      >
                        <IconButton
                          color={isListening ? "error" : "primary"}
                          onClick={toggleListening}
                          disabled={loading}
                        >
                          {isListening ? <MicOffIcon /> : <MicIcon />}
                        </IconButton>
                      </Tooltip>
                    </Grid>
                    <Grid item>
                      <Button
                        type="submit"
                        variant="contained"
                        endIcon={<SendIcon />}
                        disabled={!newMessage.trim() || loading}
                      >
                        Send
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  p: 3,
                }}
              >
                <BotIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No active chat session
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  align="center"
                  paragraph
                >
                  Start a new chat to begin talking with the ad assistant
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ChatIcon />}
                  onClick={startNewChat}
                  disabled={loading}
                >
                  Start New Chat
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Campaign Preview Dialog */}
      <CampaignPreviewDialog
        open={previewDialogOpen}
        onClose={handlePreviewDialogClose}
        campaignData={campaignData}
        onSuccess={handleCampaignSuccess}
      />

      {/* Multi-Platform Campaign Preview Dialog */}
      <MultiPlatformPreviewDialog
        open={multiPlatformDialogOpen}
        onClose={handleMultiPlatformDialogClose}
        campaignDataList={campaignDataList}
        onSuccess={handleCampaignSuccess}
        onAllCompleted={handleAllCampaignsCompleted}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <Button color="primary" size="small" onClick={goToCampaigns}>
            View Campaigns
          </Button>
        }
      />
    </Box>
  );
};

export default ChatPage;
