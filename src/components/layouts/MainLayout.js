import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Speed as SpeedIcon,
  CalendarMonth as CalendarIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Subscriptions as SubscriptionsIcon,
  Lock as LockIcon,
  ContactSupport as ContactSupportIcon,
  StarBorder as StarBorderIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import GoogleAdsLinkButton from '../GoogleAdsLinkButton';
import GoogleAdsCreationButton from '../GoogleAdsCreationButton';

const drawerWidth = 240;

const MainLayout = () => {
  const { user, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if user can use Google Ads
  const canUseGoogleAds = subscription?.features?.can_use_google_ads || false;
  
  // Show upgrade button based on current tier
  const showUpgradeButton = subscription?.tier === 'Free';
  const showContactSalesButton = subscription?.tier === 'Pro';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Chat with Assistant', icon: <ChatIcon />, path: '/chat' },
    { text: 'Real-time Chat', icon: <ChatBubbleOutlineIcon />, path: '/ws-chat' },
    { text: 'Website Analysis', icon: <SpeedIcon />, path: '/pagespeed' },
    { text: 'Ad Calendar', icon: <CalendarIcon />, path: '/adcalendar' },
    { text: 'Instagram Analyzer', icon: <InstagramIcon />, path: '/instagram-analyzer' },
    { text: 'Facebook Analyzer', icon: <FacebookIcon />, path: '/facebook-analyzer' },
    { text: 'Subscriptions', icon: <SubscriptionsIcon />, path: '/subscriptions' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Ad Campaign Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Google Ads
          </Typography>
          {!canUseGoogleAds && (
            <Tooltip title="This feature requires Pro or Enterprise subscription">
              <LockIcon fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>
        {canUseGoogleAds ? (
          <GoogleAdsCreationButton />
        ) : (
          <Button 
            variant="outlined" 
            size="small" 
            disabled 
            fullWidth 
            sx={{ mb: 1 }}
          >
            Create Google Ads
          </Button>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
          Current Plan: <Chip size="small" label={subscription?.tier || 'Free'} color={
            subscription?.tier === 'Pro' ? 'secondary' : 
            subscription?.tier === 'Enterprise' ? 'warning' : 
            'primary'
          } />
        </Typography>
        
        {showUpgradeButton && (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
            onClick={() => navigate('/subscriptions')}
            startIcon={<StarBorderIcon />}
          >
            Upgrade to Pro
          </Button>
        )}
        
        {showContactSalesButton && (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            fullWidth
            onClick={() => navigate('/subscriptions')}
            startIcon={<ContactSupportIcon />}
          >
            Enterprise Solutions
          </Button>
        )}
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Ad Campaign Manager
          </Typography>
          
          {/* Only show Google Ads button if user has appropriate tier */}
          {canUseGoogleAds ? (
            <GoogleAdsLinkButton />
          ) : (
            <Tooltip title="Upgrade to Pro to connect Google Ads">
              <Button
                variant="contained"
                color="inherit"
                onClick={() => navigate('/subscriptions')}
                startIcon={<LockIcon />}
                sx={{ ml: 2 }}
              >
                Pro Feature
              </Button>
            </Tooltip>
          )}
          
          <Button
            color="inherit"
            onClick={handleProfileMenuOpen}
            startIcon={
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            }
          >
            {user?.email}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { 
              handleProfileMenuClose();
              navigate('/subscriptions');
            }}>
              <ListItemIcon>
                <SubscriptionsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Subscriptions</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;