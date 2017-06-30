var mongoose = require("mongoose");

var articleSchema = new mongoose.Schema({
    url: String,
    title: String,
    publication: String,
    articleAuthor: String,
    articleDesc: String,
    desc: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Article", articleSchema);