var express = require("express");
var router = express.Router({mergeParams: true});
var Article = require("../models/article");
var Comment = require("../models/comment");
var middleware = require("../middleware");

router.use(middleware.isLoggedIn);

router.get("/new", (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {article: article})
        }
    });
});

router.post("/", (req, res) => {
    Article.findById(req.params.id, function(err, article) {
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

module.exports = router;