import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Auth } from 'aws-amplify';
import {
  listUserSessions,
  createSession,
  deleteSession,
  getSessionMessages,
  updateSessionTitle as updateSessionTitleApi
} from '../api';
import { onSessionEvent, clearSessionData } from '../services/authService';

const SessionContext = createContext();

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Get current authenticated user
  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    fetchUser();
  }, []);

  // Load all user sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const response = await listUserSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Error al cargar las sesiones');
      // Set empty sessions array on error to prevent blocking
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]); // Removed loadSessions from dependencies to prevent infinite loop

  // Listen for session expiration events
  useEffect(() => {
    const unsubscribe = onSessionEvent('expired', () => {
      console.log('[SessionContext] Session expired, clearing state...');
      // Clear all local state
      setSessions([]);
      setCurrentSessionId(null);
      setCurrentMessages([]);
      setUser(null);
      setError('Sesion expirada');
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Reset context state (for logout)
  const resetState = useCallback(() => {
    console.log('[SessionContext] Resetting state...');
    setSessions([]);
    setCurrentSessionId(null);
    setCurrentMessages([]);
    setError(null);
    setLoading(false);
  }, []);

  // Load messages for a specific session
  const loadSessionMessages = useCallback(async (sessionId) => {
    console.log('📨 loadSessionMessages llamado con sessionId:', sessionId);
    if (!sessionId) {
      console.log('⚠️ sessionId vacío, retornando');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🌐 Llamando a getSessionMessages API para sessionId:', sessionId);
      const response = await getSessionMessages(sessionId);
      console.log('✅ getSessionMessages respondió:', response);
      console.log('📋 Mensajes recibidos:', response.messages?.length || 0);
      setCurrentMessages(response.messages || []);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('❌ Error loading session messages:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
      setError('Error al cargar los mensajes de la sesión');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new session
  const createNewSession = useCallback(async (title = 'Nueva conversación') => {
    setLoading(true);
    setError(null);
    try {
      const response = await createSession(title);
      const newSessionId = response.session_id;

      // Add new session to list
      const timestamp = Date.now();  // Milliseconds (synced with backend)
      const newSession = {
        SessionId: newSessionId,
        Title: title,
        MessageCount: 0,
        CreatedAt: timestamp,
        UpdatedAt: timestamp,
      };
      setSessions(prevSessions => [newSession, ...prevSessions]);

      // Set as current session
      setCurrentSessionId(newSessionId);
      setCurrentMessages([]);

      return newSessionId;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Error al crear la sesión');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a session
  const removeSession = useCallback(async (sessionId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSession(sessionId);

      // Remove from list
      setSessions(prevSessions =>
        prevSessions.filter(s => s.SessionId !== sessionId)
      );

      // If it was the current session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setCurrentMessages([]);
      }

      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Error al eliminar la sesión');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentSessionId]);

  // Switch to a different session
  const switchSession = useCallback(async (sessionId) => {
    console.log('🔄 switchSession llamado con sessionId:', sessionId, 'currentSessionId:', currentSessionId);
    if (sessionId === currentSessionId) {
      console.log('⚠️ sessionId === currentSessionId, retornando sin hacer nada');
      return;
    }

    console.log('📞 Llamando a loadSessionMessages...');
    await loadSessionMessages(sessionId);
    console.log('✅ loadSessionMessages completado');
  }, [currentSessionId, loadSessionMessages]);

  // Add a message to current session (for real-time updates)
  const addMessageToCurrentSession = useCallback((message) => {
    console.log('[SessionContext] addMessageToCurrentSession called with:', message);
    setCurrentMessages(prevMessages => {
      console.log('[SessionContext] prevMessages:', prevMessages.length, 'adding:', message.message_type);
      const newMessages = [...prevMessages, message];
      console.log('[SessionContext] newMessages total:', newMessages.length);
      return newMessages;
    });

    // Update session metadata in list
    setSessions(prevSessions =>
      prevSessions.map(s =>
        s.SessionId === currentSessionId
          ? {
              ...s,
              MessageCount: (s.MessageCount || 0) + 1,
              UpdatedAt: Date.now(),  // Milliseconds (synced with backend)
              LastMessage: message.content?.substring(0, 100)
            }
          : s
      )
    );
  }, [currentSessionId]);

  // Update session title (when first message is sent)
  const updateSessionTitle = useCallback(async (sessionId, title) => {
    // Update local state immediately for responsive UI
    setSessions(prevSessions =>
      prevSessions.map(s =>
        s.SessionId === sessionId
          ? { ...s, Title: title }
          : s
      )
    );

    // Persist to backend
    try {
      await updateSessionTitleApi(sessionId, title);
    } catch (err) {
      console.error('Error updating session title in backend:', err);
      // Local state is already updated, so UI stays responsive even if backend fails
    }
  }, []);

  const value = {
    // State
    sessions,
    currentSessionId,
    currentMessages,
    loading,
    error,
    user,

    // Actions
    loadSessions,
    loadSessionMessages,
    createNewSession,
    removeSession,
    switchSession,
    addMessageToCurrentSession,
    updateSessionTitle,
    setCurrentSessionId,
    setCurrentMessages,
    resetState,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
