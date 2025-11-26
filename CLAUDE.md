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

## ⚠️ PENDING: Verificar Fix de Tablas DynamoDB (2025-01-23)

### Problema Identificado:
- **GetSessionMessages** Lambda estaba leyendo de tabla inexistente: `GenAIChatbotMemory`
- **InvokeLLM** Lambda guardaba en tabla real: `PoderJudicialBackendStack-RAGWorkflowGenAIChatbotMemory72256F02-I0YXXZLXX1RC`
- **Resultado**: Mensajes se guardaban pero NO se recuperaban al hacer click en sesión del navbar

### Fix Aplicado (Backend):
**Archivo**: `/WAIS-jurisprudencia-back-end/infra/stacks/__init__.py` línea 158

**ANTES:**
```python
history_table_name = "GenAIChatbotMemory"  # ❌ Hardcoded - tabla NO existe
```

**DESPUÉS:**
```python
history_table_name = self.rag_workflow.history_table.table_name  # ✅ Referencia correcta
```

**Deploy**: ✅ Completado exitosamente (PoderJudicialBackendStack UPDATE_COMPLETE)

**Variable de entorno actualizada:**
- Lambda: `PoderJudicialBackendStack-SessionManagementGetSess-hPwi3np7IVOR`
- Env var: `DYNAMO_DB_HISTORY_TABLE_NAME` = `PoderJudicialBackendStack-RAGWorkflowGenAIChatbotMemory72256F02-I0YXXZLXX1RC`

### TODO: Verificar Fix
1. ✅ Deploy completado
2. ⏳ **PENDIENTE**: Usuario debe enviar mensaje nuevo desde frontend
3. ⏳ **PENDIENTE**: Hacer click en sesión en navbar
4. ⏳ **PENDIENTE**: Verificar que mensajes se cargan correctamente

**Si funciona**: Los mensajes deben aparecer al hacer click en la sesión.
**Si NO funciona**: Revisar logs de GetSessionMessages Lambda.

---

## 🚀 **MIGRACIÓN COMPLETADA: WebSocket → Function URL Streaming (2025-11-25)**

### Cambios Realizados:

**Backend**:
- ✅ Nuevo Lambda: `ChatStreamHandler` con Function URL
- ✅ Streaming real con `InvokeModelWithResponseStreamCommand` (Bedrock) y OpenAI `stream=True` (Grok)
- ✅ RAG integrado directamente (no más Lambda separado)
- ✅ Timeout: 900s (15 minutos) - soporta queries largas de Grok

**Frontend**:
- ✅ Nuevo hook: `useFunctionURLStream.js`
- ✅ Chat.jsx actualizado para usar streaming HTTP
- ✅ Formato NDJSON (newline-delimited JSON)
- ✅ Streaming en tiempo real como ChatGPT

**Function URL**: `https://vhwqtheewny2kr5etze4xisw6m0fjzla.lambda-url.us-east-1.on.aws/`

### Beneficios:
- ✅ **No más timeout de 30 segundos** - Grok puede tomar 40-50s sin problemas
- ✅ **Streaming real** - Usuario ve tokens mientras se generan
- ✅ **Arquitectura más simple** - 1 Lambda en lugar de 4
- ✅ **Mejor debugging** - Logs consolidados en un solo lugar

### Testing:
1. **Reiniciar dev server**: `npm run dev` (para cargar nueva .env.local)
2. **Hacer login** en la aplicación
3. **Enviar query**: Tanto Sonnet como Grok deberían funcionar con streaming
4. **Verificar**: Los tokens aparecen en tiempo real (no todo de golpe)

### Rollback:
Si hay problemas, WebSocket aún está disponible. Solo hay que revertir Chat.jsx y comentar `VITE_CHAT_STREAM_FUNCTION_URL` en .env.local.

---

## Next Steps
- 🔄 **URGENTE**: Testear streaming end-to-end desde frontend
- Monitorear CloudWatch logs del ChatStreamHandler Lambda
- Verificar que queries largas de Grok completen exitosamente
- Si funciona bien por 48 horas, considerar eliminar infraestructura WebSocket