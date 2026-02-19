import { Amplify, API, Auth } from "aws-amplify";

const env = import.meta.env; // Vite environment variables

// Function URL for unified backend
const FUNCTION_URL = env.VITE_CHAT_STREAM_FUNCTION_URL;

// Detect if API Gateway is configured (AOSS stack has separate session endpoints)
const HAS_API_GATEWAY = !!(env.VITE_API_GATEWAY_REST_API_NAME && env.VITE_API_GATEWAY_REST_API_ENDPOINT);
const API_NAME = env.VITE_API_GATEWAY_REST_API_NAME;

Amplify.configure({
  Auth: {
    region: env.VITE_REGION_NAME,
    userPoolId: env.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: env.VITE_COGNITO_USER_POOL_CLIENT_ID,
    identityPoolId: env.VITE_COGNITO_IDENTITY_POOL_ID,
  },
  API: {
    endpoints: HAS_API_GATEWAY ? [
      {
        name: API_NAME,
        endpoint: env.VITE_API_GATEWAY_REST_API_ENDPOINT,
        custom_header: async () => {
          return {
            Authorization: (await Auth.currentSession())
              .getIdToken()
              .getJwtToken(),
          };
        },
      },
    ] : [],
  },
});

// Helper function to call unified backend via Function URL (used by WebAppCheap)
async function callBackend(action, params = {}) {
  const { authenticatedFetch } = await import('./services/authService');

  const response = await authenticatedFetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// SESSION MANAGEMENT
// Uses API Gateway REST when available (AOSS stack), else Function URL (Cheap)
// ============================================================================

export async function listUserSessions() {
  if (HAS_API_GATEWAY) {
    return await API.get(API_NAME, "/sessions");
  }
  return await callBackend('list_sessions');
}

export async function createSession(title = "Nueva conversación") {
  if (HAS_API_GATEWAY) {
    const response = await API.post(API_NAME, "/sessions", {
      body: { title },
    });
    return {
      session_id: response.session_id,
      ...response,
    };
  }
  const response = await callBackend('create_session', { title });
  return {
    session_id: response.session_id,
    ...response.session,
  };
}

export async function deleteSession(sessionId) {
  if (HAS_API_GATEWAY) {
    return await API.del(API_NAME, `/sessions/${sessionId}`);
  }
  return await callBackend('delete_session', { session_id: sessionId });
}

export async function getSessionMessages(sessionId) {
  if (HAS_API_GATEWAY) {
    const response = await API.get(API_NAME, `/sessions/${sessionId}/messages`);
    // API Gateway response already has messages in the right format
    // { messages: [{id, message_type, content, sources, timestamp}], session_id, count }
    return response;
  }

  // Function URL (Cheap) returns different format, needs transformation
  const response = await callBackend('get_messages', { session_id: sessionId });

  const transformedMessages = [];
  if (response.messages && Array.isArray(response.messages)) {
    for (const msg of response.messages) {
      transformedMessages.push({
        id: `${msg.timestamp}_q`,
        content: msg.user_query,
        message_type: 'question',
        timestamp: msg.timestamp,
      });
      transformedMessages.push({
        id: `${msg.timestamp}_a`,
        content: msg.bot_response,
        message_type: 'answer',
        sources: msg.sources || [],
        timestamp: msg.timestamp,
      });
    }
  }

  return {
    ...response,
    messages: transformedMessages,
  };
}

export async function updateSessionTitle(sessionId, title) {
  if (HAS_API_GATEWAY) {
    return await API.patch(API_NAME, `/sessions/${sessionId}`, {
      body: { title },
    });
  }
  return await callBackend('update_session', { session_id: sessionId, title });
}
