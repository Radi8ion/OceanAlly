"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/me', auth_middleware_1.protect, auth_controller_1.getMe);
router.put('/me', auth_middleware_1.protect, auth_controller_1.updateMe);
router.get('/me/stats', auth_middleware_1.protect, auth_controller_1.getUserStats);
router.get('/me/official-stats', auth_middleware_1.protect, auth_controller_1.getOfficialStats);
exports.default = router;
