var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signin', function(req, res) {
    // console.log(req.headers);
    var usermail = req.body.usermail;
    var pw = req.body.pw;

    console.log(usermail + '/ ' + pw);// + ' / ' + pw);
    console.log(req.mySession);

    if (!req.mySession.isSigned) {
        req.mySession.isSigned = true;
        req.mySession.usermail = usermail;
        // TODO: 닉네임 가져오기 구현
        // req.mySession.username = username;
    }

    res.redirect("/main");
});

router.post('/signup', function(req, res) {
    // console.log(req.headers);
    var username = req.body.username;
    var usermail = req.body.usermail;
    var pw = req.body.pw;

    console.log(username + ' / ' + usermail + ' / ' + pw);
    console.log(req.mySession);

    if (req.mySession.isSigned) {
        req.send("You're already signed in.");
    }
    else {
        req.mySession.isSignedUp = true;
        console.log(JSON.stringify(req.mySession));
    }

    res.redirect("/signin");
});

router.get('/signout', function(req, res) {
    // console.log(req.headers);
    console.log(req.mySession);

    if (req.mySession.isSigned) {
        req.mySession.destroy();  // 세션 삭제
        // res.clearCookie(''); // 세션 쿠키 삭제
    }
    res.redirect("/signin");
});

module.exports = router;
