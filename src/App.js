import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ResetPassword from './pages/auth/ResetPassword';
import VerificationPage from './pages/auth/VerificationPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import AdCampaignForm from './pages/AdCampaignForm';
import AdCampaignDetail from './pages/AdCampaignDetail';
import PageSpeedAnalysis from './pages/PageSpeedAnalysis';
import AdCalendar from './pages/AdCalendar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <SnackbarProvider 
      maxSnack={3} 
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
    >
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        
        {/* Auth Pages without Layout */}
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify" element={<VerificationPage />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="campaigns/new" element={<AdCampaignForm />} />
          <Route path="campaigns/edit/:id" element={<AdCampaignForm />} />
          <Route path="campaigns/:id" element={<AdCampaignDetail />} />
          <Route path="pagespeed" element={<PageSpeedAnalysis />} />
          <Route path="adcalendar" element={<AdCalendar />} />
        </Route>

        {/* Redirect to login for any other route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </SnackbarProvider>
  );
}

export default App; 