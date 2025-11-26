import { Amplify, API, Auth } from "aws-amplify";

const env = import.meta.env; // Vite environment variables

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

// Session Management API Functions

export async function listUserSessions() {
  return await API.get(
    env.VITE_API_GATEWAY_REST_API_NAME,
    "/sessions",
    {}
  );
}

export async function createSession(title = "Nueva conversación") {
  return await API.post(
    env.VITE_API_GATEWAY_REST_API_NAME,
    "/sessions",
    {
      body: { title },
    }
  );
}

export async function deleteSession(sessionId) {
  return await API.del(
    env.VITE_API_GATEWAY_REST_API_NAME,
    `/sessions/${sessionId}`,
    {}
  );
}

export async function getSessionMessages(sessionId) {
  return await API.get(
    env.VITE_API_GATEWAY_REST_API_NAME,
    `/sessions/${sessionId}/messages`,
    {}
  );
}

export async function updateSessionTitle(sessionId, title) {
  return await API.patch(
    env.VITE_API_GATEWAY_REST_API_NAME,
    `/sessions/${sessionId}`,
    {
      body: { title },
    }
  );
}
