import { Types, Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string; // The link to the Clerk user
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  location?: string;
  role: 'citizen' | 'official' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;           // ✅ Add this line to type the report's _id
  reporter?: Types.ObjectId;
  reporterName?: string;
  reporterContact?: string;
  hazardType: 'tsunami' | 'cyclone' | 'pollution' | 'algae' | 'debris' | 'lightning' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  locationDescription: string;
  description: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  isEmergency: boolean;
  status: 'unverified' | 'verified' | 'rejected';
  verifiedBy?: Types.ObjectId;
   classification?: {
    label: string;
    confidence: number;
  };
  sentiment?: {
    score: number;
    urgency_level: string;
  };
}

// This is now the single, authoritative definition for a Hotspot
