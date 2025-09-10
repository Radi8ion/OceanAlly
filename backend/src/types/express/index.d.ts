// src/types/express/index.d.ts

import { IUser } from '../../types'; // 👈 Adjust this import path to point to your main types file where IUser is defined

declare global {
  namespace Express {
    // Augment the User interface that Passport.js attaches to the request
    export interface User extends IUser {}

    // Augment the Request interface to ensure the user property is recognized
    export interface Request {
      user?: User;
    }
  }
}

// If you're not using modules, you might need to export something
// to make this file a module.
export {};