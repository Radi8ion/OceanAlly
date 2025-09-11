// Create a new file: config/passport.ts

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/user.model';

// --- Google Strategy ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        return done(null, user);
      }

      // Check if user exists with the same email
      user = await User.findOne({ email: profile.emails?.[0].value });
      if (user) {
        // Link Google account to existing local account
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      // Create new user if they don't exist
      const newUser = await User.create({
        googleId: profile.id,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        email: profile.emails?.[0].value,
        role: profile.emails?.[0].value.endsWith('@moes.gov.in') ? 'official' : 'citizen'
        // Password is not needed for OAuth users
      });
      return done(null, newUser);
    } catch (err) {
      return done(err, false);
    }
  }
));

// --- Facebook Strategy ---
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: '/api/v1/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name'] // Fields to request from Facebook
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0].value;
        if (!email) {
            return done(new Error('Facebook account must have a verified email.'), false);
        }

        let user = await User.findOne({ facebookId: profile.id });
        if (user) {
            return done(null, user);
        }

        user = await User.findOne({ email });
        if (user) {
            user.facebookId = profile.id;
            await user.save();
            return done(null, user);
        }

        const newUser = await User.create({
            facebookId: profile.id,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: email,
            role: email.endsWith('@moes.gov.in') ? 'official' : 'citizen'
        });
        return done(null, newUser);
    } catch (err) {
        return done(err, false);
    }
  }
));

// Note: serializeUser/deserializeUser are not strictly needed for JWT flow,
// as we set `session: false`. They are good practice to include for passport.
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// ✅ This is the modern, correct way
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user); // First argument is for an error (null if none), second is the result
  } catch (err) {
    done(err, null); // Pass the error to done
  }
});