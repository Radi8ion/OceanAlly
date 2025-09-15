"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/stats', auth_middleware_1.protect, auth_middleware_1.attachUser, dashboard_controller_1.getStats);
router.get('/hotspots', auth_middleware_1.protect, auth_middleware_1.attachUser, dashboard_controller_1.getHotspots);
exports.default = router;
