// API configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
 
// Other configuration constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const DEFAULT_PAGINATION_LIMIT = 10; 