var Article = require("../models/article.js");
var Comment = require("../models/comment.js");

var middleware = {}

middleware.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

module.exports = middleware;