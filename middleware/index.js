var Article = require("../models/article.js");
var Comment = require("../models/comment.js");

var middleware = {}

middleware.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

middleware.checkPostOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        // find the post author and compare to current user
        Article.findById(req.params.id, function (err, foundArticle) {
            if (err) {
                console.log("article not found");
                res.redirect("back");
            } else {
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

middleware.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        // Find comment author and compare to current author
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if(err) { res.redirect("back");}
            else {
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    console.log("You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }
}

module.exports = middleware;