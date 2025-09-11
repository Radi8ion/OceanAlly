// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import { IUser } from '../types';

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
      next();
    } catch (error: any) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'No token provided' });
  }
};
// Add this to your src/middleware/auth.middleware.ts

import { Socket } from 'socket.io';


export const authenticateSocket = async (token: string, socket: Socket) => {
  if (!token) {
    socket.emit('report-creation-error', { message: 'Authentication error: Token not provided.' });
    return null;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    // Attach user to the socket for use in other functions
    (socket as any).user = { _id: decoded.userId };
    return decoded;
  } catch (err) {
    socket.emit('report-creation-error', { message: 'Authentication error: Invalid token.' });
    return null;
  }
};