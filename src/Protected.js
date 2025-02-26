import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from './components/UserProfile';
import ChatBot from './components/ChatBot';
import Campaigns from './components/Campaigns';
import './Protected.css';

const API_URL = process.env.REACT_APP_API_URL;

function ProtectedPage() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [showCampaigns, setShowCampaigns] = useState(false);

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

  const handleViewCampaigns = () => {
    console.log('Opening campaigns modal'); // Debug log
    setShowCampaigns(true);
  };

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <div className="protected-container">
      <header className="protected-header">
        <h1 className="app-title">adTask</h1>
        <div className="header-actions">
          <button 
            className="view-campaigns-btn"
            onClick={handleViewCampaigns}
          >
            View Campaigns
          </button>
          <UserProfile userInfo={userInfo} />
        </div>
      </header>
      
      <div className="chatbot-container">
        <ChatBot />
      </div>

      {showCampaigns && (
        <Campaigns 
          onClose={() => {
            console.log('Closing campaigns modal'); // Debug log
            setShowCampaigns(false);
          }} 
        />
      )}
    </div>
  );
}

export default ProtectedPage;
