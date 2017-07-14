var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
// var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
    },
    username: String,
    password: String,
    createdAt: String,
    tagline: String,
    followers: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
        }
    ],
    following: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            username: String
        }
    ],
    savedArticles: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Article"
            }
        }
    ],
    notifications: [
        {
            message: String,
            link: String,
            isRead: Boolean
        }
    ],
    likes: [
        {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Article"
            }
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);