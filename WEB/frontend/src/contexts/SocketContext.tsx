import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const initializeSocket = async () => {
      // Only initialize socket if user is authenticated
      if (!isLoaded || !isSignedIn) {
        return;
      }

      try {
        // Get the Clerk token for authentication
        const token = await getToken();
        if (!token) {
          console.error('No authentication token available');
          return;
        }

        // Create socket connection with authentication
        socketInstance = io( 'http://localhost:5000', {
          auth: {
            token, // Send the Clerk token for authentication
          },
          transports: ['websocket'], // Use websocket transport
        });

        // Set up event listeners
        socketInstance.on('connect', () => {
          console.log('Connected to server');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('Disconnected from server');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
        });

        // Authentication error handler
        socketInstance.on('authentication_error', (error) => {
          console.error('Socket authentication error:', error);
          setIsConnected(false);
        });

        setSocket(socketInstance);

      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [getToken, isSignedIn, isLoaded]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};