var moment = require('moment');
var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var User = require("../models/user");

// get the auth vars
var fbClientId = process.env.FBCLIENTID;
var fbClientSecret = process.env.FBCLIENTSECRET;
var fbCallbackUrl = process.env.FBCALLBACKURL;

module.exports = function (passport) {
    
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    /////////////////////
    // LOCAL AUTH
    /////////////////////

    // SIGNUP/SIGN-IN
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },
        (req, username, password, done) => {
            process.nextTick(() => {
                User.findOne({ 'username': username }, (err, user) => {
                    if (err)
                        return done(err);
                    if (user) {
                        // user already exists
                        return done(null, false, req.flash('error', 'That username is already in use.'))
                    } else {
                        // Make a new user
                        var newUser = new User({ username: username });
                        newUser.createdAt = moment().format();
                        User.register(newUser, password, (err, user) => {
                            if (err) {
                                return done(null, false, req.flash('error', err.message));
                            }
                            // everyone follows themself
                            user.following.push(user);
                            user.save();

                            passport.authenticate("local")(req, null, () => {
                                req.flash("success", `Welcome to MyFeed ${user.username}`)
                                return done(null, user);
                            });
                        });
                    }
                });
            });
        })
    );

    /////////////////////
    // FACEBOOK AUTH
    /////////////////////
    passport.use(new FacebookStrategy({
        clientID: fbClientId,
        clientSecret: fbClientSecret,
        callbackURL: fbCallbackUrl,
        profileFields: ['id', 'email', 'first_name', 'last_name', 'friends'],
    },
        (token, refreshToken, profile, done) => {
            process.nextTick(function () {
                User.findOne({ 'facebook.id': profile.id }, (err, user) => {
                    if (err)
                        return done(err);
                    if (user) {
                        // user has already registered, log them in
                        // req.flash("success", "Welcome back!")
                        return done(null, user);
                    } else {
                        // create new user
                        var newUser = new User();
                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.username = newUser.facebook.name
                        newUser.facebook.email = (profile.emails ? profile.emails[0].value : '').toLowerCase();
                        newUser.following.push(newUser);
                        newUser.createdAt = moment().format();

                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            // req.flash("success", "Welcome!")
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));
}