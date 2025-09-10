import dotenv from 'dotenv';
dotenv.config();
import './config/passport'; 
import passport from 'passport';
import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io'; // Import Socket type
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.routes';
import { reportRoutes, registerReportSocketHandlers } from './routes/report.routes'; // <-- MODIFICATION: Import the socket handler
import dashboardRoutes from './routes/dashboard.routes';

const app: Express = express();
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST", "PUT"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes(io)); // Pass io for HTTP routes (verify/reject)
app.use('/api/v1/dashboard', dashboardRoutes);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in your .env file');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- MODIFICATION: Updated Socket.IO connection logic ---
io.on('connection', (socket: Socket) => { // Use the imported Socket type
  console.log('A user connected:', socket.id);

  // Automatically join the public room for general broadcasts
  socket.join('public');

  // Register the specific handlers for creating reports
  // This function contains the `socket.on('create-report', ...)` listener
  registerReportSocketHandlers(io, socket);

  // You can keep other general listeners here
  socket.on('join-officials-room', () => {
    // In a real app, you would add authentication here to ensure only officials can join
    console.log(`Socket ${socket.id} is attempting to join officials room.`);
    socket.join('officials');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
// --- END MODIFICATION ---

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});