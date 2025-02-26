import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ChatBot.css';

const API_URL = process.env.REACT_APP_API_URL;

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Get chat history when component mounts
    getChatHistory();
  }, []);

  const getChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const userInfo = JSON.parse(localStorage.getItem('user_info'));
      
      const response = await axios.get(`${API_URL}/api/chat-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.messages.length > 0) {
        setMessages(response.data.messages);
      } else {
        // If no history, show welcome message
        setMessages([{
          text: `# Welcome ${userInfo.first_name}! \n\nI'm AdTask AI, your digital marketing assistant. I'll help you create and manage your ad campaigns. What would you like to do today?`,
          isUser: false,
          isDescription: true
        }]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const MessageContent = ({ message }) => {
    if (message.isUser) {
      return <div className="message-text">{message.text}</div>;
    }
    return (
      <div className="message-text">
        <ReactMarkdown>{message.text}</ReactMarkdown>
      </div>
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setSending(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Sending message:', userMessage); // Debug log

      const response = await axios.post(
        `${API_URL}/api/chat`, 
        { text: userMessage },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Received response:', response.data); // Debug log

      // Handle the response
      const assistantMessage = response.data.message || response.data;
      setMessages(prev => [...prev, { 
        text: typeof assistantMessage === 'string' ? assistantMessage : assistantMessage.message,
        isUser: false 
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', error.response?.data); // Log error details
      
      const errorMessage = error.response?.data?.detail || "Server error. Please try again later.";
      setMessages(prev => [...prev, { 
        text: errorMessage,
        isUser: false,
        isError: true
      }]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">Initializing chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.isUser ? 'user' : 'assistant'} 
              ${message.isError ? 'error' : ''} 
              ${message.isDescription ? 'description' : ''}`}
          >
            <MessageContent message={message} />
          </div>
        ))}
        {sending && (
          <div className="message assistant typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={sending}
        />
        <button 
          onClick={sendMessage} 
          disabled={sending || !input.trim()}
          className={sending ? 'sending' : ''}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatBot; 