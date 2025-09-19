import { Router } from 'express';
import {
  getVerifiedReports,
  getUnverifiedReports,
  verifyReport,
  rejectReport,
  handleCreateReportSocket,getReports
} from '../controllers/report.controller';
import { protect, attachUser, authorize } from '../middleware/auth.middleware';
import { Server as SocketIOServer, Socket } from 'socket.io';

/**
 * Creates the router with Socket.IO instance attached
 */
export const createReportRouter = (io: SocketIOServer) => {
  const router = Router();

  /**
   * Middleware to attach the Socket.IO server instance to requests
   */
  const attachIO = (req: any, res: any, next: any) => {
    req.io = io;
    next();
  };
  
  // Attach io to all routes in this router
  router.use(attachIO);

router.get('/', protect, attachUser, getReports);

  // --- Public Routes (for authenticated users) ---
  router.get('/verified', 
    protect, 
    getVerifiedReports
  );

  // --- Official-Only Routes ---
  router.get('/unverified', 
    protect, 
    attachUser, 
    authorize(['official', 'admin']), 
    getUnverifiedReports
  );

  router.put('/:id/verify', 
    protect, 
    attachUser, 
    authorize(['official', 'admin']), 
    verifyReport // io is already attached via middleware
  );
  
  router.delete('/:id/reject', 
    protect, 
    attachUser, 
    authorize(['official', 'admin']), 
    rejectReport // io is already attached via middleware
  );

  return router;
};

/**
 * Default export for backward compatibility
 */
export const reportRoutes = createReportRouter;

/**
 * Socket.IO event handler registration
 * This function sets up all the socket event handlers for reports
 */
export const registerReportSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle report creation via socket
    socket.on('create-report', async (data: any) => {
      await handleCreateReportSocket(socket, data, io);
    });

    // Handle user joining rooms based on their role
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};