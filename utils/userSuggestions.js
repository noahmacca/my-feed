var facebook = require('./facebook');
var User = require('../models/user');

var userSuggestions = {}

// Return list of suggested users
exports.find = function (user, next) {
    // get list of most popular users
    mostFollowedUsers(user, (err, topUsers) => {
        if(err)
            return next(err);
        facebookFriends(user, (err, friends) => {
            if (err) 
                return next(err);
            return next(null, {'topUsers': topUsers, 'friends': friends});
        });
    });
}


// Local functions
function isUserInArray(userArray, test) {
    // nested for loop but this will be max 10-20 users so should always be fast
    for (var i = 0; i < userArray.length; i++) {
        if (userArray[i]._id.equals(test._id)) {
            return true
        }
    }
    return false
}

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
        for (var i = 0; i < allUsers.length; i++) {
            console.log(allUsers[i].followers.length, allUsers[i].username);
        }
        console.log('-------');
        allUsers = allUsers.sort(compareFollowerCount);
        for (var i = 0; i < allUsers.length; i++) {
            console.log(allUsers[i].followers.length, allUsers[i].username);
        }
        // filter out those which the user is already following
            if (user.following && user.following.length > 0) {
            var newUsers = [];
            allUsers.forEach((popUser) => {
                if (!isUserInArray(user.following, popUser)) {
                    newUsers.push(popUser);
                }
            });
            allUsers = newUsers;
        }
        allUsers.slice(0,10);
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


