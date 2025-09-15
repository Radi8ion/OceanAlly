import { Schema, model, Model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  // ✅ ADDED: The unique identifier from Clerk
  clerkId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Improves query performance for finding users by clerkId
  },

  // --- Application-Specific Fields ---
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  organization: { type: String },
  location: { type: String },
  role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },

  // --- ❌ REMOVED ---
  // password
  // googleId, facebookId
  // resetPasswordToken, resetPasswordExpire
}, { 
  timestamps: true // This handles createdAt and updatedAt fields automatically
});

// --- ❌ REMOVED ALL METHODS ---
// The pre-save hook for password hashing is gone.
// The matchPassword method is gone.
// The getResetPasswordToken method is gone.

export const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;