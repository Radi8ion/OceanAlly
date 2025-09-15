import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { IUser } from '../types';

// Extend the Express Request type to include the 'user' property
declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
      auth?: {
        userId: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Step 1: Protect routes with Clerk's built-in middleware.
 * This middleware checks for a valid Clerk session token. If it's not valid,
 * it returns a 401 Unauthorized error. If it is valid, it populates `req.auth`.
 */
export const protect = ClerkExpressRequireAuth();

/**
 * Step 2: Middleware to fetch and attach our internal user model.
 * This should run *after* the `protect` middleware. It uses the `userId`
 * from `req.auth` (which is the Clerk ID) to find the corresponding user
 * in our own MongoDB database.
 */
export const attachUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.auth?.userId) {
    res.status(401).json({ message: 'Not authorized, no user ID in request.' });
    return;
  }

  try {
    const user = await User.findOne({ clerkId: req.auth.userId });

    if (!user) {
      // User exists in Clerk but not in our database
      res.status(404).json({ message: 'User not found in our system.' });
      return;
    }

    req.user = user as IUser; // Attach the user document to the request
    next();
  } catch (error) {
    console.error("Error attaching user:", error);
    res.status(500).json({ message: 'Server error while fetching user data.' });
    return;
  }
};

/**
 * Step 3: Role-based authorization middleware.
 * This is a higher-order function that takes an array of allowed roles.
 * It checks if the `req.user.role` is included in the roles array.
 * 
 * @param roles - An array of strings representing allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ message: 'Not authorized, user data is missing.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: `Forbidden: User with role '${req.user.role}' is not authorized to access this resource.` 
      });
      return;
    }

    next();
  };
};