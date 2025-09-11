"use strict";
// src/routes/report.routes.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReportSocketHandlers = exports.reportRoutes = void 0;
const express_1 = require("express");
const reportController = __importStar(require("../controllers/report.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
// The multer upload middleware is no longer needed for report creation
// import upload from '../middleware/upload';
// --- MODIFICATION 1: HTTP routes no longer handle creation ---
const reportRoutes = (io) => {
    const router = (0, express_1.Router)();
    // The POST route for creating a report is now handled by WebSockets and is removed.
    // router.post('/', authenticate, upload.single('media'), (req, res) => reportController.createReport(req, res, io));
    // These routes remain as they are standard GET/PUT requests
    router.get('/verified', (req, res) => reportController.getVerifiedReports(req, res));
    router.get('/unverified', auth_middleware_1.authenticate, (req, res) => reportController.getUnverifiedReports(req, res));
    router.put('/verify/:id', auth_middleware_1.authenticate, (req, res) => reportController.verifyReport(req, res, io));
    router.put('/reject/:id', auth_middleware_1.authenticate, (req, res) => reportController.rejectReport(req, res, io));
    return router;
};
exports.reportRoutes = reportRoutes;
// --- MODIFICATION 2: New function to register socket event handlers ---
/**
 * Registers all socket event handlers related to reports.
 * @param io The main Socket.IO server instance.
 * @param socket The client's socket instance.
 */
const registerReportSocketHandlers = (io, socket) => {
    // Listen for the 'create-report' event from a client
    socket.on('create-report', async (data) => {
        // Authenticate the user via the token sent in the socket payload
        const user = await (0, auth_middleware_1.authenticateSocket)(data.token, socket);
        if (user) {
            // If authentication is successful, proceed to handle the report creation
            await reportController.handleCreateReportSocket(socket, data, io);
        }
        // If authenticateSocket fails, it will emit an error and the process stops here.
    });
    // You can add other report-related socket event listeners here in the future
};
exports.registerReportSocketHandlers = registerReportSocketHandlers;
