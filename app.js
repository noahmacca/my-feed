var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var seedDB = require("./seeds");

// Mongo Models
var Article = require("./models/article");
var User = require("./models/user");

// Routes
var indexRoutes = require("./routes/index");
var articleRoutes = require("./routes/articles");

mongoose.connect("mongodb://localhost/myfeed");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
seedDB();

app.use("/", indexRoutes);
app.use("/articles", articleRoutes);

app.listen(3000, (err, res) => {
    console.log('server started on port 3000');
});