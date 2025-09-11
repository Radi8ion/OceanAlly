import { io } from 'socket.io-client';

// 1. Define the URL of your backend server.
// It's best practice to use an environment variable for your live production URL.
const URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-live-backend-url.com' 
    : 'http://localhost:5000';

// 2. Retrieve the authentication token from localStorage.
// This will be null if the user is not logged in.
const token = localStorage.getItem('token');

// 3. Create and export the single socket instance.
// This instance will be imported and used by the rest of your application.
export const socket = io(URL, {
  // `autoConnect: false` is important. Your SocketProvider will call `socket.connect()`
  // manually, which gives you more control over when the connection is established.
  autoConnect: false,
  
  // The `auth` object is where you send credentials to the server's
  // socket authentication middleware.
  auth: {
    token: token
  },
});
