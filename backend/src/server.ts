import dotenv from 'dotenv';
dotenv.config();
import './config/passport';
import passport from 'passport';
import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { socketAuthMiddleware } from './middleware/socket.middleware';
import authRoutes from './routes/auth.routes';
import { reportRoutes, registerReportSocketHandlers } from './routes/report.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Express = express();
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "*",
    methods: ["GET", "POST", "PUT"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes(io));
app.use('/api/v1/dashboard', dashboardRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in your .env file');
  process.exit(1);
}

// Connect to MongoDB with better error handling
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully.');
    
    // Only start Socket.IO after DB connection
    initializeSocketIO();
    
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

function initializeSocketIO() {
  // Socket middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    try {
      console.log(`✅ Authenticated user connected: ${socket.user?.email} (${socket.id})`);

      // Join public room
      socket.join('public');

      // Role-based room joining
      if (socket.user && (socket.user.role === 'official' || socket.user.role === 'admin')) {
        console.log(`🏛️ User ${socket.user.email} joined the 'officials' room.`);
        socket.join('officials');
      }

      // Register report socket handlers
      registerReportSocketHandlers(io, socket);

      socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${socket.user?.email} (${socket.id}) - Reason: ${reason}`);
      });

      // Handle socket errors
      socket.on('error', (error) => {
        console.error(`🔥 Socket error for user ${socket.user?.email}:`, error);
      });

    } catch (error) {
      console.error('🔥 Error in socket connection handler:', error);
      socket.disconnect(true);
    }
  });

  // Handle io errors
  io.on('error', (error) => {
    console.error('🔥 Socket.IO server error:', error);
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});





// Export for use in other modules if needed
export { io };