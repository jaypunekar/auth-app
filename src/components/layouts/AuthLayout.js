import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Container, Box, Paper, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  // If authenticated, redirect to dashboard
  if (isAuthenticated && !loading) {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Ad Campaign Manager
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your digital ad campaigns with ease
            </Typography>
          </Box>
          <Outlet />
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthLayout; 