// src/types/socket.ts
import { Socket as SocketIOSocket } from 'socket.io';

// Extend the Socket interface to include user property
declare module 'socket.io' {
  interface Socket {
    user?: {
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'citizen' | 'official' | 'admin';
    };
  }
}

// Custom socket interface
export interface AuthenticatedSocket extends SocketIOSocket {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'citizen' | 'official' | 'admin';
  };
}

// Socket event data types
export interface CreateReportSocketData {
  token: string;
  hazardType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  latitude: number;
  longitude: number;
  locationDescription: string;
  description: string;
  isEmergency: boolean;
  reporterName: string;
  reporterContact: string;
  media?: {
    buffer: ArrayBuffer;
    mimetype: string;
    originalname: string;
  };
}