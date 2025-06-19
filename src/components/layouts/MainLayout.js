import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Collapse
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
  Business as BusinessIcon,
  Bookmarks as BookmarksIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  MonetizationOn as MonetizationOnIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import GoogleAdsLinkButton from '../GoogleAdsLinkButton';
import GoogleAdsCreationButton from '../GoogleAdsCreationButton';
import CreditDisplay from '../CreditDisplay';
import googleAdsApi from '../../services/googleAdsApi';

const drawerWidth = 240;

const MainLayout = () => {
  const { user, logout, subscription } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [previousAccountsOpen, setPreviousAccountsOpen] = useState(false);
  const [previousAccounts, setPreviousAccounts] = useState([]);
  const [loadingPreviousAccounts, setLoadingPreviousAccounts] = useState(false);
  const [accountStatus, setAccountStatus] = useState({
    isLinked: false,
    customerId: ''
  });

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

  const togglePreviousAccounts = () => {
    setPreviousAccountsOpen(!previousAccountsOpen);
    if (!previousAccountsOpen) {
      fetchPreviouslyLinkedAccounts();
    }
  };

  // Define fetchAccountStatus outside of useEffect so it can be called from other functions
  const fetchAccountStatus = async () => {
    try {
      const response = await googleAdsApi.getAccountStatus();
      if (response && response.data) {
        setAccountStatus({
          isLinked: response.data.is_linked || false,
          customerId: response.data.customer_id || '',
        });
        if (response.data.has_previous_accounts && response.data.previous_accounts) {
          setPreviousAccounts(response.data.previous_accounts);
        }
      }
    } catch (error) {
      console.error('Error fetching Google Ads account status:', error);
    }
  };

  // Fetch Google Ads account status and previously linked accounts
  useEffect(() => {
    // Call fetchAccountStatus on component mount
    fetchAccountStatus();
  }, []);

  // Function to fetch previously linked accounts
  const fetchPreviouslyLinkedAccounts = async () => {
    try {
      setLoadingPreviousAccounts(true);
      const response = await googleAdsApi.getPreviouslyLinkedAccounts();
      if (response && response.success && response.data.accounts) {
        setPreviousAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error('Error fetching previously linked accounts:', error);
    } finally {
      setLoadingPreviousAccounts(false);
    }
  };

  // Handle reconnecting to a previously linked account
  const handleReconnectAccount = async (accountId) => {
    try {
      const account = previousAccounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      // Call the API to link this account
      await googleAdsApi.linkExistingAccount(account.customer_id);
      
      // Refresh the account status
      fetchAccountStatus();
      
      // Notify the user (this would be better with a toast notification)
      alert(`Reconnection request sent for account ${account.customer_id}. Please check your email for further instructions.`);
    } catch (error) {
      console.error('Error reconnecting account:', error);
      alert('Failed to reconnect account. Please try using the Google Ads Link button.');
    }
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
    { text: 'Response Review', icon: <BookmarksIcon />, path: '/feedback-review' },
    { text: 'Website Analysis', icon: <SpeedIcon />, path: '/pagespeed' },
    { text: 'SEO Analysis', icon: <SearchIcon />, path: '/seo-analysis' },
    { text: 'Comprehensive Analysis', icon: <AnalyticsIcon />, path: '/comprehensive-analysis' },
    { text: 'Ad Calendar', icon: <CalendarIcon />, path: '/adcalendar' },
    { text: 'Content Calendar View', icon: <CalendarIcon />, path: '/content-calendar-view' },
    { text: 'Business Profile', icon: <BusinessIcon />, path: '/business-profile' },
    { text: 'Instagram Analyzer', icon: <InstagramIcon />, path: '/instagram-analyzer' },
    { text: 'Facebook Analyzer', icon: <FacebookIcon />, path: '/facebook-analyzer' },
    { text: 'Google Ads Analytics', icon: <AnalyticsIcon />, path: '/google-ads-analytics' },
    { text: 'Campaign Spending', icon: <MonetizationOnIcon />, path: '/campaign-spending' },
    { text: 'Shared Campaigns', icon: <ShareIcon />, path: '/shared-campaigns' },
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
        
        {/* Always show the Link button since free users can now link external accounts */}
        <GoogleAdsLinkButton />
        
        {/* Add Campaign Spending button */}
        <Button
          variant="outlined"
          color="primary"
          startIcon={<MonetizationOnIcon />}
          onClick={() => navigate('/campaign-spending')}
          fullWidth
          sx={{ mb: 1 }}
          disabled={!canUseGoogleAds}
        >
          Campaign Spending
        </Button>
        
        {/* Add a Check Status button if an account is pending */}
        {accountStatus.customerId && !accountStatus.isLinked && (
          <Button
            variant="outlined"
            color="success"
            startIcon={<RefreshIcon />}
            onClick={() => fetchAccountStatus()}
            fullWidth
            sx={{ mb: 1 }}
          >
            Check Link Status
          </Button>
        )}
        
        {/* Only show creation button for Pro users who can create accounts under our manager */}
        {subscription?.features?.can_create_google_ads_account ? (
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

        {/* Previously Linked Accounts Section - Only show if there are some */}
        {previousAccounts.length > 0 && (
          <>
            <ListItem button onClick={togglePreviousAccounts} sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: '30px' }}>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Previously Linked Accounts" 
                primaryTypographyProps={{ variant: 'body2', noWrap: true }} 
              />
              {previousAccountsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItem>
            <Collapse in={previousAccountsOpen} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, pr: 1 }}>
                {loadingPreviousAccounts ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <List disablePadding dense>
                    {previousAccounts.map((account) => (
                      <ListItem 
                        key={account.id} 
                        sx={{ py: 0.5 }}
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            size="small" 
                            onClick={() => handleReconnectAccount(account.id)}
                            title="Reconnect Account"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        }
                      >
                        <ListItemText 
                          primary={`ID: ${account.customer_id}`}
                          primaryTypographyProps={{ variant: 'caption', noWrap: true }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Collapse>
          </>
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            Current Plan:
          </Typography>
          <Chip size="small" label={subscription?.tier || 'Free'} color={
            subscription?.tier === 'Pro' ? 'secondary' : 
            subscription?.tier === 'Enterprise' ? 'warning' : 
            'primary'
          } />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <CreditDisplay showIcon={false} size="small" showBuyButton={true} />
        </Box>
        
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
          
          {/* Credits display */}
          <CreditDisplay 
            showBuyButton={true}
            size="small"
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1, px: 1, py: 0.5 }}
          />
          
          {/* Only show Google Ads button if user has appropriate tier */}
          {canUseGoogleAds ? (
            <>
              <GoogleAdsLinkButton />
              {accountStatus.customerId && !accountStatus.isLinked && (
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => fetchAccountStatus()}
                  startIcon={<RefreshIcon />}
                  sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.15)' }}
                >
                  Check Status
                </Button>
              )}
            </>
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