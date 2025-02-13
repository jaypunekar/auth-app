import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css';

const API_URL = process.env.REACT_APP_API_URL;

interface Message {
  text: string;
  isUser: boolean;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize chat when component mounts
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/init-chat`);
      setThreadId(response.data.thread_id);
      if (response.data.message) {
        setMessages([{ text: response.data.message, isUser: false }]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, { text: userMessage });
      setMessages(prev => [...prev, { text: response.data.message, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.isUser ? 'user' : 'assistant'}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot; 