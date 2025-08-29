# Claude Code Session Summary

## Project Overview
Jurisprudencia Assistant - Frontend React app with WebSocket-based chat interface for legal jurisprudence queries.

## Environment Setup
```bash
# Development
npm run dev         # Starts dev server on http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint check
```

## Key Components

### WebSocket Configuration
- **Endpoint**: `wss://ka7psvo5u9.execute-api.us-east-1.amazonaws.com/dev` (PoderJudicialBackendStackAOSS)
- **Auth**: JWT token via Cognito
- **Session management**: Uses custom_session_id placeholder for future DynamoDB integration

### Text Formatting Implementation
- **Bold text**: `**text**` → ReactMarkdown formatting
- **Typing effect**: Custom TypedMarkdown component with line-by-line display (80ms/line)
- **Component**: `src/components/MessageBubble.jsx` - TypedMarkdown function (lines 19-52)

### Sources/PDFs Detection
- Sources come via WebSocket as `data.retrieved_sources_info`
- Format: `{ document: '...', page: '...' }`
- PDF URLs: `https://wais-jurisprudencia-tucuman.s3.us-east-1.amazonaws.com/${docName}.pdf`
- Component: `src/components/Sources.jsx`

## AWS Deployment

### Current Setup
- **Repository**: `https://github.com/GeraCollante/Wais-jurisprudencia-bedrock-agent-conv-assistant-frontend`
- **Auto-deploy**: Enabled on `main` branch via AWS Amplify
- **Stack**: CloudFormation stack name `webapp`

### Deployment Options
1. **Auto-deploy (recommended)**: Push to GitHub → Amplify auto-builds
2. **Manual**: `./scripts/create_amplify.sh` or CloudFormation deploy

### Environment Variables
```bash
VITE_WEBSOCKET_URL=wss://ka7psvo5u9.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_6xSJzGMnf
VITE_COGNITO_USER_POOL_CLIENT_ID=24cntc6a7ctm22stjn91hdp8tg
# See .env.local for full list
```

## Dependencies Added
- `react-markdown@^10.1.0` - For robust text formatting

## Known Issues Fixed
- WebSocket endpoint confusion (was pointing to wrong service)
- ReactMarkdown + Typist compatibility issues
- Smooth formatting during typing animation

## Next Steps
- Consider git init + remote setup for auto-deploy workflow
- Test TypedMarkdown with real jurisprudence responses
- Validate PDF source links functionality