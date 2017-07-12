var User = require('../models/user');
var Article = require('../models/article');

var notifications = {}

notifications.new = function (message, link) {
    return {
        "message": message,
        "link": link,
        "isRead": false
    }
}

notifications.sendToUsers = function (sendIds, notif, next) {
    if (!sendIds || !notif)
        return next(new Error("Parameters missing"));

    User.find().where('_id').in(sendIds).exec((err, notifRecipients) => {
        for (var i = 0; i < notifRecipients.length; i++) {
            notifRecipients[i].notifications.push(notif);
            notifRecipients[i].save();
        }

        // remap to taggedUser schema 
        notifRecipients = notifRecipients.map((i) => {
            return {
                id: i._id,
                username: i.username
            }
        });

        return next(null, notifRecipients);
    });
}

module.exports = notifications;