import { Socket } from 'socket.io';
import { clerkClient } from '@clerk/clerk-sdk-node';
import User from '../models/user.model';
import { IUser } from '../types';

// Extend the Socket type to include our custom 'user' property
declare module "socket.io" {
  interface Socket {
    user?: IUser;
  }
}

/**
 * Socket.IO Authentication Middleware using Clerk
 * This function runs for every new socket connection. It validates the Clerk token
 * and attaches the user from our database to the socket instance.
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // Extract token from the 'auth' object sent by the client
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.log('❌ Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify the token with Clerk's backend SDK
    const claims = await clerkClient.verifyToken(token);
    if (!claims || !claims.sub) {
        return next(new Error('Authentication error: Invalid token'));
    }

    // Find the user in our database using the Clerk user ID (from the 'sub' claim)
    const user = await User.findOne({ clerkId: claims.sub });
    if (!user) {
      console.log('❌ Socket connection rejected: User not found for Clerk ID:', claims.sub);
      return next(new Error('Authentication error: User not found in our system'));
    }

    // Attach our user object to the socket instance for use in event handlers
    socket.user = user as IUser;

    console.log(`✅ Socket authenticated for user: ${user.email} (Role: ${user.role})`);
    next(); // Connection approved
    
  } catch (error: any) {
    console.error('❌ Socket authentication error:', error.message);
    return next(new Error('Authentication error: Invalid token'));
  }
};
