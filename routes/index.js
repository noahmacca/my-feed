var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// Landing page
router.get("/", (req, res) => {
    res.render("landing");
});

// -----------------------
// USER SIGNUP FLOW
// -----------------------
// Sign up page
router.get("/register", (req, res) => {
    res.render("register");
});

// Sign up logic
router.post("/register", (req, res) => {
    console.log(req.body);
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, (err, user) => {
        if(err) {
            console.log(`Error logging in: ${err.message}`);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, () => {
            console.log("User saved to mongo");
            res.redirect("/articles");
        });
    });
});

// Login page
router.get("/login", (req, res) => {
    res.render("login");
});

// Login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/articles",
        failureRedirect: "/login"
    }), (req, res) => {}
);

// logout route
router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/articles");
})

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

// User's Profile Page
router.get("/user/:id", (req, res) => {
    res.render("profile");
});

module.exports = router;