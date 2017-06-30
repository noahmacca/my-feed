var mongoose = require("mongoose");

var articleSchema = new mongoose.Schema({
    url: String,
    title: String,
    publication: String,
    author: String,
    articleDesc: String,
    userDesc: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    poster: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }
});

module.exports = mongoose.model("Article", articleSchema);