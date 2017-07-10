var moment = require("moment");
var express = require("express");
var router = express.Router();
var Article = require("../models/article");
var User = require("../models/user");
var middleware = require("../middleware");
var request = require('request');
var cheerio = require("cheerio");
// var facebook = require('../utils/facebook');
var userSuggestions = require('../utils/userSuggestions');

// INDEX - show article feed of followed users
router.get("/", middleware.isLoggedIn, (req, res) => {
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
            req.flash("error", `Error getting articles from db: ${err.message}`);
            return res.redirect("back");
        } else {
            var validArticles = [];
            for (var i=0; i < allArticles.length; i++) {
                if(isFolloweeInArray(req.user.following, allArticles[i].author.id)) {
                    validArticles.push(allArticles[i]);
                }
            }
            
            validArticles = validArticles.slice(0, 40); // in case there's tons of matched articles

            // populate list of people to follow
            userSuggestions.find(req.user, (err, suggestions) => {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                return res.render('articles/index', { articles: validArticles, highlight: 'following', friends: suggestions.friends, topUsers: suggestions.topUsers })
            });
        }
    });
});

// INDEX - show article feed of all users
router.get("/all", middleware.isLoggedIn, (req, res) => {
    Article.find({}, (err, allArticles) => {
        allArticles = allArticles.slice(0, 40); // todo: introduce multi-page
        if (err) {
            console.log(err);
            req.flash("error", `Error getting articles from db: ${err.message}`);
            return res.redirect("back");
        } else {
            // populate list of people to follow
            userSuggestions.find(req.user, (err, suggestions) => {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                return res.render('articles/index', { articles: allArticles, highlight: 'all', friends: suggestions.friends, topUsers: suggestions.topUsers })
            });
        }
    });
});

// INDEX - show feed of saved articles
router.get("/saved", middleware.isLoggedIn, (req, res) => {
    Article.find({}, (err, allArticles) => {
        if (err) {
            console.log(err);
            req.flash("error", `Error getting articles from db: ${err.message}`);
            return res.redirect("back");
        } else {
            var validArticles = [];
            for (var i=0; i < allArticles.length; i++) {
                if(isFolloweeInArray(req.user.savedArticles, allArticles[i]._id)) {
                    validArticles.push(allArticles[i]);
                }
            }
            // populate list of people to follow
            userSuggestions.find(req.user, (err, suggestions) => {
                if(err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                return res.render('articles/index', { articles: validArticles, highlight: 'saved', friends: suggestions.friends, topUsers: suggestions.topUsers })
            });
        }
    });
});

// CREATE - Add new article
router.post("/", middleware.isLoggedIn, (req, res) => {
    if (!req.body.url) {
        req.flash("error", "Please specify a url for the article you'd like to post!");
        return res.redirect("back");
    }
    var url = req.body.url; // todo: auto-add http if they don't include it, in a way that still allows request to determine if invalid uri
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
            return res.redirect("back");
        }
        var $ = cheerio.load(body);
        
        article.title = $("title").text().split("|")[0]; // todo: filter out all of the other junk that can be in titles
        var pTags = []
        $("body p").each((i, elem) => {
            pTags[i] = $(elem).text();
        });
        article.articleDesc = pTags.join(" ").split(" ").slice(0,50).join(" "); // Not perfect at handling various spaces 
        article.publication = url.split("/")[2];
        Article.create(article, (err, newArticle) => {
            if (err) {
                req.flash("error", err);
                return res.redirect("back");
            }

            // Send notification to all of your followers
            User.findById(req.user.id).populate("followers").exec((err, user) => {
                var followerIds = user.followers.map((el) => {return el._id});
                User.find().where('_id').in(followerIds).exec((err, followers) => {
                    for (var i = 0; i < followers.length; i++) {
                        followers[i].notifications.push({
                            message: `${req.user.username} made a new post`,
                            link: `/articles/${newArticle.id}`,
                            isRead: false
                        });
                        followers[i].save();
                    }
                    req.flash("success", "New Post Created");
                    return res.redirect(`/articles/${newArticle._id}`);
                });
            });
        });
    });
});

// SAVE - Add article to saved list
router.post("/save/:id", middleware.isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        Article.findById(req.params.id, (err, article) => {
            user.savedArticles.push(article);
            user.save();
            req.flash("success", `Saved "${article.title}" for later`);
            res.redirect("/articles");
        });
    });
});

// UNSAVE - Remove article from saved list
router.post("/unsave/:id", middleware.isLoggedIn, (req, res) => {
    User.findById(req.user._id, (err, user) => {
        Article.findById(req.params.id, (err, article) => {
            var keepSaved = [];
            for (var i = 0; i < user.savedArticles.length; i++) {
                if (!user.savedArticles[i]._id.equals(article._id)) {
                    keepSaved.push(user.savedArticles[i]);
                }
            }
            user.savedArticles = keepSaved;
            user.save();
            req.flash("success", `Removed "${article.title}" from saved list`);
            res.redirect("/articles");
        });
    });
});

// SHOW - individual article + comment thread
// Keep unauthed so you can easily share article with friends. They will have to sign up to see or post comments.
router.get("/:id", (req, res) => {
    Article.findById(req.params.id).populate("comments").exec((err, foundArticle) => {
        if (err) {
            req.flash("error", `Error finding article: ${err.message}`);
            return res.redirect("back");
        } else {
            return res.render("articles/show", { article: foundArticle, currentRoute: req.originalUrl });
        }
    });
});

// EDIT ARTICLE
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkPostOwnership, (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            req.flash("error", `Error finding article: ${err.message}`);
            return res.redirect("back");
        } else {
            return res.render("articles/edit", { article: article });
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
            req.flash("error", `Error updating article: ${err.message}`);
            return res.redirect("back");
        } else {
            req.flash("success", "Post Updated");
            return res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY ARTICLE
router.delete("/:id", middleware.isLoggedIn, middleware.checkPostOwnership, (req, res) => {
    Article.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            req.flash("error", `Error deleting article: ${err.message}`)
            return res.redirect("/articles");
        } else {
            req.flash("success", "Post Deleted");
            return res.redirect("/articles");
        }
    });
});

module.exports = router;

function isFolloweeInArray(followingArray, followee_id) {
    for (var i=0; i < followingArray.length; i++) {
        if (followingArray[i]._id.equals(followee_id)) {
            return true
        }
    }
    return false
}