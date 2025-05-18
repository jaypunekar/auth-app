import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Box, Button, TextField, Typography, Paper, CircularProgress, 
  Tabs, Tab, IconButton, Menu, MenuItem, ListItemText, Divider,
  Chip, Collapse, Card, CardContent, List, ListItem, ListItemButton,
  ListItemIcon, Drawer, CardMedia, CardActions, Link
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import MessageFeedback from './Chat/MessageFeedback';

const WebSocketChat = () => {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const webSocketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  const lastSessionIdRef = useRef({});
  const [previousSessions, setPreviousSessions] = useState([]);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // CSS for the pulsing animation
  const pulseAnimation = `
    @keyframes pulse {
      0% {
        transform: translateX(-50%) scale(0.8);
        opacity: 0.5;
      }
      50% {
        transform: translateX(-50%) scale(1.2);
        opacity: 1;
      }
      100% {
        transform: translateX(-50%) scale(0.8);
        opacity: 0.5;
      }
    }
  `;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get active session data
  const activeSession = sessions && sessions[activeSessionIndex] ? sessions[activeSessionIndex] : null;

  // Ensure sessions is always an array
  useEffect(() => {
    if (!sessions) {
      console.log('Initializing empty sessions array');
      setSessions([]);
    }
  }, [sessions]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, activeSession?.currentStreamedMessage]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!token) return;

    // Create WebSocket connection with proper protocol detection
    // Determine if we should use secure WebSockets (wss://) based on current protocol
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss://' : 'ws://';
    const defaultWsUrl = isSecure ? 'wss://dev.adtask.ai' : 'ws://localhost:8000';
    
    const wsUrl = `${process.env.REACT_APP_WS_URL || defaultWsUrl}/api/ws-chat/ws/${token}`;
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      webSocketRef.current = ws;

      // Connection opened
      ws.onopen = () => {
        console.log('WebSocket Connected Successfully');
        setConnected(true);
        
        // Initialize sessions array with an empty array if it's undefined
        if (!sessions || sessions.length === 0) {
          setSessions([]);
          // Request previous sessions automatically
          setIsLoadingPrevious(true);
          fetchPreviousSessions();
        }
      };

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timed out');
          setConnected(false);
          
          // Add error message for users
          setSessions(prev => {
            if (!prev || prev.length === 0) {
              return [{
                sessionId: 'error-session',
                name: 'Connection Error',
                messages: [{
                  role: 'system',
                  content: 'Could not connect to the chat server. This might be due to network issues or server maintenance. Please try refreshing the page or try again later.'
                }],
                isError: true
              }];
            }
            return prev;
          });
        }
      }, 10000); // 10 second timeout

      // Listen for messages
      ws.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          let data;
          
          try {
            data = JSON.parse(event.data);
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError);
            console.log('Attempting to handle as non-JSON message');
            data = { type: 'text', content: event.data };
          }
          
          console.log('Parsed WebSocket message:', data);
          
          // Handle previous_sessions message
          if (data.type === 'previous_sessions') {
            console.log('Received previous sessions:', data.content);
            handlePreviousSessions(data.content);
            return;
          }
          
          // Handle session_continued message
          if (data.type === 'session_continued') {
            console.log('Received session_continued message:', data.content);
            handleSessionContinued(data.content);
            return;
          }
          
          // Handle session_created specially as it doesn't have a session ID yet
          if (data.type === 'session_created') {
            console.log('Received session_created message, calling handleSessionCreated');
            handleSessionCreated(data);
            return;
          }

          // Check if this is a stream message with embedded session_id
          if (data.word && data.session_id) {
            console.log('Received streaming word with session_id:', data.session_id);
            // Convert to our internal message format
            data = {
              type: 'stream',
              content: data.word,
              session_id: data.session_id
            };
          }

          // We need to track which session responses belong to
          // First look for session_id in the message itself
          const messageType = data.type || '';
          let sessionId = data.session_id || '';
          
          // If the message doesn't have a session_id but we have a typing session, associate with it
          if (!sessionId && lastSessionIdRef.current['typing_session']) {
            // For stream-related messages, associate with the active typing session
            if (['stream', 'stream_end'].includes(messageType)) {
              sessionId = lastSessionIdRef.current['typing_session'];
              console.log(`No session_id in ${messageType} message, using typing session: ${sessionId}`);
            }
          }
          
          // If still no session ID, try the previous message type associations
          if (!sessionId && messageType) {
            // For message types like 'processing_started', 'stream', 'stream_end' that are part of a conversation
            if (['processing_started', 'stream', 'stream_end', 'error', 'additional_data'].includes(messageType)) {
              // Use the last known session ID for this message type
              sessionId = lastSessionIdRef.current[messageType];
              if (sessionId) {
                console.log(`Using last known ID for type ${messageType}: ${sessionId}`);
              }
            }
          }
          
          // Last resort: use current active session
          if (!sessionId && activeSession?.sessionId) {
            sessionId = activeSession.sessionId;
            console.log(`No session ID found in message or tracking, using active session: ${sessionId}`);
          }
          
          // Save this session ID for future messages of this type
          if (sessionId && messageType) {
            lastSessionIdRef.current[messageType] = sessionId;
            console.log(`Saved ${sessionId} as last ID for message type ${messageType}`);
          }
          
          // Add the session_id to the message object for downstream handling
          data.session_id = sessionId;
          
          // Extract session_id from the response if available
          if (sessionId) {
            // Find the session with matching ID
            console.log(`Looking for session with ID: ${sessionId}`);
            setSessions(prevSessions => {
              // Find the session with this ID
              const sessionIndex = prevSessions.findIndex(s => s.sessionId === sessionId);
              
              if (sessionIndex !== -1) {
                console.log(`Found session at index ${sessionIndex} for session_id ${sessionId}`);
                // Create a new array to avoid modifying state directly
                const updatedSessions = [...prevSessions];
                // Update this specific session with the message
                updatedSessions[sessionIndex] = handleMessageForSession(data, updatedSessions[sessionIndex]);
                
                // If this is a new message (not just streaming), auto-switch to this session if it's not the active one
                // This ensures messages appear in their respective chats visually
                if (data.type === 'processing_started' && sessionIndex !== activeSessionIndex) {
                  console.log(`Auto-switching to session ${sessionIndex} for incoming message`);
                  setTimeout(() => {
                    setActiveSessionIndex(sessionIndex);
                  }, 50);
                }
                
                return updatedSessions;
              } else {
                console.error(`No session found with ID ${sessionId}`);
                return prevSessions;
              }
            });
          } else {
            // Fallback to using active session (legacy approach)
            console.log('No session_id in response, using activeSessionIndex:', activeSessionIndex);
            if (activeSessionIndex !== -1) {
              handleSessionMessage(data, activeSessionIndex);
            } else {
              console.error('Received message for unknown session:', data);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      // Handle WebSocket errors
      ws.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        if (token) {
          console.log('Token used for connection (first 10 chars):', token.substring(0, 10) + '...');
          console.log('Attempted connection URL:', wsUrl);
        } else {
          console.error('No authentication token available!');
        }
        setConnected(false);
        
        // Clear the timeout if we got an error
        clearTimeout(connectionTimeout);
      };

      // Handle WebSocket close
      ws.onclose = (event) => {
        console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
        setConnected(false);
        
        // Clear the timeout if connection closed
        clearTimeout(connectionTimeout);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      console.error('Attempted connection URL:', wsUrl);
      setConnected(false);
    }

    // Clean up WebSocket connection when component unmounts
    return () => {
      if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
        webSocketRef.current.close();
      }
    };
  }, [token]);

  // Update the createNewSession function to include a timeout for loading state
  const createNewSession = () => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot create new session');
      return;
    }

    console.log('Creating new chat session');
    
    // Generate temporary ID for tracking
    const tempId = `temp-${Date.now()}`;
    
    // Create a temporary placeholder for the new session
    const tempSession = {
      sessionId: null,
      tempId: tempId, // Add a temporary ID for tracking
      name: `Chat ${sessions.length + 1}`,
      messages: [],
      isLoading: true
    };
    
    // Add the temporary session
    setSessions(prevSessions => {
      // Create a new array to avoid modifying state directly
      const newSessions = [...prevSessions, tempSession];
      // Switch to the new session immediately
      setActiveSessionIndex(newSessions.length - 1);
      return newSessions;
    });
    
    // Send the create_session message
    webSocketRef.current.send(JSON.stringify({
      action: 'create_session'
    }));

    // Failsafe: Clear loading state after 5 seconds if no response
    setTimeout(() => {
      setSessions(prevSessions => {
        // Find the temp session
        const index = prevSessions.findIndex(s => s.tempId === tempId && s.isLoading);
        if (index === -1) return prevSessions; // Already handled

        // Clone the sessions array
        const updatedSessions = [...prevSessions];
        
        // If the session is still loading, create a proper session
        if (updatedSessions[index].isLoading) {
          console.log('Timeout reached for session creation, clearing loading state');
          updatedSessions[index] = {
            ...updatedSessions[index],
            sessionId: tempId, // Use the tempId as a sessionId
            isLoading: false,
            messages: [{ 
              role: 'system', 
              content: 'A new chat session has been created. Type your message to begin.'
            }]
          };
        }
        
        return updatedSessions;
      });
    }, 5000);
  };

  // Update the handleSessionCreated function to properly clear loading state
  const handleSessionCreated = (data) => {
    console.log('Handling session_created response:', data);
    
    try {
      const sessionData = JSON.parse(data.content);
      console.log('Parsed session data:', sessionData);
      
      const sessionId = sessionData.session_id;
      const welcomeMessage = sessionData.message;
      
      if (!sessionId) {
        console.error('Missing session_id in response');
        return;
      }
      
      setSessions(prevSessions => {
        console.log('Current sessions before updating with new session ID:', prevSessions);
        
        if (!prevSessions || !Array.isArray(prevSessions)) {
          console.error('prevSessions is not valid:', prevSessions);
          return prevSessions || [];
        }
        
        const updatedSessions = [...prevSessions];
        
        // Find any pending session without a sessionId
        const pendingSessionIndex = updatedSessions.findIndex(s => !s.sessionId);
        
        console.log('Pending session index:', pendingSessionIndex);
        
        if (pendingSessionIndex !== -1) {
          // Update the pending session with its ID and welcome message
          updatedSessions[pendingSessionIndex] = {
            ...updatedSessions[pendingSessionIndex],
            sessionId,
            tempId: null, // Clear tempId
            name: `Chat ${pendingSessionIndex + 1}`,
            messages: [{ role: 'assistant', content: welcomeMessage }],
            isTyping: false,
            isLoading: false, // Explicitly set isLoading to false
            currentStreamedMessage: ''
          };
          
          // Make this the active session
          setTimeout(() => {
            setActiveSessionIndex(pendingSessionIndex);
          }, 50);
          
          console.log('Updated existing pending session with ID:', sessionId);
        } else {
          // If we somehow don't have a pending session, create a new one
          const newSession = {
            sessionId,
            name: `Chat ${prevSessions.length + 1}`,
            messages: [{ role: 'assistant', content: welcomeMessage }],
            isTyping: false,
            isLoading: false, // Set isLoading to false
            currentStreamedMessage: ''
          };
          updatedSessions.push(newSession);
          
          // Make this the active session
          const newIndex = updatedSessions.length - 1;
          setTimeout(() => {
            setActiveSessionIndex(newIndex);
          }, 50);
          
          console.log('Created new session because no pending session was found:', sessionId);
        }
        
        console.log('Final updated sessions after setting session ID:', updatedSessions);
        return updatedSessions;
      });
    } catch (error) {
      console.error('Error handling session created:', error);
      
      // Fallback: If there's an error, still update any pending sessions
      setSessions(prevSessions => {
        const updatedSessions = [...prevSessions];
        const pendingIndex = updatedSessions.findIndex(s => !s.sessionId && s.isLoading);
        
        if (pendingIndex !== -1) {
          updatedSessions[pendingIndex] = {
            ...updatedSessions[pendingIndex],
            sessionId: `fallback-${Date.now()}`,
            isLoading: false,
            messages: [{ 
              role: 'system', 
              content: 'Chat session created. There was an issue with the server response.'
            }]
          };
        }
        
        return updatedSessions;
      });
    }
  };

  // Process message for a specific session without modifying state
  const handleMessageForSession = (data, session) => {
    if (!session) {
      console.error('Invalid session in handleMessageForSession');
      return session;
    }

    console.log(`Processing message for session ${session.sessionId} (active: ${session.sessionId === (sessions[activeSessionIndex]?.sessionId ? 'yes' : 'no')}):`, data);

    // Create a copy of the session to modify
    const updatedSession = { ...session };
    
    // Ensure messages array exists
    if (!updatedSession.messages) {
      updatedSession.messages = [];
    }
    
    // Ensure toolCalls array exists
    if (!updatedSession.toolCalls) {
      updatedSession.toolCalls = [];
    }
    
    switch (data.type) {
      case 'processing_started':
        updatedSession.isTyping = true;
        updatedSession.currentStreamedMessage = '';
        console.log(`Session ${session.sessionId} now in typing state`);
        
        // Set this as the active typing session - important for tracking responses
        lastSessionIdRef.current['typing_session'] = session.sessionId;
        break;
        
      case 'tool_calls_started':
        try {
          const toolInfo = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          console.log('Tool calls started, raw object:', toolInfo);
          
          // Safely extract tool calls
          const toolCalls = toolInfo.tool_calls || [];
          updatedSession.isProcessingToolCalls = true;
          
          // Use a more defensive approach to extract function names
          updatedSession.currentToolCalls = toolCalls.map(tool => {
            // Log the actual structure of each tool
            console.log('Tool object structure:', JSON.stringify(tool));
            
            // Check for function name in various possible locations
            const functionName = tool.function?.name || 
                                tool.function || 
                                tool.name || 
                                (typeof tool.function === 'object' ? 
                                  tool.function.name || 'unknown function' : 
                                  'unknown function');
            
            return {
              ...tool,
              function: functionName, // Make sure we store the name directly
              status: 'processing'
            };
          });
          
          // Create a message that includes the names of the functions being called
          const functionNames = updatedSession.currentToolCalls
            .map(tool => `"${tool.function}"`)
            .filter(name => name !== '"unknown function"' && name !== '"undefined"')
            .join(', ');
          
          // Add system message for tool calls started with function names
          updatedSession.messages = [
            ...updatedSession.messages,
            { 
              role: 'system', 
              content: `🔧 Processing tools: ${functionNames || 'function calls'}`, 
              toolCallsStart: true 
            }
          ];
          console.log(`Started processing tool calls for session ${session.sessionId}`, toolInfo);
        } catch (error) {
          console.error('Error handling tool_calls_started:', error);
        }
        break;
        
      case 'tool_call_completed':
        try {
          const completionInfo = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          console.log('Tool call completed, raw data:', completionInfo);
          
          // Update the status of this specific tool call
          if (updatedSession.currentToolCalls) {
            updatedSession.currentToolCalls = updatedSession.currentToolCalls.map(tool => {
              // Check if this is the tool that completed
              const isCompletedTool = tool.id === completionInfo.tool_call_id;
              
              // If this is the completed tool, update the function name if needed
              if (isCompletedTool && completionInfo.function) {
                // We got a clear function name from the completion info
                return { ...tool, status: 'completed', function: completionInfo.function };
              }
              
              return isCompletedTool ? { ...tool, status: 'completed' } : tool;
            });

            // Add completed function name to system messages if it's not an image generation
            const completedTool = updatedSession.currentToolCalls.find(
              tool => tool.id === completionInfo.tool_call_id
            );
            
            if (completedTool) {
              const functionName = completedTool.function || completionInfo.function || 'unknown function';
              
              // Only add message if we have a valid function name and it's not image generation
              if (functionName !== 'unknown function' && 
                  functionName !== 'undefined' && 
                  functionName !== 'generate_image') {
                updatedSession.messages = [
                  ...updatedSession.messages,
                  { 
                    role: 'system', 
                    content: `✅ Function "${functionName}" completed`, 
                    toolCallComplete: true 
                  }
                ];
              }
            }
          }
          console.log(`Tool call completed for session ${session.sessionId}`, completionInfo);
          
          // Check if credit information was included (for image generation)
          if (completionInfo.credits_remaining !== undefined) {
            console.log(`Credits remaining: ${completionInfo.credits_remaining}`);
            
            // Trigger refresh in any CreditDisplay components
            // Use CustomEvent to communicate with other components
            const creditUpdateEvent = new CustomEvent('credits-updated', { 
              detail: { credits: completionInfo.credits_remaining } 
            });
            document.dispatchEvent(creditUpdateEvent);
            
            // Add user message about credit usage
            if (completionInfo.function === 'generate_image') {
              updatedSession.messages = [
                ...updatedSession.messages,
                { 
                  role: 'system', 
                  content: `2 credits used for image generation. ${completionInfo.credits_remaining} credits remaining.`, 
                  isCredit: true 
                }
              ];
            }
          }
        } catch (error) {
          console.error('Error handling tool_call_completed:', error);
        }
        break;
        
      case 'tool_calls_completed':
        updatedSession.isProcessingToolCalls = false;
        
        // Create a summary of all completed tool calls
        let toolSummary = "";
        if (updatedSession.currentToolCalls && updatedSession.currentToolCalls.length > 0) {
          const validTools = updatedSession.currentToolCalls.filter(
            tool => tool.function && tool.function !== 'undefined' && tool.function !== 'unknown function'
          );
          
          if (validTools.length > 0) {
            const functionNames = validTools.map(tool => `"${tool.function}"`);
            toolSummary = functionNames.join(', ');
          }
        }
        
        // Keep the completed tool calls in the history
        updatedSession.toolCalls = [...(updatedSession.toolCalls || []), ...(updatedSession.currentToolCalls || [])];
        updatedSession.currentToolCalls = [];
        
        // Add system message for tool calls completed with function names
        updatedSession.messages = [
          ...updatedSession.messages,
          { 
            role: 'system', 
            content: `✅ All tools completed${toolSummary ? ': ' + toolSummary : ''}`, 
            toolCallsEnd: true 
          }
        ];
        console.log(`All tool calls completed for session ${session.sessionId}`);
        break;
      
      case 'stream':
        // Parse the content if it's JSON and extract the word
        let wordToAdd = data.content;
        try {
          // Check if the content is in JSON format with session_id
          if (typeof data.content === 'string' && 
              (data.content.trim().startsWith('{') || data.content.includes('session_id'))) {
            try {
              const parsedContent = JSON.parse(data.content);
              if (parsedContent.word) {
                wordToAdd = parsedContent.word;
              }
            } catch (jsonError) {
              // Handle the case where it looks like JSON but isn't valid
              console.warn(`Content looks like JSON but couldn't be parsed: ${jsonError.message}`);
            }
          }
        } catch (error) {
          console.warn(`Failed to parse stream content: ${error.message}`);
          // Continue with original content if parsing fails
        }
        
        // Remove any remaining JSON-like artifacts from the word
        if (typeof wordToAdd === 'string') {
          // Clean up common JSON artifacts
          wordToAdd = wordToAdd
            .replace(/^\{"session_id":"[^"]*","word":"|"\}$/g, '')  // Remove JSON wrappers
            .replace(/\\"/g, '"');  // Unescape quotes
        }
        
        // Append to the current streamed message
        updatedSession.currentStreamedMessage = (updatedSession.currentStreamedMessage || '') + wordToAdd;
        console.log(`Added streaming content to session ${session.sessionId}, length now: ${updatedSession.currentStreamedMessage.length}`);
        break;
      
      case 'stream_end':
        // Important: Add the streamed message to the permanent messages array
        if (updatedSession.currentStreamedMessage) {
          updatedSession.messages = [
            ...updatedSession.messages,
            { role: 'assistant', content: updatedSession.currentStreamedMessage || '' }
          ];
          console.log(`Added complete message to session ${session.sessionId}, message count: ${updatedSession.messages.length}`);
        } else {
          console.warn(`No streamed content to add for session ${session.sessionId}`);
        }
        updatedSession.isTyping = false;
        break;
      
      case 'error':
        updatedSession.messages = [
          ...updatedSession.messages,
          { role: 'system', content: `Error: ${data.content}` }
        ];
        updatedSession.isTyping = false;
        console.log(`Added error message to session ${session.sessionId}`);
        break;
      
      case 'additional_data':
        // Handle additional data
        console.log(`Additional data received for session ${session.sessionId}:`, data.content);
        break;
      
      default:
        console.log(`Unknown message type for session ${session.sessionId}: ${data.type}`);
    }
    
    return updatedSession;
  };

  // Utility function to clean up messages with potential JSON formatting issues
  const cleanupMessage = (message) => {
    if (!message || typeof message !== 'string') return message;
    
    // Try to detect if this is a JSON string and extract content
    if (message.trim().startsWith('{') && message.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(message);
        // If it has content or message field, use that
        if (parsed.content) return parsed.content;
        if (parsed.message) return parsed.message;
        if (parsed.word) return parsed.word;
      } catch (e) {
        // Not valid JSON, continue with original cleaning
      }
    }
    
    // Clean up JSON artifacts that might have slipped through
    return message
      .replace(/\{"session_id":"[^"]*","word":"([^"]*)"\}/g, '$1') // Extract word from JSON
      .replace(/\\\"/g, '"') // Fix escaped quotes
      .replace(/\\n/g, '\n') // Handle newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  // Add a new utility function to process message content for images
  const processMessageContent = (content) => {
    if (!content || typeof content !== 'string') return { text: content, images: [] };
    
    // Process Google Drive links: [text](https://drive.google.com/file/d/ID/...)
    const driveImagePattern = /\[(.*?)\]\((https:\/\/drive\.google\.com\/file\/d\/(.*?)\/.*?)\)/g;
    const images = [];
    let lastIndex = 0;
    let processedText = '';
    let match;
    
    // Find all image links in the message
    while ((match = driveImagePattern.exec(content)) !== null) {
      const [fullMatch, altText, url, fileId] = match;
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
      
      // Add text before the image
      processedText += content.substring(lastIndex, match.index);
      
      // Add a placeholder for the image
      processedText += `[IMAGE:${images.length}]`;
      
      // Save the image info
      images.push({
        altText,
        url,
        thumbnailUrl,
        fileId
      });
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Add any remaining text
    processedText += content.substring(lastIndex);
    
    return { text: processedText, images };
  };

  // Add an ImageCard component to display images
  const ImageCard = ({ image }) => {
    return (
      <Card sx={{ maxWidth: 400, my: 2, mx: 'auto' }}>
        <CardMedia
          component="img"
          image={image.thumbnailUrl}
          alt={image.altText}
          sx={{ height: 250, objectFit: 'contain' }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {image.altText}
          </Typography>
        </CardContent>
        <CardActions>
          <Button 
            size="small" 
            startIcon={<OpenInNewIcon />}
            href={image.url} 
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </Button>
          <Button 
            size="small" 
            startIcon={<FileDownloadIcon />}
            href={`https://drive.google.com/uc?export=download&id=${image.fileId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </Button>
        </CardActions>
      </Card>
    );
  };

  // Add markdown styling
  const markdownStyles = {
    // Custom markdown rendering styles
    container: {
      width: '100%',
      '& p': {
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      },
      '& h1, & h2, & h3, & h4, & h5, & h6': {
        marginTop: '1rem',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
      },
      '& h1': { fontSize: '1.7rem' },
      '& h2': { fontSize: '1.5rem' },
      '& h3': { fontSize: '1.3rem' },
      '& h4': { fontSize: '1.1rem' },
      '& h5': { fontSize: '1rem' },
      '& h6': { fontSize: '0.9rem' },
      '& ul, & ol': {
        paddingLeft: '1.5rem',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      },
      '& li': {
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
      },
      '& code': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '0.2rem 0.3rem',
        borderRadius: '3px',
        fontFamily: 'monospace',
        fontSize: '0.85em',
      },
      '& pre': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '0.75rem',
        borderRadius: '4px',
        overflow: 'auto',
        '& code': {
          backgroundColor: 'transparent',
          padding: 0,
        },
      },
      '& blockquote': {
        borderLeft: '3px solid rgba(0, 0, 0, 0.2)',
        paddingLeft: '1rem',
        marginLeft: '0.5rem',
        color: 'rgba(0, 0, 0, 0.7)',
      },
      '& a': {
        color: 'primary.main',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
      '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      },
      '& th, & td': {
        border: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        textAlign: 'left',
      },
      '& th': {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontWeight: 'bold',
      },
      '& img': {
        maxWidth: '100%',
        borderRadius: '4px',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      },
      '& hr': {
        border: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        margin: '1rem 0',
      },
    },
  };

  // Update the renderMessageContent function
  const renderMessageContent = (content) => {
    const cleanedContent = cleanupMessage(content);
    const { text, images } = processMessageContent(cleanedContent);
    
    // Define components for markdown rendering
    const components = {
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
          <SyntaxHighlighter
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
    };
    
    if (images.length === 0) {
      // If no images, render markdown with GitHub Flavored Markdown support
      return (
        <Box sx={markdownStyles.container}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {cleanedContent}
          </ReactMarkdown>
        </Box>
      );
    }
    
    // If there are images, render the text with image cards inserted
    const parts = text.split(/\[IMAGE:(\d+)\]/);
    
    return (
      <Box sx={markdownStyles.container}>
        {parts.map((part, index) => {
          // Even indices are text
          if (index % 2 === 0) {
            return part ? (
              <ReactMarkdown
                key={`text-${index}`}
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {part}
              </ReactMarkdown>
            ) : null;
          } 
          // Odd indices are image placeholders with the image index
          else {
            const imageIndex = parseInt(part, 10);
            return <ImageCard key={`image-${imageIndex}`} image={images[imageIndex]} />;
          }
        })}
      </Box>
    );
  };

  // Tool Call Display Component
  const ToolCallDisplay = ({ toolCall }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Get a safe function name
    const getFunctionName = () => {
      if (!toolCall) return 'Unknown Function';
      
      const functionName = toolCall.function || 
                          (toolCall.function_call?.name) || 
                          (typeof toolCall.function === 'object' ? 
                            toolCall.function.name : 'Unknown Function');
                            
      return functionName === 'undefined' ? 'Unknown Function' : functionName;
    };
    
    const getStatusIcon = () => {
      if (toolCall.status === 'completed') {
        return <CheckCircleOutlineIcon fontSize="small" color="success" />;
      } else if (toolCall.status === 'processing') {
        return <CircularProgress size={16} />;
      } else if (toolCall.status === 'error') {
        return <ErrorOutlineIcon fontSize="small" color="error" />;
      } else {
        return null;
      }
    };
    
    const toggleExpanded = () => {
      setExpanded(!expanded);
    };
    
    const functionName = getFunctionName();
    
    const functionNameStyle = {
      fontWeight: toolCall.status === 'processing' ? 'bold' : 'normal',
      color: toolCall.status === 'processing' ? '#1976d2' : 'inherit',
      fontSize: toolCall.status === 'processing' ? '0.95rem' : '0.875rem'
    };
    
    return (
      <Card variant="outlined" sx={{ 
        mb: 1, 
        backgroundColor: toolCall.status === 'processing' 
          ? 'rgba(25, 118, 210, 0.08)' 
          : 'rgba(0,0,0,0.03)',
        borderLeft: toolCall.status === 'processing' 
          ? '3px solid #1976d2' 
          : '1px solid rgba(0,0,0,0.12)'
      }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon fontSize="small" color={toolCall.status === 'processing' ? 'primary' : 'action'} />
              <Typography variant="subtitle2">
                {toolCall.status === 'processing' ? 'Calling function: ' : 'Function: '}
                <span style={functionNameStyle}>
                  {functionName}
                </span>
              </Typography>
              <Chip 
                size="small" 
                label={toolCall.status} 
                color={toolCall.status === 'completed' ? 'success' : 'primary'}
                icon={getStatusIcon()}
                sx={{ 
                  height: 20, 
                  fontSize: '0.7rem',
                  fontWeight: toolCall.status === 'processing' ? 'bold' : 'normal'
                }}
              />
            </Box>
            <IconButton size="small" onClick={toggleExpanded}>
              <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
            </IconButton>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.7rem' }}>
                {typeof toolCall.arguments === 'string' 
                  ? toolCall.arguments
                  : JSON.stringify(toolCall.arguments || {}, null, 2)}
              </Typography>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // Render session-specific content
  const renderSessionContent = (session) => {
    // If this is a "New Chat" placeholder, show button to create new session
    if (session?.isNew) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            p: 3 
          }}
        >
          <Typography variant="h6" gutterBottom>Start a New Conversation</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={createNewSession}
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
          >
            New Chat
          </Button>
        </Box>
      );
    }

    // Display previous sessions if no active session selected
    if (!session?.sessionId || session.isLoading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            p: 3 
          }}
        >
          <CircularProgress size={40} sx={{ mb: 3 }} />
          <Typography variant="body1">Loading conversation...</Typography>
        </Box>
      );
    }

    const renderToolCalls = (toolCalls) => {
      if (!toolCalls || toolCalls.length === 0) return null;
      
      return (
        <Box sx={{ my: 1 }}>
          {toolCalls.map((toolCall, index) => (
            <ToolCallDisplay key={index} toolCall={toolCall} />
          ))}
        </Box>
      );
    };
    
    return (
      <>
        {session.messages && session.messages.map((msg, index) => (
          <Box 
            key={index} 
            sx={{ 
              p: 1, 
              mb: 1,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.toolCallsStart || msg.toolCallsEnd || msg.toolCallComplete ? '95%' : '80%',
              backgroundColor: msg.role === 'user' 
                ? 'primary.light' 
                : msg.toolCallsStart 
                  ? 'rgba(25, 118, 210, 0.08)'  // Light blue for tool call start
                  : msg.toolCallComplete
                    ? 'rgba(76, 175, 80, 0.08)'  // Light green for completed tool call
                    : msg.toolCallsEnd
                      ? 'rgba(76, 175, 80, 0.12)'  // Slightly darker green for all tools completed
                      : 'grey.100',
              borderRadius: 2,
              color: msg.role === 'user' ? 'white' : 'text.primary',
              width: msg.toolCallsStart ? '95%' : 'auto',
              borderLeft: msg.toolCallsStart 
                ? '3px solid rgba(25, 118, 210, 0.5)'  // Blue border for tool calls start
                : msg.toolCallComplete
                  ? '3px solid rgba(76, 175, 80, 0.5)'  // Green border for completed tool call
                  : msg.toolCallsEnd
                    ? '3px solid rgba(76, 175, 80, 0.7)'  // Darker green border for all tools completed
                    : 'none'
            }}
          >
            {renderMessageContent(msg.content)}
            
            {/* Show tool calls if this message started tool calls processing */}
            {msg.toolCallsStart && session.currentToolCalls && renderToolCalls(session.currentToolCalls)}
            
            {/* Add message feedback for assistant messages only */}
            {msg.role === 'assistant' && msg.id && (
              <MessageFeedback messageId={msg.id} sessionId={session.sessionId} />
            )}
          </Box>
        ))}
        
        {/* Show current tool calls being processed if any */}
        {session.isProcessingToolCalls && session.currentToolCalls && !session.messages.some(m => m.toolCallsStart) && (
          <Box 
            sx={{ 
              p: 1, 
              mb: 1,
              alignSelf: 'flex-start',
              maxWidth: '95%',
              width: '95%',
              backgroundColor: 'rgba(25, 118, 210, 0.08)', // Light blue background
              borderRadius: 2,
              borderLeft: '3px solid #1976d2' // Blue left border
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
              Processing function calls:
            </Typography>
            {renderToolCalls(session.currentToolCalls)}
          </Box>
        )}
        
        {/* Show the streaming message */}
        {session.isTyping && session.currentStreamedMessage && (
          <Box sx={{ 
            p: 1, 
            mb: 1,
            alignSelf: 'flex-start',
            maxWidth: '80%',
            backgroundColor: 'grey.100',
            borderRadius: 2
          }}>
            {renderMessageContent(session.currentStreamedMessage)}
          </Box>
        )}
        
        {/* Show typing indicator */}
        {session.isTyping && !session.currentStreamedMessage && !session.isProcessingToolCalls && (
          <Box sx={{ 
            p: 1, 
            mb: 1,
            alignSelf: 'flex-start',
            maxWidth: '80%',
            backgroundColor: 'grey.100',
            borderRadius: 2
          }}>
            <CircularProgress size={20} />
          </Box>
        )}
      </>
    );
  };

  // Original handle message function (now primarily used for legacy messages without session_id)
  const handleSessionMessage = (data, sessionIndex) => {
    setSessions(prevSessions => {
      // Safety check for prevSessions
      if (!prevSessions || !Array.isArray(prevSessions) || !prevSessions[sessionIndex]) {
        console.error('Invalid sessions state in handleSessionMessage');
        return prevSessions || [];
      }

      const updatedSessions = [...prevSessions];
      // Use the new handler function to keep logic consistent
      updatedSessions[sessionIndex] = handleMessageForSession(data, updatedSessions[sessionIndex]);
      return updatedSessions;
    });
  };

  // Send a message through WebSocket
  const sendMessage = () => {
    if (!inputMessage.trim() || !activeSession?.sessionId || !connected) return;
    
    const sessionId = activeSession.sessionId;
    const message = {
      action: 'send_message',
      session_id: sessionId,
      message: inputMessage
    };
    
    console.log(`Sending message to session ${sessionId}:`, message);
    
    // Store this session ID as the last used for ALL response message types
    // This ensures all related responses go to the correct session
    lastSessionIdRef.current['processing_started'] = sessionId;
    lastSessionIdRef.current['stream'] = sessionId;
    lastSessionIdRef.current['stream_end'] = sessionId;
    lastSessionIdRef.current['error'] = sessionId;
    lastSessionIdRef.current['additional_data'] = sessionId;
    lastSessionIdRef.current['current_session'] = sessionId;
    
    // Add user message to the session
    setSessions(prevSessions => {
      // Safety check
      if (!prevSessions || !Array.isArray(prevSessions) || !prevSessions[activeSessionIndex]) {
        console.error('Invalid sessions state in sendMessage');
        return prevSessions || [];
      }

      const updatedSessions = [...prevSessions];
      const updatedSession = {
        ...updatedSessions[activeSessionIndex],
        messages: [
          ...(updatedSessions[activeSessionIndex].messages || []),
          { role: 'user', content: inputMessage }
        ]
      };
      updatedSessions[activeSessionIndex] = updatedSession;
      return updatedSessions;
    });
    
    // Send message through WebSocket
    webSocketRef.current.send(JSON.stringify(message));
    
    // Clear input field
    setInputMessage('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle tab change - Ensure messages don't mix between tabs
  const handleTabChange = (event, newValue) => {
    console.log(`Switching from session ${activeSessionIndex} to ${newValue}`);
    
    if (newValue === activeSessionIndex) {
      console.log("Already on this session, no need to switch");
      return;
    }
    
    // Store the current active session ID as reference
    if (sessions[activeSessionIndex]?.sessionId) {
      const currentSessionId = sessions[activeSessionIndex].sessionId;
      console.log(`Storing current session ID ${currentSessionId} for reference`);
      lastSessionIdRef.current['previous_session'] = currentSessionId;
    }
    
    // Update active session index
    setActiveSessionIndex(newValue);
    scrollToBottom();
    
    // Reset input message when switching sessions for clarity
    setInputMessage('');
    
    // If the new session has an ID, set it as the active session for future messages
    if (sessions[newValue]?.sessionId) {
      const newSessionId = sessions[newValue].sessionId;
      console.log(`Setting new session ID ${newSessionId} as active for future messages`);
      lastSessionIdRef.current['current_session'] = newSessionId;
      
      // Only update processing/stream states if there's no active conversation
      const session = sessions[newValue];
      if (!session.isTyping) {
        // If this session is not currently receiving messages, it's safe to update
        lastSessionIdRef.current['next_message'] = newSessionId;
      }
    }
  };

  // Get session tab style based on whether it's active and has unread messages
  const getSessionTabStyle = (index) => {
    const isActive = index === activeSessionIndex;
    const session = sessions[index];
    const isReceivingMessages = session?.sessionId === lastSessionIdRef.current['typing_session'];
    
    return {
      textTransform: 'none',
      minWidth: 100,
      maxWidth: 150,
      position: 'relative',
      fontWeight: isActive ? 'bold' : 'normal',
      color: isActive ? 'primary.main' : (isReceivingMessages ? 'secondary.main' : 'text.primary'),
      '&::after': session?.isTyping ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: isReceivingMessages ? 'secondary.main' : 'primary.main',
        animation: 'pulse 1.5s infinite'
      } : {}
    };
  };

  // Handle session menu open
  const handleSessionMenuOpen = (event) => {
    setSessionMenuAnchor(event.currentTarget);
  };

  // Handle session menu close
  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
  };

  // Rename session
  const renameSession = (index) => {
    // You could implement a dialog here
    const newName = prompt('Enter new name for the chat session:', sessions[index].name);
    if (newName && newName.trim()) {
      setSessions(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], name: newName.trim() };
        return updated;
      });
    }
    handleSessionMenuClose();
  };

  // Close session
  const closeSession = (index) => {
    if (sessions.length <= 1) {
      alert('Cannot close the only remaining session');
      return;
    }
    
    setSessions(prev => prev.filter((_, i) => i !== index));
    if (activeSessionIndex === index) {
      setActiveSessionIndex(0);
    } else if (activeSessionIndex > index) {
      setActiveSessionIndex(activeSessionIndex - 1);
    }
    handleSessionMenuClose();
  };

  const fetchPreviousSessions = () => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot fetch previous sessions');
      return;
    }

    console.log('Requesting previous sessions');
    webSocketRef.current.send(JSON.stringify({
      action: 'get_sessions'
    }));
  };

  const handlePreviousSessions = (data) => {
    try {
      const sessionsData = JSON.parse(data);
      console.log('Previous sessions data:', sessionsData);
      
      if (sessionsData && sessionsData.sessions && sessionsData.sessions.length > 0) {
        // Store previous sessions for display in sidebar
        setPreviousSessions(sessionsData.sessions);
      } else {
        // If no previous sessions, create a new session
        console.log('No previous sessions found, creating new session');
        createNewSession();
      }
      
      setIsLoadingPrevious(false);
    } catch (error) {
      console.error('Error parsing previous sessions:', error);
      createNewSession();
      setIsLoadingPrevious(false);
    }
  };

  const handleSessionContinued = (data) => {
    try {
      const sessionData = JSON.parse(data);
      console.log('Session continued data:', sessionData);
      
      if (sessionData && sessionData.session_id) {
        const messages = sessionData.messages || [];
        
        // Convert messages to the format expected by the component
        const formattedMessages = messages.map(msg => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        }));
        
        // Create a session object
        const session = {
          sessionId: sessionData.session_id,
          threadId: sessionData.thread_id,
          name: `Chat ${sessions.length + 1}`,
          messages: formattedMessages,
          isLoaded: true
        };
        
        // Add the session and make it active
        setSessions(prevSessions => {
          const newSessions = [...prevSessions, session];
          setActiveSessionIndex(newSessions.length - 1);
          return newSessions;
        });
      }
    } catch (error) {
      console.error('Error parsing continued session data:', error);
    }
  };
  
  const continueExistingSession = (sessionId) => {
    if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected, cannot continue session');
      return;
    }

    console.log(`Continuing session: ${sessionId}`);
    webSocketRef.current.send(JSON.stringify({
      action: 'continue_session',
      session_id: sessionId
    }));
  };

  // Add sidebar rendering for chat history
  const ChatSidebar = () => {
  return (
      <Box sx={{ width: 250, height: '100%', borderRight: 1, borderColor: 'divider' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            Chat History
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={createNewSession}
          >
            New
          </Button>
        </Box>
        
        <Divider />
        
        {isLoadingPrevious ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <List sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 150px)' }}>
            {previousSessions.length > 0 ? (
              previousSessions.map((session, index) => (
                <ListItem disablePadding key={index} 
                  sx={{
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <ListItemButton 
                    onClick={() => {
                      continueExistingSession(session.session_id);
                    }}
                    sx={{
                      py: 1,
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <HistoryIcon fontSize="small" />
                    </ListItemIcon>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography noWrap variant="body2" sx={{ fontWeight: 500 }}>
                        {session.first_message ? 
                          (session.first_message.length > 30 ? 
                            session.first_message.substring(0, 30) + '...' : 
                            session.first_message) : 
                          `Chat ${index + 1}`}
      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {session.last_updated ? 
                          new Date(session.last_updated).toLocaleDateString() : 
                          'Unknown date'}
                        {' · '}
                        {session.message_count || 0} msgs
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No previous chats found
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
      <style>{pulseAnimation}</style>
      
      {/* Chat History Sidebar */}
      <ChatSidebar />
      
      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
        {/* Session tabs at the top */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs 
          value={activeSessionIndex} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            flexGrow: 1,
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
            }
          }}
        >
          {sessions && sessions.map((session, index) => (
            <Tab 
              key={index} 
              label={
                <Box sx={{ 
                      position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center', 
                      maxWidth: '150px'
                    }}>
                      <Typography 
                        noWrap 
                        sx={{ 
                          maxWidth: '120px', 
                          display: 'inline-block',
                          fontSize: '0.875rem'
                        }}
                      >
                        {session.name || `Chat ${index + 1}`}
                      </Typography>
                      {session.isTyping && (
                        <Box 
                          sx={{ 
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                            bgcolor: 'primary.main',
                            ml: 1
                          }} 
                        />
                      )}
                </Box>
              }
              sx={getSessionTabStyle(index)}
            />
          ))}
        </Tabs>
            
        <IconButton 
              onClick={(e) => handleSessionMenuOpen(e)}
              sx={{ mr: 1 }}
              aria-label="session options"
        >
          <MoreVertIcon />
        </IconButton>
          </Box>
        </Box>
        
        {/* Session menu */}
        <Menu
          anchorEl={sessionMenuAnchor}
          open={Boolean(sessionMenuAnchor)}
          onClose={handleSessionMenuClose}
        >
          <MenuItem onClick={() => { handleSessionMenuClose(); createNewSession(); }}>
            <ListItemText primary="New Chat" />
          </MenuItem>
          {activeSession && !activeSession.isNew && (
            <>
              <Divider />
              <MenuItem onClick={() => { handleSessionMenuClose(); renameSession(activeSessionIndex); }}>
                <ListItemText primary="Rename Chat" />
          </MenuItem>
              <MenuItem onClick={() => { handleSessionMenuClose(); closeSession(activeSessionIndex); }}>
                <ListItemText primary="Close Chat" />
              </MenuItem>
            </>
          )}
        </Menu>
      
      {/* Messages area */}
      <Paper elevation={3} sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1,
        mb: 2,
        p: 2,
          maxHeight: 'calc(100vh - 220px)',
        overflowY: 'auto'
      }}>
        {activeSession ? (
          <>
            {renderSessionContent(activeSession)}
          </>
        ) : (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
            No active chat session. Create a new session to start chatting.
          </Typography>
        )}
        
        <div ref={messagesEndRef} />
      </Paper>
      
      {/* Input area */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!connected || !activeSession?.sessionId}
          multiline
          maxRows={4}
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained" 
          color="primary"
          endIcon={<SendIcon />}
          onClick={sendMessage}
          disabled={!connected || !activeSession?.sessionId || !inputMessage.trim()}
        >
          Send
        </Button>
      </Box>
      
      {!connected && (
        <Typography color="error" sx={{ mt: 2 }}>
          Not connected to chat server. Please refresh the page to try again.
        </Typography>
      )}
      </Box>
    </Box>
  );
};

export default WebSocketChat; 