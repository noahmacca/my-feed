var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var User = require("../models/user");

// get the auth vars
var fbClientId = process.env.FBCLIENTID;
var fbClientSecret = process.env.FBCLIENTSECRET;
var fbCallbackUrl = process.env.FBCALLBACKURL;

module.exports = function(passport) {

    // Serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize the user
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
    
    /////////////////////
    // LOCAL AUTH
    /////////////////////
    // SIGNUP
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },
        (req, username, password, done) => {
            process.nextTick(() => {
                User.findOne({ 'local.username': username }, (err, user) => {
                    if(err)
                        return done(err);
                    if(user) {
                        // user already exists
                        return done(null, false, req.flash('error', 'That username is already in use.'))
                    } else {
                        // make a new user
                        var newUser = new User();
                        newUser.local.username = username;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.save((err) => {
                            if(err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
            });
        })
    );

    // LOGIN
    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },
    (req, username, password, done) => {
        User.findOne({ 'local.username': username }, (err, user) => {
            if (err)
                return done(err);
            if (!user)
                return done(null, false, req.flash('error', 'User not found.'));
            if (!user.validPassword(password))
                return done(null, false, req.flash('error', "Sorry, that's the wrong password."));
            // no issues, return user
            return done(null, user);
        });
    }));

    /////////////////////
    // FACEBOOK AUTH
    /////////////////////
    passport.use(new FacebookStrategy({
        clientID: fbClientId,
        clientSecret: fbClientSecret,
        callbackURL: fbCallbackUrl,
        profileFields: ['id', 'email', 'first_name', 'last_name'],
    },
    (token, refreshToken, profile, done) => {
        process.nextTick(function() {
            User.findOne({ 'facebook.id': profile.id }, (err, user) => {
                if(err)
                    return done(err);
                if (user) {
                    // user has already registered, log them in
                    return done(null, user);
                } else {
                    // create new user
                    var newUser = new User();
                    newUser.facebook.id = profile.id;
                    newUser.facebook.token = token;
                    newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                    newUser.facebook.email = (profile.emails[0].value || '').toLowerCase();

                    newUser.save(function(err) {
                        if(err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
}