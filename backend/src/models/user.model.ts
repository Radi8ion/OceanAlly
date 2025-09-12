// ../models/user.model.ts

import { Schema, model, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  organization: { type: String },
  location: { type: String },
  // Make password optional
  password: { type: String },
  role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },
  // Add provider IDs
  googleId: { type: String },
  facebookId: { type: String },
}, { timestamps: true });

// This pre-save hook already handles an empty password correctly. No changes needed here.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// The matchPassword method also works as is, but it will only be used for local logins.
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  // We need to fetch the password explicitly for comparison
  const user = await User.findById(this._id).select('+password');
  if (!user || !user.password) return false;
  console.log(await bcrypt.compare(enteredPassword, user.password))
  return await bcrypt.compare(enteredPassword, user.password);
};

export const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;