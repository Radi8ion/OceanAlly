import { Types, Document } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  organization?: string;
  location?: string;
  password?: string;
  role: 'citizen' | 'official' | 'admin';
   googleId?:string;
  facebookId?:string;
  matchPassword(enteredPassword: string): Promise<boolean>;
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
}
