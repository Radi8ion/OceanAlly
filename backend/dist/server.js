"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
require("./config/passport");
const passport_1 = __importDefault(require("passport"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io"); // Import Socket type
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const report_routes_1 = require("./routes/report.routes"); // <-- MODIFICATION: Import the socket handler
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Restrict in production
        methods: ["GET", "POST", "PUT"]
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/reports', (0, report_routes_1.reportRoutes)(exports.io)); // Pass io for HTTP routes (verify/reject)
app.use('/api/v1/dashboard', dashboard_routes_1.default);
// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in your .env file');
    process.exit(1);
}
mongoose_1.default.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));
// --- MODIFICATION: Updated Socket.IO connection logic ---
exports.io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Automatically join the public room for general broadcasts
    socket.join('public');
    // Register the specific handlers for creating reports
    // This function contains the `socket.on('create-report', ...)` listener
    (0, report_routes_1.registerReportSocketHandlers)(exports.io, socket);
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
