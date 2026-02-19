import { Amplify, API, Auth } from "aws-amplify";

const env = import.meta.env; // Vite environment variables

// Function URL for unified backend
const FUNCTION_URL = env.VITE_CHAT_STREAM_FUNCTION_URL;

Amplify.configure({
  Auth: {
    region: env.VITE_REGION_NAME,
    userPoolId: env.VITE_COGNITO_USER_POOL_ID,
    userPoolWebClientId: env.VITE_COGNITO_USER_POOL_CLIENT_ID,
    identityPoolId: env.VITE_COGNITO_IDENTITY_POOL_ID,
  },
  API: {
    endpoints: [
      {
        name: env.VITE_API_GATEWAY_REST_API_NAME,
        endpoint: env.VITE_API_GATEWAY_REST_API_ENDPOINT,
        custom_header: async () => {
          return {
            Authorization: (await Auth.currentSession())
              .getIdToken()
              .getJwtToken(),
          };
        },
      },
    ],
  },
});

// Helper function to call our unified backend (with auth)
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

// Legacy functions (keeping for compatibility)
export async function postQuery(queryObject) {
  return await API.post(
    env.VITE_API_GATEWAY_REST_API_NAME,
    "conversationalAssistant/query",
    {
      body: queryObject,
    },
  );
}

export async function postRating(ratingObject) {
  return await API.post(
    env.VITE_API_GATEWAY_REST_API_NAME,
    "conversationalAssistant/rating",
    {
      body: ratingObject,
    },
  );
}

// ============================================================================
// SESSION MANAGEMENT - Using unified backend (Function URL)
// ============================================================================

export async function listUserSessions() {
  return await callBackend('list_sessions');
}

export async function createSession(title = "Nueva conversación") {
  const response = await callBackend('create_session', { title });
  return {
    session_id: response.session_id,
    ...response.session,
  };
}

export async function deleteSession(sessionId) {
  return await callBackend('delete_session', { session_id: sessionId });
}

export async function getSessionMessages(sessionId) {
  const response = await callBackend('get_messages', { session_id: sessionId });

  // Transform API format to frontend format
  // API returns: { timestamp, user_query, bot_response, sources }
  // Frontend expects: { id, content, message_type, sources }
  const transformedMessages = [];

  if (response.messages && Array.isArray(response.messages)) {
    for (const msg of response.messages) {
      // Add question message
      transformedMessages.push({
        id: `${msg.timestamp}_q`,
        content: msg.user_query,
        message_type: 'question',
        timestamp: msg.timestamp,
      });

      // Add answer message
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
  return await callBackend('update_session', { session_id: sessionId, title });
}
