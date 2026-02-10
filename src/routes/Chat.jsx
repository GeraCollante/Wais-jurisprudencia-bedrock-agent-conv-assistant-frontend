import React, { useState, createContext, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MessageList from "@components/MessageList";
import InputPrompt from "@components/InputPrompt";
import Toast from "@components/Toast";
import MessageSkeleton from "@components/MessageSkeleton";
// nanoid removed - using Timestamp_tipo format for IDs
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTranslation } from 'react-i18next';
import { useSession } from '../contexts/SessionContext';
import { useFunctionURLBuffered } from '../hooks/useFunctionURLBuffered';

// Contexto para manejar el estado de carga en el componente
const LoaderContext = createContext(false);

export default function Chat() {
  const { t } = useTranslation();
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();

  const initialMessages = useMemo(() => [
    { id: "welcome", content: t("welcome"), message_type: "answer" },
  ], [t]);

  const {
    currentSessionId,
    currentMessages,
    setCurrentMessages,
    createNewSession,
    loadSessionMessages,
    addMessageToCurrentSession,
    updateSessionTitle,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  // Local state only for UI-specific things, NOT for messages
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [toast, setToast] = useState({ message: null, type: 'info' });
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState(null);
  const [streamingSources, setStreamingSources] = useState(null);

  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);

  // Refs for tracking state across async operations
  const previousSessionIdRef = useRef(null);
  const streamingSessionIdRef = useRef(null); // Track which session the stream belongs to
  const abortStreamOnSessionChangeRef = useRef(false);
  const messagesEndRef = useRef(null); // For auto-scroll

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Show session errors as toast
  useEffect(() => {
    if (sessionError) {
      setToast({
        message: sessionError,
        type: 'error'
      });
    }
  }, [sessionError]);

  // Handle streaming messages from Function URL
  const handleStreamMessage = useCallback((data) => {
    // If session changed during streaming, ignore messages from old session
    if (abortStreamOnSessionChangeRef.current) {
      console.log('[Chat] Ignoring stream message - session changed');
      return;
    }

    console.log("Stream message:", data);

    switch (data.type) {
      case 'status':
        if (data.message) {
          console.log("Status:", data.message);
        }
        break;

      case 'sources':
        setStreamingSources(data.sources);
        console.log("Sources received:", data.sources?.length);
        break;

      case 'stream_start':
        // Capture the session ID at stream start
        streamingSessionIdRef.current = currentSessionId;
        const answerTimestamp = Date.now();
        setCurrentStreamingMessage({
          id: `${answerTimestamp}_a`,  // Timestamp_tipo format (synced with backend)
          author: username,
          message_type: "answer",
          content: "",
          sources: [],
          timestamp: answerTimestamp,
          rating: null,
          session_id: currentSessionId, // Use current value, not closure
          isStreaming: true,
        });
        break;

      case 'chunk':
        setCurrentStreamingMessage((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: prev.content + data.content,
          };
        });
        break;

      case 'stream_end':
        // Get sources: prefer event data (buffered mode) over state (streaming mode)
        const finalSources = data.sources || streamingSources || [];
        const sessionIdForMessage = streamingSessionIdRef.current;

        setCurrentStreamingMessage((prev) => {
          if (!prev) return null;

          const finalMessage = {
            ...prev,
            sources: finalSources,
            isStreaming: false,
            session_id: sessionIdForMessage,
          };

          // Add message to context using requestAnimationFrame to avoid React warning
          requestAnimationFrame(() => {
            addMessageToCurrentSession(finalMessage);
          });

          return null;
        });

        setStreamingSources(null);
        setIsLoading(false);
        streamingSessionIdRef.current = null;
        break;

      case 'complete':
        console.log("Stream complete:", data);
        break;

      case 'error':
        console.error("Stream error:", data.error);
        setToast({
          message: `Error: ${data.error}`,
          type: 'error'
        });
        setIsLoading(false);
        setCurrentStreamingMessage(null);
        setStreamingSources(null);
        streamingSessionIdRef.current = null;
        break;

      default:
        console.warn("Unknown message type:", data.type);
    }
  }, [username, currentSessionId, addMessageToCurrentSession, streamingSources]);

  // Initialize Function URL buffered hook
  const stream = useFunctionURLBuffered({
    onMessage: handleStreamMessage,
    onError: (error) => {
      console.error('Stream error:', error);
      setToast({
        message: `Error de conexion: ${error}`,
        type: 'error'
      });
      setIsLoading(false);
      setCurrentStreamingMessage(null);
      streamingSessionIdRef.current = null;
    },
  });

  // Handle session changes from URL
  useEffect(() => {
    const initializeSession = async () => {
      // Skip if same session
      if (previousSessionIdRef.current === urlSessionId && urlSessionId) {
        console.log('[Chat] Same session, skipping load');
        return;
      }

      // If there's an active stream and session is changing, abort it
      if (stream.isStreaming && previousSessionIdRef.current !== urlSessionId) {
        console.log('[Chat] Session changing during stream, aborting...');
        abortStreamOnSessionChangeRef.current = true;
        stream.cancelStream();
        setCurrentStreamingMessage(null);
        setStreamingSources(null);
        setIsLoading(false);
      }

      // Reset abort flag for new session
      abortStreamOnSessionChangeRef.current = false;
      previousSessionIdRef.current = urlSessionId;

      try {
        if (urlSessionId) {
          // Load existing session from URL
          console.log("[Chat] Loading session:", urlSessionId);
          setIsLoadingHistory(true);
          await loadSessionMessages(urlSessionId);
          setIsLoadingHistory(false);
        } else {
          // Create new session if no URL param
          console.log("[Chat] Creating new session");
          setIsLoadingHistory(true);
          const newSessionId = await createNewSession();
          if (newSessionId) {
            navigate(`/chat/${newSessionId}`, { replace: true });
          } else {
            console.warn("[Chat] Failed to create session");
            setToast({
              message: 'Error al crear la sesion. Intenta de nuevo.',
              type: 'error'
            });
          }
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error("[Chat] Error initializing session:", error);
        setToast({
          message: 'Error al cargar la sesion.',
          type: 'error'
        });
        setIsLoadingHistory(false);
      }
    };

    initializeSession();
  }, [urlSessionId, loadSessionMessages, createNewSession, navigate, stream]);

  // Send message handler
  const sendMessage = useCallback(async (message) => {
    console.log("[Chat] sendMessage:", message);

    // Validate we have a session
    if (!currentSessionId) {
      console.error("[Chat] No session ID, cannot send message");
      setToast({
        message: 'No hay sesion activa. Crea una nueva conversacion.',
        type: 'error'
      });
      return;
    }

    // Add user message to context immediately
    addMessageToCurrentSession(message);

    // Update session title if it's the first user message
    const questionCount = currentMessages.filter(m => m.message_type === "question").length;
    if (questionCount === 0 && currentSessionId) {
      const title = message.content.substring(0, 50);
      updateSessionTitle(currentSessionId, title);
    }

    setIsLoading(true);

    console.log("[Chat] Sending query:", {
      query: message.content,
      session_id: currentSessionId
    });

    // Send via Function URL (MCP Agent)
    const success = await stream.sendQuery({
      query: message.content,
      session_id: currentSessionId
    });

    if (!success) {
      console.error("[Chat] Failed to send query");
      setToast({
        message: 'Error al enviar mensaje. Por favor intenta de nuevo.',
        type: 'error'
      });
      setIsLoading(false);
    }
  }, [currentSessionId, currentMessages, addMessageToCurrentSession, updateSessionTitle, stream]);

  // Rating handler
  const setMessageRating = useCallback((messageData, newRating) => {
    const { id } = messageData;
    console.log("[Chat] Rating message:", id, newRating);

    // Update in context
    setCurrentMessages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rating: newRating } : item
      )
    );
  }, [setCurrentMessages]);

  // Compute display messages from context + streaming
  const displayMessages = useMemo(() => {
    // Start with current messages from context, or initial message if empty
    const baseMessages = (currentMessages && currentMessages.length > 0)
      ? currentMessages
      : initialMessages;

    console.log('[Chat] displayMessages computed:', {
      currentMessagesCount: currentMessages?.length || 0,
      currentMessagesTypes: currentMessages?.map(m => m.message_type) || [],
      hasStreamingMessage: !!currentStreamingMessage,
      baseMessagesCount: baseMessages.length
    });

    // Add streaming message if exists
    if (currentStreamingMessage) {
      return [...baseMessages, currentStreamingMessage];
    }

    return baseMessages;
  }, [currentMessages, currentStreamingMessage, initialMessages]);

  // Auto-scroll when messages change or during streaming
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, currentStreamingMessage, scrollToBottom]);

  // Loading state
  if (isLoadingHistory) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-gray-500">Cargando conversacion...</div>
      </div>
    );
  }

  return (
    <LoaderContext.Provider value={isLoading}>
      <div className="flex flex-col h-screen max-w-4xl md:max-w-6xl lg:max-w-7xl xl:max-w-full mx-auto w-full bg-brand-bg-surface text-brand-text-primary">
        {/* Area de mensajes scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 md:px-6 lg:px-8">
          <MessageList messages={displayMessages} setMessageRating={setMessageRating} />

          {/* Mostrar skeleton mientras carga (sin streaming) */}
          {isLoading && !currentStreamingMessage && <MessageSkeleton />}

          {/* Elemento invisible para auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input fijo en la parte inferior */}
        <div className="sticky bottom-0 px-4 pb-4 md:px-6 lg:px-8 bg-brand-bg-surface">
          <InputPrompt
            sendMessage={sendMessage}
            LoaderContext={LoaderContext}
          />
        </div>
      </div>

      {/* Toast para notificaciones */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: null, type: 'info' })}
      />
    </LoaderContext.Provider>
  );
}
