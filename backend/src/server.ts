import dotenv from 'dotenv';
dotenv.config();
import './config/passport'; 
import passport from 'passport';
import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io'; // Import Socket type
import cors from 'cors';
import mongoose from 'mongoose';
import { socketAuthMiddleware } from './middleware/socket.middleware';
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

io.use(socketAuthMiddleware);

io.on('connection', (socket: Socket) => {
  console.log(`Authenticated user connected: ${socket.user?.email} (${socket.id})`);

  // Automatically join the public room for general broadcasts
  socket.join('public');

  // **ROLE-BASED ROOM JOINING**
  // Since authentication is done, we can now safely check the user's role
  if (socket.user && (socket.user.role === 'official' || socket.user.role === 'admin')) {
    console.log(`User ${socket.user.email} joined the 'officials' room.`);
    socket.join('officials');
  }

  // Register the specific handlers for creating reports
  registerReportSocketHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user?.email} (${socket.id})`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});