var express = require("express");
var router = express.Router();
var Article = require("../models/article");
var middleware = require("../middleware");

router.use(middleware.isLoggedIn);

// INDEX - show article feed
router.get("/", (req, res) => {
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
        } else {
            console.log(allArticles);
            res.render("articles/index", { articles: allArticles });
        }
    });
});

// New Article Form
router.get("/new", (req, res) => {
    res.render("articles/new");
})

// CREATE - Add new article
router.post("/", (req, res) => {
    Article.create(req.body.article, (err, newArticle) => {
        if (err) {
            console.log(err);
        } else {
            console.log("made a new campground");
            res.redirect("/articles");
        }
    });
});


// SHOW - individual article + comment thread
router.get("/:id", (req, res) => {
    Article.findById(req.params.id).populate("comments").exec((err, foundArticle) => {
        if (err) {
            console.log(err);
        } else {
            res.render("articles/show", { article: foundArticle });
        }
    });
});

// EDIT ARTICLE
router.get("/:id/edit", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        res.render("articles/edit", { article: article });
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

module.exports = router;