"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReportSocketHandlers = exports.reportRoutes = exports.createReportRouter = void 0;
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const createReportRouter = (io) => {
    const router = (0, express_1.Router)();
    const attachIO = (req, res, next) => {
        req.io = io;
        next();
    };
    router.use(attachIO);
    router.get('/', auth_middleware_1.protect, auth_middleware_1.attachUser, report_controller_1.getReports);
    router.get('/verified', auth_middleware_1.protect, report_controller_1.getVerifiedReports);
    router.get('/unverified', auth_middleware_1.protect, auth_middleware_1.attachUser, (0, auth_middleware_1.authorize)(['official', 'admin']), report_controller_1.getUnverifiedReports);
    router.put('/:id/verify', auth_middleware_1.protect, auth_middleware_1.attachUser, (0, auth_middleware_1.authorize)(['official', 'admin']), report_controller_1.verifyReport);
    router.delete('/:id/reject', auth_middleware_1.protect, auth_middleware_1.attachUser, (0, auth_middleware_1.authorize)(['official', 'admin']), report_controller_1.rejectReport);
    return router;
};
exports.createReportRouter = createReportRouter;
exports.reportRoutes = exports.createReportRouter;
const registerReportSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on('create-report', async (data) => {
            await (0, report_controller_1.handleCreateReportSocket)(socket, data, io);
        });
        socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`User ${socket.id} joined room: ${room}`);
        });
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
exports.registerReportSocketHandlers = registerReportSocketHandlers;
