var express = require("express");
var router = express.Router();
var Article = require("../models/article");
var Comments = require("../models/comment");

router.get("/new", (req, res) => {
    res.render("comments/new");
});

module.exports = router;