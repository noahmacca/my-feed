var mongoose = require("mongoose");
// var passportLocalMongoose = require("passport-local-mongoose");
var bcrypt = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
    local: {
        username: String,
        password: String,
    },
    facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
    },
    username: String,
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
    ]
});

// userSchema.plugin(passportLocalMongoose);

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model("User", userSchema);