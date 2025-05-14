import React, { useState, createContext, useEffect, useRef } from "react";
import MessageList from "@components/MessageList";
import InputPrompt from "@components/InputPrompt";
import { nanoid, customAlphabet } from "nanoid";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTranslation } from 'react-i18next';

const mockMessages = true; // Begin with preloaded or initialMessages

const LoaderContext = createContext(false);
const sessionId = customAlphabet("1234567890", 20)();
const wsURL = "wss://gxufr58l5h.execute-api.us-east-1.amazonaws.com/dev"; // Replace with your WebSocket server URL

export default function Chat() {
  const { t } = useTranslation();

  const initialMessages = [
    {
      id: "welcome", // "welcome" as id is checked to display/hide MessageActions for the first message
      content: t("welcome"),
      message_type: "answer",
    },
  ];

  const [currentSessionId] = useState(sessionId);
  const [messages, setMessages] = useState(
    (mockMessages && initialMessages) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const {
    user: { username },
  } = useAuthenticator((context) => [context.user]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => {
      console.log("WS Conectado.");
    };

    ws.current.onmessage = (event) => {
      
      const data = JSON.parse(event.data);
      if(!data.message){
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: nanoid(),
            author: username,
            message_type: "answer",
            question: data.question.trim(),
            content: data.answers.trim(),
            sources: data.sources,
            timestamp: Date.now(),
            rating: null,
            session_id: currentSessionId,
          },
        ]);
        setIsLoading(false);
      }
      else{
        console.log("error",event)
      }
    };

    ws.current.onerror = (error) => {
      console.error("WS Error:", error);
    };

    ws.current.onclose = () => {
      console.log("WS Desconectado");
    };

    // Cerrar el WS cuando el componente se desmonta.
    return () => {
      ws.current.close();
    };
  }, []);

  const sendMessage = async (message) => {

    setMessages((prevMessages) => [...prevMessages, message]);
    setIsLoading(true);

    const queryObject = JSON.stringify({
      query: message.content,
      session_id: currentSessionId,
    })

    ws.current.send(queryObject);
  };

  const setMessageRating = async (
    { id, session_id, question, content: answer, author, timestamp },
    newRating
  ) => {

    console.log("entro en ratings")
    const ratingObject = {
      session_id,
      question,
      answer,
      author,
      timestamp,
      rating: newRating,
    };

    ws.current.send(JSON.stringify({ type: "rating", ...ratingObject }));

    setMessages((prevMessages) =>
      prevMessages.map((item) =>
        item.id === id ? { ...item, rating: newRating } : item
      )
    );
  };

  return (
    <LoaderContext.Provider value={isLoading}>
      <div className="flex min-h-[0px] flex-1 flex-col p-2">
        <MessageList messages={messages} setMessageRating={setMessageRating} />
        <InputPrompt sendMessage={sendMessage} LoaderContext={LoaderContext} />
      </div>
    </LoaderContext.Provider>
  );
}
