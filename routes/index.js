var express = require('express');
var query = require('./query');
var router = express.Router();


function checkSignIn(req, res, next) {
    console.log('middleware');
    if (req.mySession.isSignedIn) {
        return next();
    }

    res.redirect('/signin');
}

function checkNotSignIn(req, res, next) {
    console.log('middleware');
    if (!req.mySession.isSignedIn) {
        return next();
    }

    res.redirect('/main');
}


router.get('/', checkSignIn, function(req, res, next) {
    res.redirect("/main");
});


router.get('/signin', checkNotSignIn, function(req, res, next) {
    console.log("/signin :: " + JSON.stringify(req.mySession));
    var isSignedUp = req.mySession.isSignedUp;

    if (isSignedUp){
        req.mySession.destroy();
    }

    res.render("signin", { isSignedUp: isSignedUp });
});


router.get('/signup', checkNotSignIn, function(req, res, next) {
    res.render("signup");
});


/* GET main page. */
router.get('/main', checkSignIn, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, 'user_id', req.mySession.user_id, function (err, output) {
        if (err) {
            console.log("ERORR!! requestList");
            throw err;
        }

        console.log('successful finish list.');
        res.render('main', { locs: locs, list: output });
    })
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
