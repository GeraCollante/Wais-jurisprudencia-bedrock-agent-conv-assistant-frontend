import React, { useState, createContext, useEffect, useRef } from "react";
import MessageList from "@components/MessageList";
import InputPrompt from "@components/InputPrompt";
import { nanoid, customAlphabet } from "nanoid";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTranslation } from 'react-i18next';
import { Auth } from 'aws-amplify';

// Variable para habilitar/deshabilitar la carga de mensajes iniciales
const mockMessages = true;

// Contexto para manejar el estado de carga en el componente
const LoaderContext = createContext(false);

// Generación de un ID de sesión único usando nanoid
const sessionId = customAlphabet("1234567890", 20)();

// URL del servidor WebSocket desde variable de entorno
const wsURL = "wss://xhy5ual0z9.execute-api.us-east-1.amazonaws.com/dev/"; 

export default function Chat({ custom_session_id = null }) {
  const { t } = useTranslation();
  const initialMessages = [
    { id: "welcome", content: t("welcome"), message_type: "answer" },
  ];
  
  // Session ID management - preparado para DynamoDB
  const effectiveSessionId = custom_session_id || sessionId;
  const [currentSessionId] = useState(effectiveSessionId);
  
  const [messages, setMessages] = useState((mockMessages && initialMessages) || []);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);
  const ws = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await Auth.currentSession();
        const token = session.getAccessToken().getJwtToken();
        const url = `${wsURL}?token=${token}`;
        console.log("Conectando WS a:", url);
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          console.log("WS Conectado.");
        };

        ws.current.onmessage = (event) => {
          console.log("WS onmessage event:", event);
          let data;
          try {
            console.log("Raw event.data:", event.data);
            data = JSON.parse(event.data);
            console.log("Parsed data:", data);
          } catch (err) {
            console.warn("Falló JSON.parse en onmessage:", err);
            return;
          }
          // Ignorar mensajes de error
          if (data.message) {
            console.log("Ignorando mensaje de error:", data.message);
            return;
          }

          let questionText = "";
          try {
            // Nueva estructura: original_query es string directo
            questionText = data.original_query ? data.original_query.trim() : "";
            console.log("Extracted questionText:", questionText);
          } catch (err) {
            console.warn("Falló extraer original_query:", err);
          }

          const newMessage = {
            id: nanoid(),
            author: username,
            message_type: "answer",
            question: questionText,
            content: data.analytical_resume.trim(),
            aoss_search_string: data.aoss_search_string,
            sources: data.retrieved_sources_info,
            timestamp: Date.now(),
            rating: null,
            session_id: currentSessionId,
          };
          console.log("Agregando mensaje:", newMessage);
          setMessages((prev) => [...prev, newMessage]);
          setIsLoading(false);
        };

        ws.current.onerror = (err) => {
          console.error("WS Error:", err);
        };
        
        ws.current.onclose = (e) => {
          console.log("WS cerrado:", e);
        };

      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchSession();
    return () => {
      console.log("Cerrando WS");
      ws.current?.close();
    };
  }, [currentSessionId, username]);

  const sendMessage = (message) => {
    console.log("sendMessage mensaje:", message);
    setMessages((prev) => [...prev, message]);
    setIsLoading(true);
    const query = message.content;
    console.log("Enviando por WS:", query);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(query);
    } else {
      console.warn("Intentando enviar mensaje con WS no abierto");
    }
  };

  const setMessageRating = (
    { id, session_id, question, content: answer, author, timestamp },
    newRating
  ) => {
    const ratingObject = {
      session_id,
      question,
      answer,
      author,
      timestamp,
      rating: newRating,
    };
    console.log("Enviando rating:", ratingObject);
    ws.current.send(JSON.stringify({ type: "rating", ...ratingObject }));
    setMessages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rating: newRating } : item
      )
    );
  };

  return (
    <LoaderContext.Provider value={isLoading}>
      <div className="flex min-h-[0px] flex-1 flex-col max-w-4xl mx-auto px-3 pt-3 pb-6 md:p-2 bg-brand-bg-surface text-brand-text-primary">
        <MessageList messages={messages} setMessageRating={setMessageRating} />
        <InputPrompt sendMessage={sendMessage} LoaderContext={LoaderContext} />
      </div>
    </LoaderContext.Provider>
  );
}
