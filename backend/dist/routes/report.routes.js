"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController = __importStar(require("../controllers/report.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = __importDefault(require("../middleware/upload")); // --- MODIFICATION 1: Import the upload middleware ---
const reportRoutes = (io) => {
    const router = (0, express_1.Router)();
    // --- MODIFICATION 2: Add the 'upload.single('media')' middleware ---
    // This middleware will process a single file upload from a field named 'media'.
    // It must be placed *before* the controller so that `req.file` is populated.
    router.post('/', auth_middleware_1.authenticate, upload_1.default.single('media'), (req, res) => reportController.createReport(req, res, io));
    // No changes are needed for the other routes as they don't handle file uploads.
    router.get('/verified', (req, res) => reportController.getVerifiedReports(req, res));
    router.get('/unverified', auth_middleware_1.authenticate, (req, res) => reportController.getUnverifiedReports(req, res));
    router.put('/verify/:id', auth_middleware_1.authenticate, (req, res) => reportController.verifyReport(req, res, io));
    router.put('/reject/:id', auth_middleware_1.authenticate, (req, res) => reportController.rejectReport(req, res, io));
    return router;
};
exports.default = reportRoutes;
