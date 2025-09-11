import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { IUser } from '../types'; // Adjust import path if necessary

/**
 * Socket.IO middleware for authenticating users via JWT.
 * It verifies the token provided in the socket's handshake query.
 * If valid, it attaches the user object to the socket for use in event handlers.
 * @param socket The client's socket instance.
 * @param next The function to call to pass control to the next middleware or event handler.
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    // The standard way to pass auth details is via `socket.handshake.auth`
    const token = socket.handshake.auth.token;

    if (!token) {
      // Create a new Error object for failed authentication
      return next(new Error('Authentication error: No token provided.'));
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    // Find the user in the database based on the token's ID
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found.'));
    }

    // 👈 *** THE IMPORTANT PART ***
    // Attach the user object to the socket instance for future use
    socket.user = user as IUser;

    // Grant connection
    next();

  } catch (error) {
    // If token is invalid or any other error occurs, deny connection
    console.error('Socket authentication failed:', error);
    return next(new Error('Authentication error: Invalid token.'));
  }
};
