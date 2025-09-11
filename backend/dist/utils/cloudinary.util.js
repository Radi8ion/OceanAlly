"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
// src/utils/cloudinary.util.ts
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/**
 * Uploads a file buffer to Cloudinary.
 * @param buffer The file buffer to upload.
 * @returns A promise that resolves with the Cloudinary upload result.
 */
const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({ resource_type: 'auto', folder: 'ocean_reports' }, (error, result) => {
            if (error)
                return reject(error);
            // The result can be undefined on error, so we ensure it exists.
            if (!result)
                return reject(new Error('Cloudinary upload failed.'));
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Deletes a file from Cloudinary.
 * @param publicId The public_id of the file to delete.
 * @returns A promise that resolves when the file is deleted.
 */
const deleteFromCloudinary = (publicId) => {
    return cloudinary_1.default.uploader.destroy(publicId);
};
exports.deleteFromCloudinary = deleteFromCloudinary;
