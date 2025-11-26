/**
 * useAuthSession Hook
 *
 * Provides session management with:
 * - Periodic session validation (heartbeat)
 * - Session expiration detection
 * - Automatic cleanup on logout
 * - Session event handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Auth } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';
import authService, {
  onSessionEvent,
  isAuthenticated,
  clearSessionData,
  getTokenTimeToExpire,
} from '../services/authService';

// Default configuration
const DEFAULT_HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // Warn 5 minutes before expiration

/**
 * Hook for managing authentication session
 *
 * @param {Object} options
 * @param {number} options.heartbeatInterval - Interval for session checks (ms)
 * @param {Function} options.onSessionExpired - Callback when session expires
 * @param {Function} options.onSessionWarning - Callback when session is about to expire
 * @returns {Object} Session state and methods
 */
export function useAuthSession(options = {}) {
  const {
    heartbeatInterval = DEFAULT_HEARTBEAT_INTERVAL,
    onSessionExpired,
    onSessionWarning,
  } = options;

  const { signOut: amplifySignOut } = useAuthenticator((ctx) => [ctx.user]);

  const [sessionStatus, setSessionStatus] = useState('unknown'); // 'valid', 'expiring', 'expired', 'unknown'
  const [timeToExpire, setTimeToExpire] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const heartbeatRef = useRef(null);
  const warningTriggeredRef = useRef(false);

  /**
   * Validate the current session
   */
  const validateSession = useCallback(async () => {
    if (isValidating) return;

    setIsValidating(true);

    try {
      const authenticated = await isAuthenticated();

      if (!authenticated) {
        setSessionStatus('expired');
        setTimeToExpire(null);
        onSessionExpired?.({ reason: 'Not authenticated' });
        return false;
      }

      // Get token and check expiration
      const session = await Auth.currentSession();
      const accessToken = session.getAccessToken().getJwtToken();
      const ttl = getTokenTimeToExpire(accessToken);

      setTimeToExpire(ttl);

      if (ttl <= 0) {
        setSessionStatus('expired');
        onSessionExpired?.({ reason: 'Token expired' });
        return false;
      }

      if (ttl <= SESSION_WARNING_THRESHOLD && !warningTriggeredRef.current) {
        setSessionStatus('expiring');
        warningTriggeredRef.current = true;
        onSessionWarning?.({ timeToExpire: ttl });
        return true;
      }

      if (ttl > SESSION_WARNING_THRESHOLD) {
        setSessionStatus('valid');
        warningTriggeredRef.current = false;
      }

      return true;
    } catch (err) {
      console.error('[useAuthSession] Validation error:', err);
      setSessionStatus('expired');
      setTimeToExpire(null);
      onSessionExpired?.({ reason: 'Validation error', error: err });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, onSessionExpired, onSessionWarning]);

  /**
   * Sign out with complete cleanup
   */
  const logout = useCallback(async (options = {}) => {
    console.log('[useAuthSession] Logging out...');

    // Stop heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // Clear all session data
    clearSessionData();

    // Sign out from Cognito
    try {
      await authService.signOut(options);
    } catch (err) {
      console.error('[useAuthSession] Sign out error:', err);
    }

    // Update state
    setSessionStatus('expired');
    setTimeToExpire(null);

    // Use Amplify's signOut to update UI state
    try {
      amplifySignOut();
    } catch (err) {
      console.error('[useAuthSession] Amplify sign out error:', err);
    }
  }, [amplifySignOut]);

  /**
   * Refresh the session manually
   */
  const refreshSession = useCallback(async () => {
    try {
      console.log('[useAuthSession] Manually refreshing session...');
      await authService.getValidAccessToken();
      await validateSession();
      return true;
    } catch (err) {
      console.error('[useAuthSession] Manual refresh failed:', err);
      return false;
    }
  }, [validateSession]);

  // Set up heartbeat
  useEffect(() => {
    // Initial validation
    validateSession();

    // Set up periodic validation
    heartbeatRef.current = setInterval(validateSession, heartbeatInterval);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [heartbeatInterval, validateSession]);

  // Listen for session events from authService
  useEffect(() => {
    const unsubscribeExpired = onSessionEvent('expired', (data) => {
      console.log('[useAuthSession] Session expired event:', data);
      setSessionStatus('expired');
      setTimeToExpire(null);
      onSessionExpired?.(data);
    });

    const unsubscribeRefreshed = onSessionEvent('refreshed', () => {
      console.log('[useAuthSession] Session refreshed event');
      warningTriggeredRef.current = false;
      validateSession();
    });

    return () => {
      unsubscribeExpired();
      unsubscribeRefreshed();
    };
  }, [onSessionExpired, validateSession]);

  return {
    sessionStatus,
    timeToExpire,
    isValidating,
    isSessionValid: sessionStatus === 'valid' || sessionStatus === 'expiring',
    isSessionExpiring: sessionStatus === 'expiring',
    isSessionExpired: sessionStatus === 'expired',
    validateSession,
    refreshSession,
    logout,
  };
}

export default useAuthSession;
