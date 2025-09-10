// This file extends the default Socket.IO Socket interface
// to include a custom 'user' property for authenticated users.

import 'socket.io';

declare module 'socket.io' {
  interface Socket {
    user?: {
      _id: string;
      // You can add other user properties here if needed
      // e.g., email: string; role: string;
    };
  }
}