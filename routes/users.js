var express = require('express');
var async = require('async');
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


router.post('/signin', checkNotSignIn, function(req, res) {
    var TAG = '[/signin]';

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    var user = req.body;

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to check mail and pw (SELECT)");

            con = connection;

            con.query('SELECT * FROM advertiser where mail='
                    + mysql_escape(user.mail)
                    + ' and pw=' + mysql_escape(user.pw), callback);
        }
    ],
    function (err, rows) {
        con.release();

        if (err) {
            console.error(err);
            throw err;
        }
        else if (rows.length == 0) {
            console.log(TAG + ' Not valid mail or pw....');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            res.json({msg: "[Error] 이메일 주소나 비밀번호를 확인해주세요."});
        }
        else if (rows.length > 1) {
            console.error(TAG + ' Unknown error : 중복된 가입자 정보가 존재합니다.');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            res.json({msg: "[Error#01] 관리자에게 문의해주세요."});
        }
        else {
            console.log(TAG + ' Success sign in, redirect /main');

            if (!req.mySession.isSignedIn) {
                req.mySession.isSignedIn = true;
                req.mySession.isSuper = rows[0].super;
                req.mySession.user_id = rows[0].user_id;
                req.mySession.username = rows[0].username;
            }

            res.redirect("/main");
        }
    });
});


router.post('/signup', checkNotSignIn, function(req, res) {
    var TAG = '[/signup]'

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;

    var user = req.body;

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to check username (SELECT)");

            con = connection;

            con.query('SELECT * FROM advertiser WHERE username='
                    + mysql_escape(user.username), callback);
        },
        function(rows, result, callback) {
            if (rows.length > 0) {
                con.release();
                console.log(TAG + ' Existing name....');
                console.log('---------------------------------');
                console.log(rows);
                console.log('---------------------------------');
                // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
                return res.json({msg: "[Error] 이미 존재하는 이름입니다."});
            }
            else {
                console.log(TAG + ' query to check mail (SELECT)');

                con.query('SELECT * FROM advertiser WHERE mail='
                        + mysql_escape(user.mail), callback);
            }
        },
        function(rows, result, callback) {
            if (rows.length > 0) {
                con.release();
                console.log(TAG + ' Existing mail....');
                console.log('---------------------------------');
                console.log(rows);
                console.log('---------------------------------');
                // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 메일...
                res.json({msg: "[Error] 이미 존재하는 메일입니다."});
            }
            else {
                console.log(TAG + ' query to insert user into DB (INSERT)');

                con.query('INSERT INTO advertiser SET ?', user, callback);
            }
        }
    ],
    function (err, result) {
        con.release();

        if (err) {
            console.error(err);
            throw err;
        }

        console.log(TAG + ' Success sign up, redirect /signin');

        req.mySession.isSignedUp = true;
        res.redirect("/signin");
    });
});


router.get('/signout', checkSignIn, function(req, res) {
    // console.log(req.headers);
    console.log(req.mySession);

    req.mySession.destroy();  // 세션 삭제

    res.redirect("/signin");
});

module.exports = router;
