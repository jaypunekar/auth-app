import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ChatBot.css';

const API_URL = process.env.REACT_APP_API_URL;

const INITIAL_DESCRIPTION = [
  {
    text: `# Welcome to AdTask AI Chatbot


Hi, I’m AdTask AI, your digital marketing assistant. I’ll ask a few quick questions to understand your goals and provide tailored strategies across ads, social media, SEO, and more.

Let’s start! Tell me about your business?`,
    isUser: false,
    isDescription: true
  }
];

const ChatBot = () => {
  const [messages, setMessages] = useState(INITIAL_DESCRIPTION);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/init-chat`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setThreadId(response.data.thread_id);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const response = await axios.post(`${API_URL}/api/chat`, 
        { text: userMessage },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setMessages(prev => [...prev, { text: response.data.message, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        text: "I didn't quite get it. Can you please rephrase.", 
        isUser: false,
        isError: false
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