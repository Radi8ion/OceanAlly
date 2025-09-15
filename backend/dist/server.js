"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_middleware_1 = require("./middleware/socket.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const report_routes_1 = require("./routes/report.routes");
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "*",
        methods: ["GET", "POST", "PUT"]
    }
});
exports.io = io;
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : "*"
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/reports', (0, report_routes_1.createReportRouter)(io));
app.use('/api/v1/dashboard', dashboard_routes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in your .env file');
    process.exit(1);
}
mongoose_1.default.connect(MONGO_URI)
    .then(() => {
    console.log('✅ MongoDB connected successfully.');
    initializeSocketIO();
})
    .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
function initializeSocketIO() {
    io.use(socket_middleware_1.socketAuthMiddleware);
    (0, report_routes_1.registerReportSocketHandlers)(io);
    io.on('connection', (socket) => {
        try {
            console.log(`✅ Authenticated user connected: ${socket.user?.email} (${socket.id})`);
            socket.join('public');
            if (socket.user && (socket.user.role === 'official' || socket.user.role === 'admin')) {
                console.log(`🏛️ User ${socket.user.email} joined the 'officials' room.`);
                socket.join('officials');
            }
            socket.on('disconnect', (reason) => {
                console.log(`❌ User disconnected: ${socket.user?.email} (${socket.id}) - Reason: ${reason}`);
            });
            socket.on('error', (error) => {
                console.error(`🔥 Socket error for user ${socket.user?.email}:`, error);
            });
        }
        catch (error) {
            console.error('🔥 Error in socket connection handler:', error);
            socket.disconnect(true);
        }
    });
    io.on('error', (error) => {
        console.error('🔥 Socket.IO server error:', error);
    });
}
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
