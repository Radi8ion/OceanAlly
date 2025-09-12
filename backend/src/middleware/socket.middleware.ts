// src/middleware/socket.middleware.ts
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model'; // Adjust import path as needed

interface DecodedToken {
  id: string; // Changed from _id to id to match your JWT structure
  iat: number;
  exp: number;
}

export const socketAuthMiddleware = async (socket: Socket, next: Function) => {
  try {
    // Get token from handshake auth or headers
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                  socket.handshake.query?.token; // Also check query params
    
    console.log('🔍 Socket token check:', {
      authToken: socket.handshake.auth?.token ? 'Present' : 'Missing',
      headerToken: socket.handshake.headers?.authorization ? 'Present' : 'Missing',
      queryToken: socket.handshake.query?.token ? 'Present' : 'Missing',
      finalToken: token ? 'Found' : 'Not found'
    });
    
    if (!token) {
      console.log('❌ Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET not found in environment variables');
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    console.log('🔍 Decoded JWT for socket:', decoded);
    
    // Find user in database using the correct field name
    const user = await User.findById(decoded.id).select('-password'); // Changed from decoded._id to decoded.id
    if (!user) {
      console.log('❌ Socket connection rejected: User not found for ID:', decoded.id);
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.user = {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`
    };

    console.log(`✅ Socket authenticated for user: ${user.email} (${user.role})`);
    next();
    
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication error: Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication error: Token expired'));
    } else {
      return next(new Error('Authentication error: Server error'));
    }
  }
};