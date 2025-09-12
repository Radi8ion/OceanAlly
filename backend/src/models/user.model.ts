import { Schema, model, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser } from '../types'; // Import the updated IUser

// The IUserWithPasswordReset interface is no longer needed and should be deleted.

const userSchema = new Schema<IUser>({ // Use IUser directly
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  organization: { type: String },
  location: { type: String },
  password: { type: String, select: false },
  role: { type: String, enum: ['citizen', 'official', 'admin'], default: 'citizen' },
  googleId: { type: String },
  facebookId: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  const user = await User.findById(this._id).select('+password');
  if (!user || !user.password) return false;
  return await bcrypt.compare(enteredPassword, user.password);
};

userSchema.methods.getResetPasswordToken = function(): string {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Use the updated IUser for the Model generic
export const User: Model<IUser> = model<IUser>('User', userSchema);
export default User;