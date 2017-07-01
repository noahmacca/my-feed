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
            req.flash("error", `Error getting articles from db: ${err}`);
        } else {
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
    var article = req.body.article;
    article.author = {
        id: req.user._id,
        username: req.user.username
    }
    Article.create(req.body.article, (err, newArticle) => {
        if (err) {
            console.log(err);
            req.flash("error", `Error creating article: ${err}`);
        } else {
            console.log("made a new campground");
            req.flash("success", "New Post Created");
            res.redirect(`/articles/${newArticle._id}`);
        }
    });
});

// SHOW - individual article + comment thread
router.get("/:id", (req, res) => {
    Article.findById(req.params.id).populate("comments").exec((err, foundArticle) => {
        if (err) {
            req.flash("error", `Error finding article: ${err}`);
            console.log(err);
        } else {
            res.render("articles/show", { article: foundArticle });
        }
    });
});

// EDIT ARTICLE
router.get("/:id/edit", middleware.checkPostOwnership, (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            req.flash("error", `Error finding article: ${err}`);
            res.redirect("back");
        } else {
            res.render("articles/edit", { article: article });
        }
    });
});

// UPDATE ARTICLE
router.put("/:id", middleware.checkPostOwnership, (req, res) => {
    var article = req.body.article;
    article.author = {
        id: req.user._id,
        username: req.user.username
    }
    Article.findByIdAndUpdate(req.params.id, article, (err, article) => {
        if (err) {
            req.flash("error", `Error updating article: ${err}`);
            res.redirect("/articles"); // todo: handle this better
        } else {
            req.flash("success", "Post Updated");
            res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY ARTICLE
router.delete("/:id", middleware.checkPostOwnership, (req, res) => {
    Article.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            req.flash("error", `Error deleting article: ${err}`)
            res.redirect("/articles");
            console.log("error: ", err); // todo: better error handling
        } else {
            req.flash("success", "Post Deleted");
            res.redirect("/articles");
        }
    });
});


module.exports = router;