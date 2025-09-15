import { Request, Response } from 'express';
import User from '../models/user.model';
import { clerkClient } from '@clerk/clerk-sdk-node';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  // This function is called by the frontend right after login.
  try {
    //@ts-ignore
    const { userId } = req.auth; // Provided by Clerk's 'protect' middleware

    if (!userId) {
       res.status(401).json({ message: 'Not authorized' });
       return;
    }

    // Check if user exists in our database
    let user = await User.findOne({ clerkId: userId });

    // If not, create them (this is the "just-in-time" creation)
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || '';
      
      // ✅ This is where you set the role and details
      const role = primaryEmail.endsWith('@moes.gov.in') ? 'official' : 'citizen';

      user = await User.create({
        clerkId: clerkUser.id,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        email: primaryEmail,
        role: role,
      });
    }

    res.status(200).json({ success: true, user });

  } catch (error: any) {
    console.log(error)
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};