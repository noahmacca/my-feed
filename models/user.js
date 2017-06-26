var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    password: String
});

module.exports = mongoose.model("User", userSchema);