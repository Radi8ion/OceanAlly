// src/utils/cloudinary.util.ts
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

/**
 * Uploads a file buffer to Cloudinary.
 * @param buffer The file buffer to upload.
 * @returns A promise that resolves with the Cloudinary upload result.
 */
export const uploadToCloudinary = (buffer: Buffer): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'ocean_reports' },
            (error, result) => {
                if (error) return reject(error);
                // The result can be undefined on error, so we ensure it exists.
                if (!result) return reject(new Error('Cloudinary upload failed.'));
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Deletes a file from Cloudinary.
 * @param publicId The public_id of the file to delete.
 * @returns A promise that resolves when the file is deleted.
 */
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
    return cloudinary.uploader.destroy(publicId);
};