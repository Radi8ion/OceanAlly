"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ resource_type: 'auto', folder: 'ocean_reports' }, (error, result) => {
            if (error)
                return reject(error);
            if (!result)
                return reject(new Error('Cloudinary upload failed.'));
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = (publicId) => {
    return cloudinary_1.default.uploader.destroy(publicId);
};
exports.deleteFromCloudinary = deleteFromCloudinary;
