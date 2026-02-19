/**
 * AuthService - Centralized Authentication Service
 *
 * Handles all token operations with:
 * - Token refresh with mutex to prevent race conditions
 * - Token expiration validation
 * - Session events (expired, refreshed, error)
 * - Centralized error handling for 401/403
 */

import { Auth } from 'aws-amplify';

// Token refresh mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// Event listeners for session changes
const sessionEventListeners = {
  expired: [],
  refreshed: [],
  error: [],
};

// Configuration
const TOKEN_EXPIRATION_BUFFER_MS = 60 * 1000; // Refresh 1 minute before expiration

/**
 * Subscribe to session events
 * @param {'expired' | 'refreshed' | 'error'} event
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onSessionEvent(event, callback) {
  if (!sessionEventListeners[event]) {
    console.warn(`Unknown session event: ${event}`);
    return () => {};
  }

  sessionEventListeners[event].push(callback);

  // Return unsubscribe function
  return () => {
    const index = sessionEventListeners[event].indexOf(callback);
    if (index > -1) {
      sessionEventListeners[event].splice(index, 1);
    }
  };
}

/**
 * Emit a session event
 * @param {'expired' | 'refreshed' | 'error'} event
 * @param {any} data
 */
function emitSessionEvent(event, data = null) {
  sessionEventListeners[event]?.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.error(`Error in session event callback (${event}):`, err);
    }
  });
}

/**
 * Check if a JWT token is expired or about to expire
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired or will expire soon
 */
export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Return true if expired or will expire within buffer time
    return currentTime >= (expirationTime - TOKEN_EXPIRATION_BUFFER_MS);
  } catch (err) {
    console.error('Error parsing token:', err);
    return true;
  }
}

/**
 * Get token expiration time in milliseconds
 * @param {string} token - JWT token
 * @returns {number} Time until expiration in ms (negative if expired)
 */
export function getTokenTimeToExpire(token) {
  if (!token) return -1;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    return expirationTime - Date.now();
  } catch (err) {
    return -1;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 * Uses mutex to prevent race conditions with concurrent requests
 *
 * @returns {Promise<string>} Valid JWT access token
 * @throws {Error} If unable to get valid token
 */
export async function getValidAccessToken() {
  // If already refreshing, wait for the existing promise
  if (isRefreshing && refreshPromise) {
    console.log('[AuthService] Waiting for existing refresh...');
    return refreshPromise;
  }

  try {
    // Try to get current session
    const session = await Auth.currentSession();
    const accessToken = session.getAccessToken().getJwtToken();

    // Check if token is about to expire
    if (isTokenExpired(accessToken)) {
      console.log('[AuthService] Token expired or expiring soon, refreshing...');
      return await refreshToken();
    }

    return accessToken;
  } catch (err) {
    console.error('[AuthService] Error getting session:', err);

    // If session is invalid, try to refresh
    if (err.code === 'NotAuthorizedException' || err.message?.includes('No current user')) {
      emitSessionEvent('expired', { reason: 'Session invalid' });
      throw new Error('SESSION_EXPIRED');
    }

    // Try to refresh token
    return await refreshToken();
  }
}

/**
 * Get a valid ID token (for API Gateway authorization)
 * @returns {Promise<string>} Valid JWT ID token
 */
export async function getValidIdToken() {
  if (isRefreshing && refreshPromise) {
    await refreshPromise;
  }

  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();

    if (isTokenExpired(idToken)) {
      await refreshToken();
      const newSession = await Auth.currentSession();
      return newSession.getIdToken().getJwtToken();
    }

    return idToken;
  } catch (err) {
    console.error('[AuthService] Error getting ID token:', err);
    throw err;
  }
}

/**
 * Force refresh the token with mutex protection
 * @returns {Promise<string>} New access token
 */
async function refreshToken() {
  // If already refreshing, wait for existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      console.log('[AuthService] Refreshing token...');

      // Force refresh the session
      const cognitoUser = await Auth.currentAuthenticatedUser();
      const currentSession = await Auth.currentSession();

      return new Promise((resolve, reject) => {
        cognitoUser.refreshSession(currentSession.getRefreshToken(), (err, session) => {
          if (err) {
            console.error('[AuthService] Token refresh failed:', err);
            emitSessionEvent('expired', { reason: 'Refresh failed', error: err });
            reject(new Error('SESSION_EXPIRED'));
          } else {
            const newToken = session.getAccessToken().getJwtToken();
            console.log('[AuthService] Token refreshed successfully');
            emitSessionEvent('refreshed', { token: newToken });
            resolve(newToken);
          }
        });
      });
    } catch (err) {
      console.error('[AuthService] Error during refresh:', err);
      emitSessionEvent('expired', { reason: 'Refresh error', error: err });
      throw new Error('SESSION_EXPIRED');
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an authenticated fetch request with automatic token refresh and retry
 *
 * @param {string} url - Request URL
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Additional configuration
 * @param {number} config.maxRetries - Max retry attempts (default: 1)
 * @param {boolean} config.useIdToken - Use ID token instead of access token
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}, config = {}) {
  const { maxRetries = 1, useIdToken = false } = config;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Get valid token
      const token = useIdToken
        ? await getValidIdToken()
        : await getValidAccessToken();

      // Add authorization header
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };

      // Make request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle auth errors
      if (response.status === 401 || response.status === 403) {
        console.warn(`[AuthService] Received ${response.status}, attempt ${attempt + 1}/${maxRetries + 1}`);

        if (attempt < maxRetries) {
          // Force token refresh and retry
          await refreshToken();
          continue;
        }

        // Max retries exceeded
        emitSessionEvent('expired', {
          reason: `HTTP ${response.status}`,
          status: response.status
        });

        const error = new Error('SESSION_EXPIRED');
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (err) {
      lastError = err;

      // If it's a session error, don't retry
      if (err.message === 'SESSION_EXPIRED') {
        throw err;
      }

      // For network errors, retry if we have attempts left
      if (attempt < maxRetries) {
        console.warn(`[AuthService] Request failed, retrying... (${attempt + 1}/${maxRetries})`);
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Check if user is currently authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    await Auth.currentAuthenticatedUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sign out and clean up
 * @param {Object} options
 * @param {boolean} options.global - Sign out from all devices
 */
export async function signOut(options = {}) {
  try {
    console.log('[AuthService] Signing out...');
    await Auth.signOut(options);

    // Clear local storage data
    clearSessionData();

    console.log('[AuthService] Sign out complete');
  } catch (err) {
    console.error('[AuthService] Sign out error:', err);
    // Still clear local data even if sign out fails
    clearSessionData();
    throw err;
  }
}

/**
 * Clear all session-related data from storage
 */
export function clearSessionData() {
  console.log('[AuthService] Clearing session data...');

  // Clear message queue
  localStorage.removeItem('ws_message_queue');

  // Clear any cached session data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Clear app-specific data but not Cognito tokens (Amplify handles those)
    if (key && (
      key.startsWith('ws_') ||
      key.startsWith('session_') ||
      key.startsWith('chat_') ||
      key.startsWith('message_')
    )) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Clear session storage
  sessionStorage.clear();

  console.log(`[AuthService] Cleared ${keysToRemove.length} items from localStorage`);
}

/**
 * Clear all auth data including Cognito tokens from localStorage.
 * Used during logout to ensure complete cleanup even if Auth.signOut() fails.
 */
export function clearAllAuthData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('CognitoIdentityServiceProvider.') ||
      key.startsWith('aws-amplify-') ||
      key.startsWith('amplify-') ||
      key.startsWith('ws_') ||
      key.startsWith('session_') ||
      key.startsWith('chat_') ||
      key.startsWith('message_')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  sessionStorage.clear();
}

/**
 * Get current user info
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  try {
    return await Auth.currentAuthenticatedUser();
  } catch {
    return null;
  }
}

export default {
  getValidAccessToken,
  getValidIdToken,
  authenticatedFetch,
  isTokenExpired,
  getTokenTimeToExpire,
  isAuthenticated,
  signOut,
  clearSessionData,
  clearAllAuthData,
  getCurrentUser,
  onSessionEvent,
};
