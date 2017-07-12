var facebook = require('./facebook');
var User = require('../models/user');
var Article = require('../models/article');
var request = require('request');
var cheerio = require("cheerio");
var moment = require("moment");

var userUtils = {}


// return list of suggested users for a given user
userUtils.getSuggestedFollows = function (user, next) {
    // get list of most popular users
    mostFollowedUsers(user, (err, topUsers) => {
        if (err)
            return next(err);
        facebookFriends(user, (err, friends) => {
            if (err)
                return next(err);
            return next(null, { 'topUsers': topUsers, 'friends': friends });
        });
    });
}

// return list of taggable users for a given user
userUtils.getTaggableUsers = function (reqUser, next) {
    User.findById(reqUser.id, (err, user) => {
        if (err)
            return next(err)

        var taggableUsers = user.following.concat(user.followers);
        taggableUsers = taggableUsers.filter((user) => { return !(user._id.equals(reqUser._id)) }); // remove own userId from list
        taggableUsers = taggableUsers.map((el) => { return { "username": el.username, "id": String(el._id) } }); // remove junk from object
        var taggableIds = taggableUsers.map((el) => { return el.id }); // get pure array of just ids for dupe detection

        // remove dupes
        taggableUsers = taggableUsers.filter(function (item, pos) {
            return taggableIds.indexOf(item.id) == pos;
        });

        return next(null, taggableUsers);
    });
}

// Parse and create new article from url
userUtils.parseAndCreateArticle = function (req, next) {
    var url = req.body.url; // todo: auto-add http if they don't include it, in a way that still allows request to determine if invalid uri
    var article = {
        url: url,
        desc: req.body.desc,
        createdAt: moment().format(),
        author: {
            id: req.user._id,
            username: req.user.username
        }
    }

    request(url, (err, response, body) => {
        if (err)
            return next(err);

        var $ = cheerio.load(body);

        article.title = $("title").text().split("|")[0]; // todo: filter out all of the other junk that can be in titles
        var pTags = []
        $("body p").each((i, elem) => {
            pTags[i] = $(elem).text();
        });
        article.articleDesc = pTags.join(" ").split(" ").slice(0, 50).join(" "); // Not perfect at handling various spaces 
        article.publication = url.split("/")[2];
        Article.create(article, (err, newArticle) => {
            if (err) 
                return next(err);
            return next(null, newArticle);
        });
    });
};

module.exports = userUtils;

/////////////////////////////
// Local functions
/////////////////////////////

// Return list of your facebook friends
function facebookFriends(user, next) {
    if (user.facebook.id) {
        facebook.getFriendsList(user.facebook.token, '/me/friends', (friends) => {
            friends = JSON.parse(friends).data;
            return next(null, friends);
        });
    } else {
        return next(null, null);
    }
}

// Return list of most followed users
function mostFollowedUsers(user, next) {
    User.find({}, (err, allUsers) => {
        if (err)
            return next(err);
        allUsers = allUsers.sort(compareFollowerCount);
        allUsers = allUsers.slice(0, 15);
        // todo: put some limits here to accommodate growing userbase
        return next(null, allUsers);
    });
}

function compareFollowerCount(a, b) {
    if (a.followers.length > b.followers.length)
        return -1;
    if (a.followers.length < b.followers.length)
        return 1;
    return 0;
}


