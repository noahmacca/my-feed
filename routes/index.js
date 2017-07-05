var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Article = require("../models/article");
var moment = require("moment");
var middleware = require("../middleware");
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
    var redirect = req.query.redirect ? req.query.redirect : "/articles"
    return res.render("register", {redirect: redirect});
});

// Sign up logic
router.post("/register", (req, res) => {
    var newUser = new User({ username: req.body.username });
    newUser.createdAt = moment().format();
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            req.flash("error", err.message);
            return res.redirect(`/register${req.query.redirect && req.query.redirect !== "/articles" ? "/?redirect=" + req.query.redirect : ""}`);
        }
        // everyone follows themself
        user.following.push(user);
        user.save();
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Welcome to MyFeed ${user.username}`);
            return res.redirect(`${req.query.redirect}`);
        });
    });
});

// Login page
router.get("/login", (req, res) => {
    var redirect = req.query.redirect ? req.query.redirect : "/articles"
    res.render("login", {redirect: redirect});
});

// Login logic
router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if(err) {
            req.flash("error", err.message); // todo: should probably throw here
            return res.redirect("/login");
        }
        if(!user) {
            req.flash("error", "Authentication failed: username or password incorrect.");
            return res.redirect("/login");
        }
        req.login(user, (err) => {
            if(err) {
                flash("error", err);
                return res.redirect("/login");
            }
            req.flash("success", `Welcome back ${req.user.username}`);
            res.redirect(`${req.query.redirect}`);
        });
    })(req, res, next);
});

// logout route
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged Out");
    res.redirect("/#");
});

// User's Profile Page
// unauthed for easy sharing
router.get("/user/:id", (req, res) => {
    // get user's profile information
    User.findById({ _id: req.params.id}, (err, user) => {
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
                    counter = 0;
                    // filter out articles that don't belong to this user
                    allArticles.forEach((article) => { // todo: make this more efficient. Won't scale
                        if (user && article.author.id.equals(user.id)) {
                            articles.push(article);
                        }
                        counter++;
                        if (counter == allArticles.length) {
                            var isFollowing = req.user ? isAlreadyFollowing(req.user.following, user) : false
                            return res.render("profile", { user: user, articles: articles, isFollowing: isFollowing });
                        }
                    });
                }
            });
        }
    });
});

// Follow user
router.post("/user/follow/:id", middleware.isLoggedIn, (req, res) => {
    // Add the user to your following list, and andd you to the user's follower list
    // load the person's follow list
    User.findById(req.user._id, (err, user) => {
        if(err) {
            req.flash("error", `Error fetching user: ${err.message}`);
            res.redirect("back");
        } else {
            // Look up the followee add them to the list
            User.findById(req.params.id, (err, followee) => {
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
