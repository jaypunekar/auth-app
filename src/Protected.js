import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './components/UserProfile';
import ChatBot from './components/ChatBot';
import './Protected.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProtectedPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user_info');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/verify-token/${token}`);
        if (!response.ok) {
          throw new Error('Token verification failed');
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_info');
        navigate('/');
      }
    };

    verifyToken();
  }, [navigate]);

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="protected-container">
      <header className="protected-header">
        <h1 className="app-title">adTask</h1>
        <UserProfile userInfo={userInfo} />
      </header>
      
      <div className="chatbot-container">
        <ChatBot />
      </div>
    </div>
  );
}

export default ProtectedPage;
