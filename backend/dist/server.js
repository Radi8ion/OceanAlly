"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
// server.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
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
// Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/reports', (0, report_routes_1.default)(exports.io)); // Pass io here
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
// Socket.IO connection
exports.io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.join('public');
    socket.on('join-officials-room', () => {
        socket.join('officials');
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
