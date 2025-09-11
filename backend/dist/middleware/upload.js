"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
// Configure multer to store files in memory
const storage = multer_1.default.memoryStorage();
// Create the multer instance
const upload = (0, multer_1.default)({ storage: storage });
exports.default = upload;
