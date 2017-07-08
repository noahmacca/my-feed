var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Article = require("../models/article");
var moment = require("moment");
var middleware = require("../middleware");
var facebook = require('../utils/facebook');
var mongoose = require("mongoose");

// Landing page
router.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/articles");
    }
    return res.render("landing");
});

// Sign up page
router.get("/register", (req, res) => {
    return res.render("register");
});

// Sign up logic
router.post('/register', passport.authenticate('local-signup', {
    successRedirect: '/articles',
    failureRedirect: '/register',
    failureFlash: true
}));

// Login page
router.get("/login", (req, res) => {
    res.render("login");
});

// Login logic
router.post("/login", passport.authenticate('local-login', {
    successRedirect: '/articles',
    failureRedirect: '/login',
    failureFlash: true
}));

// facebook login routes
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'user_friends' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/articles',
    failureRedirect: '/',
}));

// logout route
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged Out");
    res.redirect("/#");
});

// User's Profile Page
// unauthed for easy sharing
router.get("/user/:id", (req, res) => {
    // todo: this is becoming a mess, refactor
    // get user's profile information
    User.findById(req.params.id, (err, user) => {
        if (err) {
            req.flash("error", `Error fetching user: ${err.message}`);
            return res.redirect("back");
        } else if (!user) {
            req.flash("error", "This user has deleted their account");
            return res.redirect("back");
        } else {
            // Get all articles
            Article.find({}, (err, allArticles) => {
                if (err) {
                    console.log(err);
                    req.flash("error", `Error getting articles from db: ${err}`);
                    res.redirect("back");
                } else {
                    var articles = []
                    // filter out articles that don't belong to this user
                    for (var i = 0; i < articles.length; i++) {
                        if (user && article.author.id.equals(user.id)) {
                            articles.push(allArticles[i]);
                        }
                    }
                    var isFollowing = req.user ? isAlreadyFollowing(req.user.following, user) : false
                    // Get user's facebook friends if facebook if user logged in, they're a fb user and they are looking at their own profile
                    if (req.user && user.facebook.id && user._id.equals(req.user._id)) {
                        facebook.getFriendsList(req.user.facebook.token, '/me/friends', (friends) => {
                            friends = JSON.parse(friends).data;
                            return res.render("profile", { user: user, articles: articles, isFollowing: isFollowing, friends: friends });
                        });
                    } else {
                        return res.render("profile", { user: user, articles: articles, isFollowing: isFollowing, friends: false });
                    }
                }
            });
        }
    });
});

// Follow user
router.post("/user/follow/:id/:type", middleware.isLoggedIn, (req, res) => {
    // Add the user to your following list, and andd you to the user's follower list
    // load the person's follow list
    User.findById(req.user._id, (err, user) => {
        if(err) {
            req.flash("error", `Error fetching user: ${err.message}`);
            res.redirect("back");
        } else {
            // Look up the followee add them to the list
            findUser(req.params.id, req.params.type, (err, followee) => {
            // User.findById(req.params.id, (err, followee) => {
                if (followee._id.equals(user._id)) {
                    req.flash("error", "You can't follow yourself!");
                    return res.redirect(`/user/${followee._id}`);    
                } else if (isAlreadyFollowing(user.following, followee)) {
                    req.flash("error", "You're already following this person!");
                    return res.redirect(`/user/${followee._id}`);    
                } else {
                    // 1. Add the user to your following list
                    user.following.push(followee);
                    user.save();
                    
                    // 2. Add you to the user's follower list
                    followee.followers.push(user);
                    followee.save();
                    
                    req.flash("success", `Successfully followed ${followee.username}`);
                    return res.redirect(`/user/${followee._id}`);
                }
            });
        }
    });
});

// Unfollow user
router.post("/user/unfollow/:id", middleware.isLoggedIn, (req, res) => {
    // load the user's information
    User.findById(req.user._id, (err, user) => {
        if(err) {
            req.flash("error", `Error fetching user: ${err.message}`);
            res.redirect("back");
        } else {
            User.findById(req.params.id, (err, followee) => {
                if(err) {
                    req.flash("error", `Error fetching user: ${err.message}`);
                    return res.redirect("back");
                }
                // 1. Remove from user's following list
                user.following = removeFromArray(user.following, mongoose.Types.ObjectId(req.params.id));
                user.save()
                
                // 2. Remove from followees follower list
                followee.followers = removeFromArray(followee.followers, user._id);
                followee.save()

                req.flash("success", "Unfollowed!");
                return res.redirect(`/user/${req.params.id}`);
            });
        }
    });
});

// Delete user
router.delete("/user/:id", middleware.isLoggedIn, (req, res) => {
    if (req.params.id == req.user.id) {
        User.remove({ _id: req.params.id }, (err) => {
            if(err) {
                req.flash("error", `error deleting account: ${err.message}`)
                return res.redirect("back");
            } 
            req.flash("success", "Account deleted. Hope to see you again someday!")
            return res.redirect("/");
        });
    } else {
        req.flash("error", `Not authorized to delete an account that isn't yours! ${err.message}`)
        return res.redirect("back");
    }
});

// Edit Tagline
router.post("/user/:id/tagline", middleware.isLoggedIn, (req, res) => {
    if (req.params.id == req.user.id) { // todo: refactor since this is same middleware as above
        User.findById(req.params.id, (err, user) => {
            user.tagline = req.body.tagline;
            user.save();
            req.flash("success", "Updated your tagline!");
            return res.redirect("back");
        });
    } else {
        req.flash("error", `Not authorized to edit someone else's tagline!`);
        return res.redirect("back");
    }
});

module.exports = router;

// Local functions
function removeFromArray(mongoArray, mongoId) {
    var newFollowees = []
    mongoArray.forEach((followee) => {
        if (!followee._id.equals(mongoId)) {
            newFollowees.push(followee);
        }
    });
    return newFollowees;
}

function isAlreadyFollowing(followingArray, followee) {
    for (var i=0; i < followingArray.length; i++) {
        if (followingArray[i]._id.equals(followee._id)) {
            return true
        }
    }
    return false
}

// look up user by facebook or local id
function findUser(id, type, next) {
    if (type && type == "fb") {
        User.findOne({ 'facebook.id': id }, (err, user) => {
            if(err)
                return next(err);
            return next(null, user);
        });
    } else {
        User.findById(id, (err, user) => {
            if(err)
                return next(err);
            return next(null, user);
        });
    }
}
