import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [wsStatus, setWsStatus] = useState('disconnected');

  return (
    <WebSocketContext.Provider value={{ wsStatus, setWsStatus }}>
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired
};
