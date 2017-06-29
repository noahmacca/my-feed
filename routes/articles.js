var express = require("express");
var router = express.Router();
var Article = require("../models/article");

// INDEX - show article feed
router.get("/", (req, res) => {
    console.log(`req.user: ${req.user}`);
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
        } else {
            res.render("index", { articles: allArticles });
        }
    });
});

// CREATE - Add new article
router.post("/", isLoggedIn, (req, res) => {
    console.log(`req.user: ${req.user}`);
    console.log(req.user._id);
    Article.create(req.body.article, (err, newArticle) => {
        if (err) {
            console.log(err);
        } else {
            console.log("made a new campground");
            res.redirect("/articles");
        }
    });
});

// NEW - Submit new article form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("article-new");
});

// SHOW - individual article + comment thread
router.get("/:id", (req, res) => {
    Article.findById(req.params.id, (err, foundArticle) => {
        if (err) {
            console.log(err);
        } else {
            console.log(foundArticle);
            res.render("article-show", { article: foundArticle });
        }
    });
});

// EDIT ARTICLE
router.get("/:id/edit", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        console.log(article);
        res.render("article-edit", { article: article });
    });
});

// UPDATE ARTICLE
router.put("/:id", (req, res) => {
    console.log(req.body.article);
    Article.findByIdAndUpdate(req.params.id, req.body.article, (err, article) => {
        if (err) {
            res.redirect("/articles"); // todo: handle this better
        } else {
            res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY ARTICLE
router.delete("/:id", (req, res) => {
    Article.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/articles");
            console.log("error: ", err); // todo: better error handling
        } else {
            res.redirect("/articles");
        }
    });
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = router;