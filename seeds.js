var mongoose = require("mongoose");
var Article = require("./models/article");

var data = [
    {
        userId: "nomac",
        url: "https://www.theatlantic.com/health/archive/2014/03/the-toxins-that-threaten-our-brains/284466/",
        title: "The Toxins That Threaten Our Brains",
        publication: "The Atlantic",
        author: "James Hamblin",
        articleDesc: "Leading scientists recently identified a dozen chemicals as being responsible for widespread behavioral and cognitive problems. But the scope of the chemical dangers in our environment is likely even greater. Why children and the poor are most susceptible to neurotoxic exposure that may be costing the U.S. billions of dollars and immeasurable peace of mind.",
        userDesc: "This article is so awesome!! @viraj any thoughts?"
    },
    {
        userId: "nomac",
        url: "https://hackernoon.com/downloading-an-ios-layout-a9b0ede80809",
        title: "Downloading an iOS UI",
        publication: "Hackernoon",
        author: "Dale Webster",
        articleDesc: "The purpose of this post is to demonstrate how, with basic code, an iOS UI can be updated or completely redesigned without submitting your app to the review process.",
        userDesc: "I think this is a well researched article"
    },
    {
        userId: "virajs",
        url: "http://www.3quarksdaily.com/3quarksdaily/2017/06/sunday-poem-3.html",
        title: "Ode to the Cat",
        publication: "3quarksdaily",
        author: "Pablo Neruda",
        articleDesc: "The animals, were imperfect",
        userDesc: "Beautiful poem, @embram you like cats you should check this out"
    }
]
function seedDB() {
    // Remove articles from db
    Article.remove({}, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("removed articles");
            // Add boilerplate articles to db
            data.forEach((sample) => {
                Article.create(sample, (err, article) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("added an article");
                    }
                });
            });
        }
    });
}


module.exports = seedDB;