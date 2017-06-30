var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var seedDB = require("./seeds");

// Mongo Models
var Article = require("./models/article");
var User = require("./models/user");

// Routes
var indexRoutes = require("./routes/index");
var articleRoutes = require("./routes/articles");
var commentRoutes = require("./routes/comments");

mongoose.connect("mongodb://localhost/myfeed");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
seedDB();

// PASSPORT CONFIG
app.use(require("express-session")({
    secret: "this is a test secret", // todo: change secret to env var
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.use("/", indexRoutes);
app.use("/articles", articleRoutes);
app.use("/articles/:id/comments", commentRoutes)

app.listen(3000, (err, res) => {
    console.log('server started on port 3000');
});