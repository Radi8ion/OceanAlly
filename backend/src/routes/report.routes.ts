// src/routes/report.routes.ts

import { Router, Request, Response } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import * as reportController from '../controllers/report.controller';
import { authenticate, authenticateSocket } from '../middleware/auth.middleware';
// The multer upload middleware is no longer needed for report creation
// import upload from '../middleware/upload';

// --- MODIFICATION 1: HTTP routes no longer handle creation ---
export const reportRoutes = (io: SocketIOServer): Router => {
  const router = Router();

  // The POST route for creating a report is now handled by WebSockets and is removed.
  // router.post('/', authenticate, upload.single('media'), (req, res) => reportController.createReport(req, res, io));

  // These routes remain as they are standard GET/PUT requests
  router.get('/verified', (req, res) => reportController.getVerifiedReports(req, res));
  router.get('/unverified', authenticate, (req, res) => reportController.getUnverifiedReports(req, res));
  router.put('/verify/:id', authenticate, (req, res) => reportController.verifyReport(req, res, io));
  router.put('/reject/:id', authenticate, (req, res) => reportController.rejectReport(req, res, io));

  return router;
};

// --- MODIFICATION 2: New function to register socket event handlers ---
/**
 * Registers all socket event handlers related to reports.
 * @param io The main Socket.IO server instance.
 * @param socket The client's socket instance.
 */
export const registerReportSocketHandlers = (io: SocketIOServer, socket: Socket) => {
  
  // Listen for the 'create-report' event from a client
  socket.on('create-report', async (data) => {
    // Authenticate the user via the token sent in the socket payload
    const user = await authenticateSocket(data.token, socket);
    if (user) {
        // If authentication is successful, proceed to handle the report creation
        await reportController.handleCreateReportSocket(socket, data, io);
    }
    // If authenticateSocket fails, it will emit an error and the process stops here.
  });

  // You can add other report-related socket event listeners here in the future
};