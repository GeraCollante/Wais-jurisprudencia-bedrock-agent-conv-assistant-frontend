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

// URL del servidor WebSocket, cambiarla por la de tu servidor
const wsURL = "wss://ka7psvo5u9.execute-api.us-east-1.amazonaws.com/dev"; 

export default function Chat() {
  // Hook de traducción para internacionalización
  const { t } = useTranslation();

  // Mensajes iniciales, incluyendo un mensaje de bienvenida traducido
  const initialMessages = [
    {
      id: "welcome", // El id "welcome" se utiliza para controlar la visualización de acciones en el primer mensaje
      content: t("welcome"),
      message_type: "answer", // Define el tipo de mensaje como respuesta
    },
  ];

  // Estado para mantener el ID de la sesión actual
  const [currentSessionId] = useState(sessionId);

  // Estado para mantener la lista de mensajes
  const [messages, setMessages] = useState(
    (mockMessages && initialMessages) || []
  );

  // Estado para manejar si hay una carga en curso
  const [isLoading, setIsLoading] = useState(false);

  // Hook de autenticación para obtener el nombre de usuario
  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);

  // useRef para mantener la referencia al WebSocket
  const ws = useRef(null);

  // Efecto que se ejecuta cuando el componente se monta
  useEffect(() => {

    const fetchSession = async () => {
      try {
        // Obtiene el token de acceso del usuario autenticado
        const session = await Auth.currentSession();
        const access_token = session.getAccessToken().getJwtToken();
      
        // Construye la URL del WebSocket incluyendo el token de acceso
        const url = `${wsURL}?token=${access_token}`;
        console.log(url)

        // Conecta al WebSocket
        ws.current = new WebSocket(url);

        // Evento que se dispara cuando la conexión se abre
        ws.current.onopen = () => {
          console.log("WS Conectado.");
        };
    
        // Evento que se dispara cuando llega un mensaje del WebSocket
        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (!data.message) {
            // Si no hay un mensaje de error, se agrega el mensaje a la lista
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                id: nanoid(), // Genera un ID único para el mensaje
                author: username, // El autor del mensaje es el usuario actual
                message_type: "answer", // Tipo de mensaje como respuesta
                question: data.question.trim(), // La pregunta del usuario
                content: data.answers.trim(), // La respuesta recibida
                sources: data.sources, // Fuentes de la respuesta
                timestamp: Date.now(), // Marca de tiempo actual
                rating: null, // Calificación inicial nula
                session_id: currentSessionId, // ID de la sesión actual
              },
            ]);
            setIsLoading(false); // Finaliza el estado de carga
          } else {
            console.log("error", event);
          }
        };
    
        // Evento que se dispara cuando hay un error en la conexión del WebSocket
        ws.current.onerror = (error) => {
          console.error("WS Error:", error);
        };
    
        // Evento que se dispara cuando la conexión del WebSocket se cierra
        ws.current.onclose = () => {
          console.log("WS Desconectado");
        };

      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    // Llama a la función para obtener la sesión y conectar al WebSocket
    fetchSession();

    // Cierra el WebSocket cuando el componente se desmonta
    return () => {
      ws.current.close();
    };
  }, [currentSessionId, username]);

  // Función para enviar un mensaje a través del WebSocket
  const sendMessage = async (message) => {
    setMessages((prevMessages) => [...prevMessages, message]); // Agrega el mensaje a la lista de mensajes
    setIsLoading(true); // Inicia el estado de carga

    const queryObject = JSON.stringify({
      query: message.content, // El contenido del mensaje
      session_id: currentSessionId, // ID de la sesión actual
    });

    ws.current.send(queryObject); // Envía el mensaje al WebSocket
  };

  // Función para establecer la calificación de un mensaje
  const setMessageRating = async (
    { id, session_id, question, content: answer, author, timestamp },
    newRating
  ) => {
    console.log("entro en ratings");
    const ratingObject = {
      session_id,
      question,
      answer,
      author,
      timestamp,
      rating: newRating, // Nueva calificación del mensaje
    };

    ws.current.send(JSON.stringify({ type: "rating", ...ratingObject })); // Envía la calificación al WebSocket

    setMessages((prevMessages) =>
      prevMessages.map((item) =>
        item.id === id ? { ...item, rating: newRating } : item
      )
    ); // Actualiza la calificación del mensaje en la lista
  };

  return (
    <LoaderContext.Provider value={isLoading}>
      <div className="flex min-h-[0px] flex-1 flex-col p-2">
        {/* Lista de mensajes y componente para calificar mensajes */}
        <MessageList messages={messages} setMessageRating={setMessageRating} />
        {/* Componente para enviar nuevos mensajes */}
        <InputPrompt sendMessage={sendMessage} LoaderContext={LoaderContext} />
      </div>
    </LoaderContext.Provider>
  );
}
