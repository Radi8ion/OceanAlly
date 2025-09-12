import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { IUser } from '../types';
import { Socket } from 'socket.io';

// This interface is for your Express middleware
interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      return next();
    } catch (error: any) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};

// This function is for authenticating a socket connection
export const authenticateSocket = async (token: string, socket: Socket) => {
  if (!token) {
    socket.emit('report-creation-error', { message: 'Authentication error: Token not provided.' });
    return null;
  }
  try {
    // Changed from decoded.userId to decoded.id to match your JWT structure
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id); // Changed from decoded.userId to decoded.id
    if (!user) {
      socket.emit('report-creation-error', { message: 'Authentication error: User not found.' });
      return null;
    }
    // Attach the full user object to the socket in a type-safe way
    socket.user = user;
    return decoded;
  } catch (err) {
    socket.emit('report-creation-error', { message: 'Authentication error: Invalid token.' });
    return null;
  }
};