var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var User = require("../models/user");

// get the auth vars
// var fbClientId = process.env.FBCLIENTID;
// var fbClientSecret = process.env.FBCLIENTSECRET;
// var fbCallbackUrl = process.env.FBCALLBACKURL;

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
    
    // local strategy for signup
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

    // local strategy for logging in
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

    // // FACEBOOK STRATEGY
    // passport.use(new FacebookStrategy({
    //     clientID: fbClientId,
    //     clientSecret = fbClientSecret,
    //     callbackURL: fbCallbackUrl
    // },
    
    // // facebook will send back the token and profile
    // (token, refreshToken, profile, done) => {
        
    //     process.nextTick(() => {

    //         // get user from db with fb id
    //         User.findOne({ 'facebook.id': profile.id }, (err, user) => {

    //             // possible error connecting to db
    //             if(err) {
    //                 return done(err);
    //             }

    //             // Log in found user
    //             if (user) {
    //                 return done(null, user);
    //             } else {
    //                 // if no user found, create them
    //                 var newUser = new User();

    //                 newUser.facebook.id = profile.id;
    //                 newUser.facebook.token = token;
    //                 newUser.facebook.name = profile.name.givenName + '' + profile.name.familyName;
    //                 newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails, take the first

    //                 // save our user to the db
    //                 newUser.save((err) => {
    //                     if(err) {
    //                         throw err;
    //                     }
    //                     return done(null, newUser);
    //                 });
    //             }
    //         });
    //     });
    // }));
}