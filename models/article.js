var mongoose = require("mongoose");

var articleSchema = new mongoose.Schema({
    url: String,
    title: String,
    publication: String,
    articleAuthor: String,
    articleDesc: String,
    desc: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }
});

module.exports = mongoose.model("Article", articleSchema);