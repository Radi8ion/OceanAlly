"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    reporter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reporterName: { type: String },
    reporterContact: { type: String },
    hazardType: { type: String, enum: ['tsunami', 'cyclone', 'pollution', 'algae', 'debris', 'lightning', 'other'], required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    location: {
        type: { type: String, enum: ['Point'], required: true, default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    locationDescription: { type: String, required: true },
    description: { type: String, required: true },
    mediaUrl: { type: String },
    mediaPublicId: { type: String },
    isEmergency: { type: Boolean, default: false },
    status: { type: String, enum: ['unverified', 'verified', 'rejected'], default: 'unverified' },
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
reportSchema.index({ location: '2dsphere' });
const Report = (0, mongoose_1.model)('Report', reportSchema);
exports.default = Report;
