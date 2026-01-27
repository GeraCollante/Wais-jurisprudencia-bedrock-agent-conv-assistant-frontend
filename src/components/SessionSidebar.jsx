import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSession } from '../contexts/SessionContext';
import { MessageSquarePlus, Trash2, MessageSquare, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

SessionSidebar.propTypes = {
  isMobileOpen: PropTypes.bool,
  setIsMobileOpen: PropTypes.func,
};

export default function SessionSidebar({ isMobileOpen = false, setIsMobileOpen = () => {} }) {
  const navigate = useNavigate();
  const { sessionId: urlSessionId } = useParams();
  const {
    sessions,
    currentSessionId,
    loading,
    error,
    createNewSession,
    removeSession,
    loadSessions,
  } = useSession();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Close mobile sidebar when navigating to a session
  useEffect(() => {
    setIsMobileOpen(false);
  }, [urlSessionId, setIsMobileOpen]);

  const handleNewSession = useCallback(async () => {
    if (isCreating || loading) return;

    setIsCreating(true);
    try {
      const newSessionId = await createNewSession();
      if (newSessionId) {
        navigate(`/chat/${newSessionId}`);
      }
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, loading, createNewSession, navigate]);

  const handleSwitchSession = useCallback((sessionId) => {
    // Don't switch if already on this session or if loading
    if (sessionId === urlSessionId || loading) return;

    // Navigate - Chat.jsx handles the actual session loading
    navigate(`/chat/${sessionId}`);
  }, [urlSessionId, loading, navigate]);

  const handleRetryLoad = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();

    if (window.confirm('¿Estás seguro de que deseas eliminar esta conversación?')) {
      setDeletingId(sessionId);
      const success = await removeSession(sessionId);

      if (success && sessionId === urlSessionId) {
        navigate('/');
      }

      setDeletingId(null);
    }
  };

  // Convert timestamp to Date (handles both seconds and milliseconds)
  const toDate = (ts) => new Date(ts < 10000000000 ? ts * 1000 : ts);

  const formatDate = (timestamp) => {
    const date = toDate(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Filter out empty sessions (no messages) and group by date
  const nonEmptySessions = sessions.filter(session => (session.MessageCount || 0) > 0);

  const groupedSessions = nonEmptySessions.reduce((groups, session) => {
    const timestamp = session.UpdatedAt || session.CreatedAt;
    const now = new Date();
    const sessionDate = toDate(timestamp);  // Handles both seconds and milliseconds
    const diffInDays = Math.floor((now - sessionDate) / (1000 * 60 * 60 * 24));

    let groupKey;
    if (diffInDays === 0) groupKey = 'Hoy';
    else if (diffInDays === 1) groupKey = 'Ayer';
    else if (diffInDays < 7) groupKey = 'Últimos 7 días';
    else if (diffInDays < 30) groupKey = 'Últimos 30 días';
    else groupKey = 'Más antiguo';

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(session);
    return groups;
  }, {});

  const groupOrder = ['Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días', 'Más antiguo'];

  // Collapsed view (desktop only)
  if (isCollapsed) {
    return (
      <div className="hidden lg:flex w-12 bg-brand-primary-900 text-white flex-col items-center py-4 border-r border-brand-primary-800">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-brand-primary-800 rounded-lg transition-colors"
          title="Expandir sidebar"
        >
          <ChevronRight size={20} />
        </button>
        <button
          onClick={handleNewSession}
          className="p-2 hover:bg-brand-primary-800 rounded-lg transition-colors mt-4"
          title="Nueva conversación"
        >
          <MessageSquarePlus size={20} />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:relative
        inset-y-0 left-0
        w-72 bg-brand-primary-900 text-white flex flex-col border-r border-brand-primary-800
        z-40 lg:z-auto
        transition-transform duration-300 ease-in-out
      `}>
      {/* Header */}
      <div className="p-4 border-b border-brand-primary-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversaciones</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="hidden lg:block p-1 hover:bg-brand-primary-800 rounded transition-colors"
          title="Colapsar sidebar"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewSession}
          disabled={loading || isCreating}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-brand-primary-800 hover:bg-brand-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="font-medium">Creando...</span>
            </>
          ) : (
            <>
              <MessageSquarePlus size={20} />
              <span className="font-medium">Nueva conversacion</span>
            </>
          )}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {/* Error state with retry */}
        {error && sessions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto mb-2 text-red-400" size={24} />
            <p className="text-brand-primary-200 text-sm mb-3">{error}</p>
            <button
              onClick={handleRetryLoad}
              disabled={loading}
              className="flex items-center gap-2 mx-auto px-3 py-1.5 bg-brand-primary-800 hover:bg-brand-primary-700 rounded text-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Reintentar
            </button>
          </div>
        ) : loading && sessions.length === 0 ? (
          <div className="text-brand-primary-200 text-center py-8 flex flex-col items-center">
            <Loader2 className="animate-spin mb-2" size={24} />
            Cargando conversaciones...
          </div>
        ) : nonEmptySessions.length === 0 ? (
          <div className="text-brand-primary-200 text-center py-8">
            No hay conversaciones aun.
            <br />
            <span className="text-sm">Envia un mensaje para comenzar</span>
          </div>
        ) : (
          groupOrder.map(groupKey => {
            const groupSessions = groupedSessions[groupKey];
            if (!groupSessions || groupSessions.length === 0) return null;

            return (
              <div key={groupKey} className="mb-4">
                <h3 className="text-xs font-semibold text-brand-primary-200 uppercase tracking-wider mb-2 px-2">
                  {groupKey}
                </h3>
                <div className="space-y-1">
                  {groupSessions.map((session) => {
                    // Session is active if it matches URL (primary) or context (fallback)
                    const isActive = session.SessionId === urlSessionId;
                    const isDeleting = deletingId === session.SessionId;
                    const isDisabled = isDeleting || loading;

                    return (
                      <div
                        key={session.SessionId}
                        onClick={() => !isDisabled && handleSwitchSession(session.SessionId)}
                        className={`
                          group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                          ${isActive ? 'bg-brand-primary-800 text-white' : 'hover:bg-brand-primary-800 text-brand-primary-100'}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <MessageSquare size={16} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm truncate"
                            title={session.Title || 'Nueva conversación'}
                          >
                            {session.Title || 'Nueva conversación'}
                          </p>
                          {session.MessageCount > 0 && (
                            <p className="text-xs text-brand-primary-300">
                              {session.MessageCount} mensajes
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(session.SessionId, e)}
                          className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-brand-primary-700 rounded transition-all"
                          title="Eliminar conversación"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
    </>
  );
}
