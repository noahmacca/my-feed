var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    createdAt: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    taggedUsers: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
        }
    ],
});

module.exports = mongoose.model("Comment", commentSchema);