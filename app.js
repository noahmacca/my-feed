var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var seedDB = require("./seeds");
var moment = require("moment");

// Mongo Models
var Article = require("./models/article");
var User = require("./models/user");
var Comment = require("./models/comment");

// Routes
var indexRoutes = require("./routes/index");
var articleRoutes = require("./routes/articles");
var commentRoutes = require("./routes/comments");

var url = process.env.MONGOURL;
mongoose.connect(url);

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seedDB();

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
    res.locals.moment = moment;
    res.locals.momentFormat = "MMMM D, h:mm a";
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", indexRoutes);
app.use("/articles", articleRoutes);
app.use("/articles/:id/comments", commentRoutes);

app.listen(process.env.PORT, process.env.IP, (err, res) => {
    console.log(`server started on port ${process.env.PORT}`);
});