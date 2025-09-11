// This file extends the default Socket.IO Socket interface
// to include a custom 'user' property for authenticated users.

import { IUser } from '../types'; // 👈 STEP 1: Import the correct interface

declare module 'socket.io' {
  interface Socket {
    // 👇 STEP 2: Use the imported IUser interface
    user?: IUser;
  }
}

