var express = require("express");
var mongoose = require("mongoose");
var router = express.Router({ mergeParams: true });
var Article = require("../models/article");
var Comment = require("../models/comment");
var User = require("../models/user");
var middleware = require("../middleware");
var moment = require("moment");

router.use(middleware.isLoggedIn);

// CREATE COMMENT LOGIC
router.post("/", (req, res) => {
    Article.findById(req.params.id).populate("comments").exec((err, article) => {
        if (err) {
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
                if (err) {
                    console.log(err);
                } else {
                    article.comments.push(comment);
                    article.save();

                    // send notif to author
                    User.findById(article.author.id, (err, author) => {
                        if (!article.author.id.equals(req.user._id)) {
                            author.notifications.push({
                                message: `${req.user.username} commented on your post`,
                                link: `/articles/${req.params.id}`,
                                isRead: false
                            });
                            author.save();
                        }

                        var commentIds = article.comments.map((el) => { return el.author.id });

                        // send notif to everyone who commented, who isn't the author or comment poster
                        User.find().where('_id').in(commentIds).exec((err, commenters) => {
                            for (var i = 0; i < commenters.length; i++) {
                                var commenter = commenters[i]
                                if (!((req.user._id.equals(commenter._id)) || (article.author.id.equals(commenter._id)))) {
                                    commenter.notifications.push({
                                        message: `${req.user.username} commented on a post you're following`,
                                        link: `/articles/${req.params.id}`,
                                        isRead: false
                                    });
                                }
                                commenter.save();
                            }
                            req.flash("success", "Posted comment");
                            return res.redirect(`/articles/${article._id}`);
                        });
                    });
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