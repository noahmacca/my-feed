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
router.get("/:id/edit", checkCampgroundOwnership, (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        res.render("articles/edit", { article: article });
    });
});

// UPDATE ARTICLE
router.put("/:id", checkCampgroundOwnership, (req, res) => {
    var article = req.body.article;
    article.author = {
        id: req.user._id,
        username: req.user.username
    }
    Article.findByIdAndUpdate(req.params.id, article, (err, article) => {
        if (err) {
            res.redirect("/articles"); // todo: handle this better
        } else {
            res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY ARTICLE
router.delete("/:id", checkCampgroundOwnership, (req, res) => {
    Article.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/articles");
            console.log("error: ", err); // todo: better error handling
        } else {
            res.redirect("/articles");
        }
    });
});

function checkCampgroundOwnership(req, res, next) {
    if (req.isAuthenticated()) {
        // does the user own the campground?
        Article.findById(req.params.id, function (err, foundArticle) {
            if (err) {
                console.log("article not found");
                res.redirect("back");
            } else {
                // does the user own the campground
                if (foundArticle.author.id.equals(req.user._id)) {
                    next();
                } else {
                    console.log("error", "You don't have mermission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        res.redirect("back");
    }
}

module.exports = router;