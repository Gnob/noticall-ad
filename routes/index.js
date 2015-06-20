var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.sendfile("index.html");
});

/* GET signin page. */
router.get('/signin', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("signin");
});

/* GET signup page. */
router.get('/signup', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("signup");
});


/* GET main page. */
router.get('/main', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("main");
});

module.exports = router;
