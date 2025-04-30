import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper, TextField, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const TokenDisplay = ({ token }) => {
  const [showFullToken, setShowFullToken] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!token) {
    return (
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
        <Typography color="error">No token available</Typography>
      </Paper>
    );
  }

  const displayToken = showFullToken 
    ? token 
    : `${token.substring(0, 15)}...${token.substring(token.length - 15)}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
      <Typography variant="subtitle2" gutterBottom>
        Your JWT Token:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={displayToken}
          InputProps={{
            readOnly: true,
            sx: { fontFamily: 'monospace', fontSize: '0.8rem' }
          }}
        />
        <Tooltip title={showFullToken ? "Hide token" : "Show full token"}>
          <IconButton 
            onClick={() => setShowFullToken(!showFullToken)}
            size="small"
            sx={{ ml: 1 }}
          >
            {showFullToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
          <IconButton 
            onClick={handleCopyToken}
            size="small"
            sx={{ ml: 1 }}
          >
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
        Use this token for API testing with Postman or other tools
      </Typography>
    </Paper>
  );
};

export default TokenDisplay; 