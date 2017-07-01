var express = require("express");
var mongoose = require("mongoose");
var router = express.Router({mergeParams: true});
var Article = require("../models/article");
var Comment = require("../models/comment");
var middleware = require("../middleware");

router.use(middleware.isLoggedIn);

// CREATE COMMENT FORM
router.get("/new", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {article: article})
        }
    });
});

// CREATE COMMENT LOGIC
router.post("/", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            console.log(err);
            res.redirect("/articles");
        } else {
            var comment = req.body.comment;
            comment.author = {
                id: req.user._id,
                username: req.user.username
            }
            Comment.create(comment, (err, comment) => {
                if(err) {
                    console.log(err);
                } else {
                    article.comments.push(comment);
                    article.save();
                    res.redirect(`/articles/${article._id}`);
                }
            });
        }
    })
});

// EDIT COMMENT FORM
router.get("/:comment_id/edit", (req, res) => {
    Comment.findById(req.params.comment_id, (err, comment) => {
        res.render("comments/edit", { articleId: req.params.id, comment: comment });
    });
});

// UPDATE COMMENT
router.put("/:comment_id", (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, comment) => {
        if (err) {
            res.redirect("/articles"); // todo: handle this better
        } else {
            res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY COMMEMNT
router.delete("/:comment_id", (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if (err) {
            res.redirect("/articles");
            console.log("error: ", err); // todo: better error handling
        } else {
            // Remove comment from article's comment array (there's probably a better way to do this)
            Article.findById(req.params.id, (err, article) => {
                var newComments = []
                var objectId = mongoose.Types.ObjectId(req.params.comment_id);
                numComments = article.comments.length;
                var counter = 0;
                article.comments.forEach((comment) => {
                    if (!comment.id.equals(objectId.id)) {
                        console.log("does not equal");
                        newComments.push(comment);
                    }
                    counter++;
                    if (numComments === counter) { // iterated through all comments
                        article.comments = newComments;
                        article.save();
                        res.redirect(`/articles/${article._id}`);
                    }
                });
            });
        }
    });
});

module.exports = router;