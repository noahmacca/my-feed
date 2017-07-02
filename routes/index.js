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
    res.render("landing");
});

// Sign up page
router.get("/register", (req, res) => {
    var redirect = req.query.redirect ? req.query.redirect : "/articles"
    res.render("register", {redirect: redirect});
});

// Sign up logic
router.post("/register", (req, res) => {
    console.log(req.body);
    var newUser = new User({ username: req.body.username });
    newUser.createdAt = moment().format();
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(`Error logging in: ${err.message}`);
            req.flash("error", err.message);
            return res.redirect(`/register${req.query.redirect && req.query.redirect !== "/articles" ? "/?redirect=" + req.query.redirect : ""}`);
        }
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Welcome to MyFeed ${user.username}`);
            res.redirect(`${req.query.redirect}`);
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
            console.log(err) // 500 error
            req.flash("error", err);
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
    User.findById(req.params.id, (err, user) => {
        if (err) {
            req.flash("error", `Error fetching user: ${err}`);
            res.redirect("back");
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
                        if (article.author.id.equals(user.id)) {
                            articles.push(article);
                        }
                        counter++;
                        if (counter == allArticles.length) {
                            var isFollowing = req.user ? isAlreadyFollowing(req.user.following, user) : false
                            res.render("profile", { user: user, articles: articles, isFollowing: isFollowing });
                        }
                    });
                }
            });
        }
    });
});

// Follow new user
router.post("/user/follow/:id", middleware.isLoggedIn, (req, res) => {
    // load the person's follow list
    User.findById(req.user._id, (err, user) => {
        if(err) {
            req.flash("error", `Error fetching user: ${err}`);
            res.redirect("back");
        } else {
            // Look up the followee add them to the list
            User.findById(req.params.id, (err, followee) => {
                if (followee._id.equals(user._id)) {
                    req.flash("error", "You can't follow yourself!");
                    res.redirect(`/user/${followee._id}`);    
                } else if (isAlreadyFollowing(user.following, followee)) {
                    req.flash("error", "You're already following this person!");
                    res.redirect(`/user/${followee._id}`);    
                } else {
                    user.following.push(followee);
                    user.save();
                    req.flash("success", `Successfully followed ${followee.username}`);
                    res.redirect(`/user/${followee._id}`);
                }
            });
        }
    });
});

// Unollow new user
router.post("/user/unfollow/:id", middleware.isLoggedIn, (req, res) => {
    // load the user's information
    User.findById(req.user._id, (err, user) => {
        if(err) {
            req.flash("error", `Error fetching user: ${err}`);
            res.redirect("back");
        } else {
            var newFollowees = []
            var removeUserId = mongoose.Types.ObjectId(req.params.id);
            var numFollows = user.following.length;
            var counter = 0;
            user.following.forEach((followee) => {
                if (!followee._id.equals(removeUserId)) {
                    newFollowees.push(followee);
                }
                counter++;
                if (user.following.length === counter) {
                    user.following = newFollowees;
                    user.save()
                    req.flash("success", "Unfollowed!")
                    res.redirect(`/user/${req.params.id}`);
                }
            });
        }
    });
});

module.exports = router;

function isAlreadyFollowing(followingArray, followee) {
    for (var i=0; i < followingArray.length; i++) {
        if (followingArray[i]._id.equals(followee._id)) {
            return true
        }
    }
    return false
}
