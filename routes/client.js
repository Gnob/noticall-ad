var express = require('express');
var query = require('./query');
var async = require('async');
var crypto = require("crypto");
var router = express.Router();


function encrypt(text, key){
    console.log('in encrypt');

    var cipher = crypto.createCipher('aes-256-cbc',key);
    var encipheredContent = cipher.update(text,'utf8','hex');

    encipheredContent += cipher.final('hex');

    return encipheredContent;
}


function decrypt(text, key){
    console.log('in decrypt');

    var decipher = crypto.createDecipher('aes-256-cbc',key);
    var decipheredPlaintext = decipher.update(text,'hex','utf8');

    decipheredPlaintext += decipher.final('utf8');

    return decipheredPlaintext;
}

/*
----------------------------------
    signin : 가입시 받는 Token은 mail:pw base64 인코딩
        (Authorization 헤더로 날아옴. 하지만 Basic은 안붙어있음)
    나머지 : 가입완료 후, 혹은 로그인 후 발급하는 Token은 mail을 aes-256-cbc로 암호화
        따라서 이 Token을 Authorization 헤더에 싣어서 보내면 된다.
----------------------------------
*/

function checkSignIn(req, res, next) {
    console.log('middleware in manager for checkSignIn');

    var token = req.get('Authorization');

    if (token) {
        var mail = decrypt(token, req.app.locals.pk);
        var pool = req.app.locals.pool;
        var mysql_escape = req.app.locals.mysql_escape;

        query.findMail(pool, mysql_escape, 'consumer', mail, function (err, user) {
            if (err) {
                return res.json({
                    status:"401",
                    message: "아이디나 비밀번호를 확인해주세요."
                });
            }

            res.locals.consumer = user;

            return next();
        });
    }
    else {
        return res.json({
            status:"401",
            message: "아이디나 비밀번호를 확인해주세요."
        });
    }
}


router.post('/test', function (req, res) {
    // res.json({ token: req.get('Authorization'), username: decrypt(token, req.app.locals.pk) });

    res.json({ token: "test" });
});


router.post('/point', checkSignIn, function (req, res) {
    res.json({
        status:"200",
        message: "갱신에 성공했습니다.",
        name: res.locals.consumer.name,
        point: res.locals.consumer.point
    });
});


router.post('/signin', function(req, res) {
    console.log('init');
    var TAG = '<CLIENT> [/signin]';

    var req_data = req.get('Authorization');

    if (!req_data) {
        res.json({
            status: "400",
            message: "헤더가 비어있습니다."
        });
    }

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    console.log(req.body);
    var data = new Buffer(req_data, 'base64').toString('utf-8').split(':');
    var pw = data[1];
    for (var i = 2; i < data.length; i++) {
        pw += data[i]
    }

    var user = {
        mail: data[0],
        pw: pw
    };

    console.log(req_data);
    console.log(data);
    console.log(user);

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to check username and pw (SELECT)");

            con = connection;

            con.query('SELECT * FROM consumer where mail='
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
            console.log(TAG + ' Not valid username or pw....');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            res.json({
                status:"401",
                message: "아이디나 비밀번호를 확인해주세요."
            });
        }
        else if (rows.length > 1) {
            console.error(TAG + ' Unknown error : 중복된 가입자 정보가 존재합니다.');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            res.json({
                status:"401",
                message: "관리자에게 문의해주세요."
            });
        }
        else {
            console.log(TAG + ' Success sign in, return token');

            var token = encrypt(rows[0].mail, req.app.locals.pk);

            res.json({
                status:"200",
                message: "로그인에 성공했습니다.",
                name: rows[0].nickname,
                point: rows[0].point,
                token: token
            });
        }
    });
});


router.post('/signup', function(req, res) {

    console.log(req.body);

    var TAG = '<CLIENT> [/signup]'

    var req_data = req.get('Authorization');

    if (!req_data) {
        res.json({
            status: "400",
            message: "헤더가 비어있습니다."
        });
    }

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

    var data = new Buffer(req_data, 'base64').toString('utf-8').split(':');
    var pw = data[1];
    for (var i = 2; i < data.length; i++) {
        pw += data[i]
    }

    var user = {
        mail: data[0],
        pw: pw,
        nickname: req.body.nickname
    };

    console.log(req.body);
    console.log(req_data);
    console.log(data);
    console.log(user)

    async.waterfall([
        function(callback) {
            console.log(TAG + " Start in waterfall");
            console.log(TAG + " getConnection()");

            pool.getConnection(callback);
        },
        function(connection, callback) {
            console.log(TAG + " query to check mail (SELECT)");

            con = connection;

            con.query('SELECT * FROM consumer WHERE mail='
                    + mysql_escape(user.mail), callback);
        },
        function(rows, result, callback) {
            if (rows.length > 0) {
                con.release();
                console.log(TAG + ' Existing mail....');
                console.log('---------------------------------');
                console.log(rows);
                console.log('---------------------------------');
                // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 메일...
                return res.json({
                    status: "404",
                    message: "이미 존재하는 메일입니다.",
                    field: "mail"
                });
            }
            else {
                console.log(TAG + ' query to check nickname (SELECT)');

                con.query('SELECT * FROM consumer WHERE nickname='
                        + mysql_escape(user.nickname), callback);
            }
        },
        function(rows, result, callback) {
            if (rows.length > 0) {
                con.release();
                console.log(TAG + ' Existing name....');
                console.log('---------------------------------');
                console.log(rows);
                console.log('---------------------------------');
                // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
                res.json({
                    status:"404",
                    message: "이미 존재하는 이름입니다.",
                    field:"name"
                });
            }
            else {
                console.log(TAG + ' query to insert user into DB (INSERT)');

                con.query('INSERT INTO consumer SET ?', user, callback);
            }
        }
    ],
    function (err, result) {
        con.release();

        if (err) {
            console.error(err);
            throw err;
        }

        console.log(TAG + ' Success sign up finish');

        var token = encrypt(user.mail, req.app.locals.pk);

        res.json({
            status: "200",
            message: "회원가입에 성공했습니다.",
            token: token
        });
    });

    // console.log(req.get('Authorization'));
    // console.log(req.body);
    // res.json({ token: req.get('Authorization'), body:req.body});
});


router.post('/add', checkSignIn, function(req, res, next) {
    var TAG = '<CLIENT> [/add]';
    var pool = req.app.locals.pool;

    query.addCount(pool, req.body.type + "_files", req.body.count, req.body.id, function(err) {
        if (err) {
            console.log(TAG + " Can't add count...");
            console.log(req.body);
            console.error(err);
            return res.json({
                status: "400",
                message: "요청이 실패했습니다."
            });
        }

        return res.json({
            status: "200",
            message: "증가에 성공했습니다."
        });
    });
});


module.exports = router;
