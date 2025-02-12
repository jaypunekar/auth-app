import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

function UserProfile({ userInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
    navigate('/');
  };

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button className="profile-button" onClick={() => setIsOpen(!isOpen)}>
        <span className="profile-initial">
          {userInfo.first_name ? userInfo.first_name[0].toUpperCase() : 'U'}
        </span>
      </button>
      
      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-info">
            <p className="full-name">{`${userInfo.first_name} ${userInfo.last_name}`}</p>
            <p className="username">@{userInfo.username}</p>
            <p className="email">{userInfo.email}</p>
          </div>
          <div className="dropdown-divider"></div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile; 