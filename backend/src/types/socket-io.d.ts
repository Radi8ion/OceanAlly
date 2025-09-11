import { IUser } from '.'; // Adjust this import path to your main types file

// By augmenting the 'socket.io' module, we can add our custom properties
declare module 'socket.io' {
  // Augment the Socket interface
  interface Socket {
    user?: IUser; // Define the user property, making it optional
  }
}
