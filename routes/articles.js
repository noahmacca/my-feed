var moment = require("moment");
var express = require("express");
var router = express.Router();
var Article = require("../models/article");
var middleware = require("../middleware");
var request = require('request');
var cheerio = require("cheerio");



// INDEX - show article feed
router.get("/", middleware.isLoggedIn, (req, res) => {
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
            req.flash("error", `Error getting articles from db: ${err}`);
            res.redirect("back");
        } else {
            res.render("articles/index", { articles: allArticles });
        }
    });
});

// New Article Form
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("articles/new");
})

// CREATE - Add new article
router.post("/", middleware.isLoggedIn, (req, res) => {
    if (!req.body.url) {
        req.flash("error", "Please specify a url for the article you'd like to post!");
        return res.redirect("back");
    }
    var url = req.body.url.startsWith("http") ? req.body.url : "http://" + req.body.url;

    var article = {
        url: url,
        desc: req.body.desc,
        createdAt: moment().format(),
        author: {
            id: req.user._id,
            username: req.user.username
        }
    }
    
    // query the provided url to get the title, snippet etc.
    request(url, (err, response, body) => {
        if(err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        var $ = cheerio.load(body);
        
        article.title = $("title").text().split("|")[0]; // todo: filter out all of the other junk that can be in titles
        var pTags = []
        $("body p").each((i, elem) => {
            pTags[i] = $(elem).text();
        });
        article.articleDesc = pTags.join(" ").split(" ").slice(0,100).join(" "); // Not perfect at handling various spaces 
        article.publication = url.split("/")[2];
        Article.create(article, (err, newArticle) => {
            if (err) {
                req.flash("error", err);
                res.redirect("back");
            } else {
                req.flash("success", "New Post Created");
                res.redirect(`/articles/${newArticle._id}`);
            }
        })
    });
});

// SHOW - individual article + comment thread
// Keep unauthed so you can easily share article with friends. They will have to sign up to see or post comments.
router.get("/:id", (req, res) => {
    Article.findById(req.params.id).populate("comments").exec((err, foundArticle) => {
        if (err) {
            req.flash("error", `Error finding article: ${err}`);
            console.log(err);
        } else {
            res.render("articles/show", { article: foundArticle, currentRoute: req.originalUrl });
        }
    });
});

// EDIT ARTICLE
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkPostOwnership, (req, res) => {
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
router.put("/:id", middleware.isLoggedIn, middleware.checkPostOwnership, (req, res) => {
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
router.delete("/:id", middleware.isLoggedIn, middleware.checkPostOwnership, (req, res) => {
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