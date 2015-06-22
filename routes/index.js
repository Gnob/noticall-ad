var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var isSignedIn = req.mySession.isSignedIn;

    if (isSignedIn) {
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
    var isSignedIn = req.mySession.isSignedIn;
    var isSignedUp = req.mySession.isSignedUp;

    //res.render('index', { title: 'Express' });
    if (isSignedIn) {
        res.redirect("/main");
    }
    else {
        if (isSignedUp){
            req.mySession.destroy();
        }

        res.render("signin", { isSignedUp: isSignedUp });
    }

});

/* GET signup page. */
router.get('/signup', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var isSignedIn = req.mySession.isSignedIn;

    if (isSignedIn) {
        res.redirect("/main");
    }
    else {
        res.render("signup");
    }
});


/* GET main page. */
router.get('/main', function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var isSignedIn = req.mySession.isSignedIn;

    if (!isSignedIn) {
        res.redirect("/signin");
    }
    else {
        res.render("main");
    }
});

function loadUser(req, res, next) {
    if (req.mySession.isSignedIn) {
        User.findById(req.session.user_id, function(user) {
            if (user) {
                req.currentUser = user;
                next();
            } else {
                res.redirect('/sessions/new');
            }
        });
    } else {
        res.redirect('/sessions/new');
    }
}

module.exports = router;
