var express = require('express');
var path = require('path');
var query = require('./query');
var router = express.Router();


function checkSignIn(req, res, next) {
    console.log(req.mySession);
    if (req.mySession.isSignedIn) {
        if(req.mySession.isSuper) {
            res.redirect('/manager');
        }
        else {
            return next();
        }
    }

    res.redirect('/signin');
}

function checkNotSignIn(req, res, next) {
    console.log('middleware');
    if (!req.mySession.isSignedIn) {
        return next();
    }

    if(req.mySession.isSuper) {
        res.redirect('/manager');
    }
    else {
        res.redirect('/main');
    }
}


router.get('/', checkSignIn, function(req, res, next) {
    res.redirect("/main");
});


router.get('/router', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../public/templates/', 'router.html'));
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
        res.render('main', { username : req.mySession.username, locs: locs, list: output });
    });
});


module.exports = router;
