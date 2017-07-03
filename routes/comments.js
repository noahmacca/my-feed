var express = require("express");
var mongoose = require("mongoose");
var router = express.Router({mergeParams: true});
var Article = require("../models/article");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var moment = require("moment");

router.use(middleware.isLoggedIn);

// CREATE COMMENT LOGIC
router.post("/", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            req.flash("error", `Error creating comment: ${err.message}`);
            return res.redirect("back");
        } else {
            var comment = req.body.comment;
            comment.createdAt = moment().format();
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
                    req.flash("success", "Successfully added comment");
                    return res.redirect(`/articles/${article._id}`);
                }
            });
        }
    })
});

// EDIT COMMENT FORM
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    Comment.findById(req.params.comment_id, (err, comment) => {
        return res.render("comments/edit", { articleId: req.params.id, comment: comment });
    });
});

// UPDATE COMMENT
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, comment) => {
        if (err) {
            req.flash("error", `Error updating comment: ${err.message}`);
            return res.redirect("back");
        } else {
            req.flash("success", "Updated comment!");
            return res.redirect(`/articles/${req.params.id}`);
        }
    });
});

// DESTROY COMMEMNT
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if (err) {
            req.flash("error", `Error deleting comment: ${err.message}`);
            return res.redirect("back");
        } else {
            // Remove comment from article's comment array (there's probably a better way to do this)
            Article.findById(req.params.id, (err, article) => {
                var newComments = []
                var objectId = mongoose.Types.ObjectId(req.params.comment_id);
                var numComments = article.comments.length;
                var counter = 0;
                article.comments.forEach((comment) => {
                    if (!comment.id.equals(objectId.id)) {
                        newComments.push(comment);
                    }
                    counter++;
                    if (numComments === counter) { // iterated through all comments
                        article.comments = newComments;
                        article.save();
                        req.flash("success", "Deleted comment");
                        return res.redirect(`/articles/${article._id}`);
                    }
                });
            });
        }
    });
});

module.exports = router;