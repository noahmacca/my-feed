var mongoose = require("mongoose");

var articleSchema = new mongoose.Schema({
    url: String,
    title: String,
    publication: String,
    articleDesc: String,
    desc: String,
    createdAt: String,
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
    ],
    taggedUsers: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
        }
    ]
});

module.exports = mongoose.model("Article", articleSchema);