import { Schema, model, Model } from 'mongoose';
import { IReport } from '../types';

const reportSchema = new Schema<IReport>({
  reporter: { type: Schema.Types.ObjectId, ref: 'User' },
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
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });

const Report: Model<IReport> = model<IReport>('Report', reportSchema);
export default Report;