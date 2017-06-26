var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var seedDB = require("./seeds");

// Mongo Models
var Article = require("./models/article");

mongoose.connect("mongodb://localhost/myfeed");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
seedDB();

// Landing page
app.get("/", (req, res) => {
    res.render("landing");
});

// Article Feed
app.get("/articles", (req, res) => {
    console.log(`req.user: ${req.user}`);
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", { articles: allArticles });
        }
    });
});

// Submit new article form
app.get("/articles/new", (req, res) => {
    res.render("article-new");
});

// Add new article
app.post("/articles", (req, res) => {
    console.log(`req.user: ${req.user}`);
    Article.create(req.body.article, (err, newArticle) => {
        if (err) {
            console.log(err);
        } else {
            console.log("made a new campground");
            res.redirect("/articles");
        }
    });
});

// SHOW individual article + comment thread
app.get("/articles/:id", (req, res) => {
    Article.findById(req.params.id, (err, foundArticle) => {
        if (err) {
            console.log(err);
        } else {
            console.log(foundArticle);
            res.render("article-show", { article: foundArticle });
        }
    });
});

// -----------------------
// USER SIGNUP FLOW
// -----------------------
// User Registration Page
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    console.log(req.body);
    res.redirect("/articles");
});

// User's Profile Page
app.get("/profile", (req, res) => {
    res.render("profile");
});

app.listen(3000, (err, res) => {
    console.log('server started on port 3000');
});