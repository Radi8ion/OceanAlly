import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { socket } from '../socket'; // We will import the instance from your central file

// Create the context
interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

// Create a custom hook for easy access
export const useSocket = () => {
  return useContext(SocketContext);
};

// Create the Provider component that will wrap your app
interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  useEffect(() => {
    // Manually connect when the provider mounts
    // This is useful because we set `autoConnect: false` initially
    socket.connect();

    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected.');
    });

    // Clean up the connection when the app is closed
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
