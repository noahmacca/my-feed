var express = require("express");
var router = express.Router();
var User = require("../models/user");

// Landing page
router.get("/", (req, res) => {
    res.render("landing");
});

// -----------------------
// USER SIGNUP FLOW
// -----------------------
// User Registration Page
router.get("/register", (req, res) => {
    res.render("register");
});

// sign up logic
router.post("/register", (req, res) => {
    console.log(req.body);
    res.redirect("/articles");
});

// todo: Shpw login form
router.get("/login", (req, res) => {
    res.send("hit login form");
});

// todo: handling login logic 
router.post("/login", (req, res) => {
    res.send("posted to /login");
});

// User's Profile Page
router.get("/user/:id", (req, res) => {
    res.render("profile");
});

module.exports = router;