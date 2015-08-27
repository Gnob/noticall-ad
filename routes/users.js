var express = require('express');
var async = require('async');
var router = express.Router();


function checkSignIn(req, res, next) {
    console.log('middleware in users for checkSignIn');
    if (req.mySession.isSignedIn) {
        return next();
    }

    var resJson = {
        status: "408",
        message: "로그인이 되어있지 않습니다. 로그인 해주세요."
    };

    console.log(resJson.message);
    res.json(resJson);
}

function checkNotSignIn(req, res, next) {
    console.log('middleware in users for checkNotSignIn');
    if (!req.mySession.isSignedIn) {
        return next();
    }

    var resJson = {
        status: "408",
        message: "이미 로그인된 회원입니다."
    };

    console.log(resJson.message);
    res.json(resJson);
}


// TODO: req_data Authorization Vaildation
function getUserFromHeader(req, res, next) {
    console.log('middleware in users for getUserFromHeader');

    var req_data = req.get('Authorization');

    if (!req_data) {
        var resJson = {
            status: "400",
            message: "헤더가 비어있습니다."
        };
        console.info(resJson.message);
        return res.json(resJson);

    }
    else {
        var data = new Buffer(req_data, 'base64').toString('utf-8').split(':');
        var pw = "";
        for (var i = 1; i < data.length; i++) {
            pw += data[i]
        }

        res.locals.user = {
            mail: data[0],
            pw: pw
        };

        console.log(req_data);
        console.log(data);
        console.log(res.locals.user);

        next();
    }
}


router.post('/signin', checkNotSignIn, getUserFromHeader, function(req, res) {
    console.log('init');
    var TAG = '[/signin]';

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    console.log(req.body);
    console.log(res.locals.user);

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
                    + mysql_escape(res.locals.user.mail)
                    + ' and pw=' + mysql_escape(res.locals.user.pw), callback);
        }
    ],
    function (err, rows) {
        con.release();

        var resJson;

        if (err) {
            console.error(err);
            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }
        else if (rows.length == 0) {
            console.log(TAG + ' Not valid mail or pw....');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            resJson = {
                status:"401",
                message: "이메일 주소나 비밀번호를 확인해주세요."
            }
        }
        else if (rows.length > 1) {
            console.error(TAG + ' Unknown error : 중복된 가입자 정보가 존재합니다.');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            resJson = {
                status:"401",
                message: "관리자에게 문의해주세요."
            };
        }
        else {
            console.log(TAG + ' Success sign in, redirect /main');

            req.mySession.isSignedIn = true;
            req.mySession.isSuper = rows[0].super;
            req.mySession.user_id = rows[0].user_id;
            req.mySession.username = rows[0].username;
            req.mySession.token = new Buffer(rows[0].username + ':' + rows[0].pw).toString('base64');

            resJson = {
                status: "200",
                message: "로그인에 성공했습니다.",
                data: {
                    username: req.mySession.username,
                    token: req.mySession.token,
                    isSuper: req.mySession.isSuper
                }
            }
        }
        console.log(TAG + ' ' + resJson.message);
        res.json(resJson);
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

                var resJson = {
                    status: "404",
                    message: "이미 존재하는 이름입니다.",
                    field: "name"
                };
                console.log(resJson.message);
                return res.json(resJson);
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

                var resJson = {
                    status: "404",
                    message: "이미 존재하는 메일입니다.",
                    field: "mail"
                };
                console.log(resJson.message);
                return res.json(resJson);
            }
            else {
                console.log(TAG + ' query to insert user into DB (INSERT)');

                con.query('INSERT INTO advertiser SET ?', user, callback);
            }
        }
    ],
    function (err, result) {
        con.release();

        var resJson;

        if (err) {
            console.error(err);
            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }

        console.log(TAG + ' Success sign up');

        req.mySession.isSignedUp = true;
        // res.redirect("/signin");

        resJson = {
           status: "200",
           message: "회원가입에 성공했습니다."
        };
        console.log(resJson.message);
        res.json(resJson);
    });
});


router.get('/signout', checkSignIn, function(req, res) {
    // console.log(req.headers);
    console.log(req.mySession);

    req.mySession.destroy();  // 세션 삭제


    var resJson = {
        status:"200",
        message: "로그아웃에 성공했습니다.",
        path: '/signin'
    };
    console.info(resJson.message);
    res.json(resJson);
});

module.exports = router;
