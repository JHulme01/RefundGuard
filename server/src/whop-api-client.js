// Whop API client with automatic token refresh
import { getTokens, saveTokens } from './db-wrapper.js';

const WHOP_API_BASE = 'https://api.whop.com/v2';
const WHOP_TOKEN_URL = 'https://api.whop.com/v2/oauth/token';

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(creatorId, refreshToken) {
  console.log('[whop-api] Refreshing access token for:', creatorId);
  
  try {
    const response = await fetch(WHOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.WHOP_CLIENT_ID,
        client_secret: process.env.WHOP_CLIENT_SECRET
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[whop-api] Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    const { access_token, refresh_token, expires_in } = data;
    
    // Save new tokens
    const expiresAt = expires_in 
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;
    
    saveTokens({
      creatorId,
      accessToken: access_token,
      refreshToken: refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt
    });
    
    console.log('[whop-api] Token refreshed successfully');
    return access_token;
  } catch (error) {
    console.error('[whop-api] Error refreshing token:', error);
    throw error;
  }
}

/**
 * Get a valid access token for a creator, refreshing if necessary
 */
async function getValidAccessToken(creatorId) {
  const tokens = getTokens(creatorId);
  
  if (!tokens) {
    throw new Error('No tokens found for creator');
  }
  
  // Check if token is expired or about to expire (within 5 minutes)
  if (tokens.expiresAt) {
    const expiresAt = new Date(tokens.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (expiresAt <= fiveMinutesFromNow) {
      console.log('[whop-api] Token expired or expiring soon, refreshing...');
      return await refreshAccessToken(creatorId, tokens.refreshToken);
    }
  }
  
  return tokens.accessToken;
}

/**
 * Make an authenticated request to the Whop API with retry logic
 */
export async function whopApiRequest(creatorId, endpoint, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000; // 1 second
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const accessToken = await getValidAccessToken(creatorId);
      
      const url = `${WHOP_API_BASE}${endpoint}`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      console.log(`[whop-api] ${options.method || 'GET'} ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : retryDelay * Math.pow(2, attempt - 1);
        
        console.warn(`[whop-api] Rate limited, retrying after ${waitTime}ms`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // Handle token expiration (should be rare due to auto-refresh)
      if (response.status === 401 && attempt < maxRetries) {
        console.warn('[whop-api] Unauthorized, token may be invalid, refreshing...');
        const tokens = getTokens(creatorId);
        if (tokens?.refreshToken) {
          await refreshAccessToken(creatorId, tokens.refreshToken);
          continue;
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[whop-api] Request failed:', response.status, errorText);
        
        // Don't retry on client errors (4xx except 429 and 401)
        if (response.status >= 400 && response.status < 500 && response.status !== 429 && response.status !== 401) {
          throw new Error(`Whop API error: ${response.status} - ${errorText}`);
        }
        
        lastError = new Error(`Whop API error: ${response.status} - ${errorText}`);
        
        if (attempt < maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt - 1);
          console.warn(`[whop-api] Retrying after ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw lastError;
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // Don't retry on network errors if this is the last attempt
      if (attempt >= maxRetries) {
        console.error('[whop-api] Max retries reached:', error);
        throw error;
      }
      
      // Retry on network errors with exponential backoff
      const waitTime = retryDelay * Math.pow(2, attempt - 1);
      console.warn(`[whop-api] Request failed, retrying after ${waitTime}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * Fetch purchases for a creator
 */
export async function fetchPurchases(creatorId, options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    per_page: options.perPage || 50,
    ...options.filters
  });
  
  return await whopApiRequest(creatorId, `/purchases?${params}`);
}

/**
 * Create a refund for a purchase
 */
export async function createRefund(creatorId, purchaseId, amount = null) {
  return await whopApiRequest(creatorId, `/purchases/${purchaseId}/refund`, {
    method: 'POST',
    body: JSON.stringify({
      amount: amount // null for full refund
    })
  });
}

/**
 * Revoke access for a membership
 */
export async function revokeAccess(creatorId, membershipId) {
  return await whopApiRequest(creatorId, `/memberships/${membershipId}`, {
    method: 'DELETE'
  });
}

/**
 * Fetch company info for the creator
 */
export async function fetchCompanyInfo(creatorId) {
  return await whopApiRequest(creatorId, '/me/company');
}

/**
 * Fetch products for the creator
 */
export async function fetchProducts(creatorId) {
  return await whopApiRequest(creatorId, '/products');
}

