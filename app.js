var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+ "/public"));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(3000, (err, res) => {
    console.log('server started on port 3000');
});