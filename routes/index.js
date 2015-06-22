var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    if (req.mySession.isSigned) {
        res.redirect("/main");
    }
    else {
        res.redirect("/signin");
    }
    //res.sendfile("index.html");
});

/* GET signin page. */
router.get('/signin', function(req, res, next) {
    console.log("/signin :: " + JSON.stringify(req.mySession));
    var isSignedUp = req.mySession.isSignedUp;

    //res.render('index', { title: 'Express' });
    if (req.mySession.isSigned) {
        res.redirect("/main");
    }
    else if (isSignedUp){
        req.mySession.destroy();
    }

    res.render("signin", { isSignedUp: isSignedUp });
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
