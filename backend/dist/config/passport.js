"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const user_model_1 = __importDefault(require("../models/user.model"));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/v1/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await user_model_1.default.findOne({ googleId: profile.id });
        if (user) {
            return done(null, user);
        }
        user = await user_model_1.default.findOne({ email: profile.emails?.[0].value });
        if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
        }
        const newUser = await user_model_1.default.create({
            googleId: profile.id,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile.emails?.[0].value,
            role: profile.emails?.[0].value.endsWith('@moes.gov.in') ? 'official' : 'citizen'
        });
        return done(null, newUser);
    }
    catch (err) {
        return done(err, false);
    }
}));
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/v1/auth/facebook/callback',
    profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0].value;
        if (!email) {
            return done(new Error('Facebook account must have a verified email.'), false);
        }
        let user = await user_model_1.default.findOne({ facebookId: profile.id });
        if (user) {
            return done(null, user);
        }
        user = await user_model_1.default.findOne({ email });
        if (user) {
            user.facebookId = profile.id;
            await user.save();
            return done(null, user);
        }
        const newUser = await user_model_1.default.create({
            facebookId: profile.id,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: email,
            role: email.endsWith('@moes.gov.in') ? 'official' : 'citizen'
        });
        return done(null, newUser);
    }
    catch (err) {
        return done(err, false);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await user_model_1.default.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
