import { Request, Response } from 'express';
import User from '../models/user.model';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail';
const generateToken = (id: string): string => jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, phone, organization, location } = req.body;
  const role = email.endsWith('@moes.gov.in') ? 'official' : 'citizen';
  try {
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400).json({ message: 'User already exists' }); return; }
    const user = await User.create({ firstName, lastName, email, password, phone, organization, location, role });
    res.status(201).json({ _id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, token: generateToken(user._id.toString()) });
  } catch (error: any) {
    console.log(error) 
    res.status(500).json({ message: error.message }); }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      console.log(user);
      if (user && (await user.matchPassword(password))) {
        res.json({ _id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email, role: user.role, token: generateToken(user._id.toString()) });

      } else {
         
        res.status(401).json({ message: 'Invalid email or password' }); }
    } catch (error: any) { res.status(500).json({ message: error.message }); }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user?.id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`, // Construct full name
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        location: user.location,
        role: user.role,
      }
    });

  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};



// ... (existing registerUser, loginUser, getMe functions)

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      // Send a generic success response to prevent email enumeration
      res.status(200).json({ success: true, message: 'Email sent' });
      return;
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
      });
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate a new JWT token for immediate login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

    res.status(200).json({ success: true, token });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};