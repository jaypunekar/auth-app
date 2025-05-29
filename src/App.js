import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import { BusinessProfilePage } from './components/BusinessProfile';
import FeedbackReview from './components/Chat/FeedbackReview';
import SEOAnalysisPage from './pages/SEOAnalysisPage';
import ComprehensiveAnalysis from './components/SEOAnalysis/ComprehensiveAnalysis';

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
import WebSocketChat from './components/WebSocketChat';
import AdCampaignForm from './pages/AdCampaignForm';
import AdCampaignDetail from './pages/AdCampaignDetail';
import PageSpeedAnalysis from './pages/PageSpeedAnalysis';
import AdCalendar from './pages/AdCalendar';
import InstagramAnalyzer from './pages/InstagramAnalyzer';
import FacebookAnalyzer from './pages/FacebookAnalyzer';
import Subscriptions from './pages/Subscriptions';
import GoogleAdsFundsSuccess from './pages/GoogleAdsFundsSuccess';
import DatabaseViewer from './pages/DatabaseViewer';
import GoogleAdsAnalytics from './pages/GoogleAdsAnalytics';
import ContentCalendarPage from './pages/ContentCalendarPage';

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
          <Route path="ws-chat" element={<WebSocketChat />} />
          <Route path="feedback-review" element={<FeedbackReview />} />
          <Route path="campaigns/new" element={<AdCampaignForm />} />
          <Route path="campaigns/edit/:id" element={<AdCampaignForm />} />
          <Route path="campaigns/:id" element={<AdCampaignDetail />} />
          <Route path="pagespeed" element={<PageSpeedAnalysis />} />
          <Route path="adcalendar" element={<AdCalendar />} />
          <Route path="instagram-analyzer" element={<InstagramAnalyzer />} />
          <Route path="facebook-analyzer" element={<FacebookAnalyzer />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="google-ads-funds-success" element={<GoogleAdsFundsSuccess />} />
          <Route path="database-viewer" element={<DatabaseViewer />} />
          <Route path="business-profile" element={<BusinessProfilePage />} />
          <Route path="google-ads-analytics" element={<GoogleAdsAnalytics />} />
          <Route path="content-calendar" element={<ContentCalendarPage />} />
          <Route path="seo-analysis" element={<SEOAnalysisPage />} />
          <Route path="comprehensive-analysis" element={<ComprehensiveAnalysis />} />
        </Route>

        {/* Redirect to login for any other route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </SnackbarProvider>
  );
}

export default App; 