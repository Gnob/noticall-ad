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
    console.log('middleware in client for checkSignIn');

    var token = req.get('Authorization');

    if (token) {
        try {
            var mail = decrypt(token, req.app.locals.pk);
        }
        catch (e) {
            console.info(e);
            var resJson = {
                status:"401",
                message: "인증이 올바르지 않습니다."
            };

            console.info(resJson.message);
            return res.json(resJson);
        }
        var pool = req.app.locals.pool;
        var mysql_escape = req.app.locals.mysql_escape;

        query.findMail(pool, mysql_escape, 'consumer', mail, function (err, user) {
            if (err) {
                var resJson = {
                    status:"401",
                    message: "아이디나 비밀번호를 확인해주세요."
                };

                console.info(resJson.message);
                return res.json(resJson);
            }

            res.locals.consumer = user;

            console.info("This user is signed in");
            console.info(user);

            return next();
        });
    }
    else {
        var resJson = {
            status:"401",
            message: "아이디나 비밀번호를 확인해주세요."
        };

        console.info(resJson.message);
        return res.json(resJson);
    }
}


function getUserFromHeader(req, res, next) {
    console.log('middleware in client for getUserFromHeader');

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


router.post('/point', checkSignIn, function (req, res) {
    var resJson = {
        status:"200",
        message: "갱신에 성공했습니다.",
        name: res.locals.consumer.nickname,
        point: res.locals.consumer.point
    };
    console.info(resJson.message);
    res.json(resJson);
});


router.post('/signin', getUserFromHeader, function(req, res, next) {
    console.log('init');
    var TAG = '<CLIENT> [/signin]';

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

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
            console.log(TAG + ' Not valid username or pw....');
            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
            resJson = {
                status:"401",
                message: "아이디나 비밀번호를 확인해주세요."
            };
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
            console.log(TAG + ' Success sign in, return token');

            var token = encrypt(rows[0].mail, req.app.locals.pk);

            resJson = {
                status:"200",
                message: "로그인에 성공했습니다.",
                name: rows[0].nickname,
                point: rows[0].point,
                token: token
            };
        }

        console.info(resJson.message);
        res.json(resJson);
    });
});


router.post('/signup', getUserFromHeader, function(req, res, next) {
    var TAG = '<CLIENT> [/signup]'

    res.locals.user.nickname = req.body.nickname

    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;
    var con;

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
                    + mysql_escape(res.locals.user.mail), callback);
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

                console.info(resJson.message);
                return res.json(resJson);
            }
            else {
                console.log(TAG + ' query to check nickname (SELECT)');

                con.query('SELECT * FROM consumer WHERE nickname='
                        + mysql_escape(res.locals.user.nickname), callback);
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
                var resJson = {
                    status: "404",
                    message: "이미 존재하는 이름입니다.",
                    field: "name"
                };

                console.info(resJson.message);
                return res.json(resJson);
            }
            else {
                console.log(TAG + ' query to insert user into DB (INSERT)');

                con.query('INSERT INTO consumer SET ?', res.locals.user, callback);
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
        else {
            console.log(TAG + ' Success sign up finish');

            var token = encrypt(res.locals.user.mail, req.app.locals.pk);

            resJson = {
                status: "200",
                message: "회원가입에 성공했습니다.",
                token: token
            };
        }

        console.info(resJson.message);
        res.json(resJson);
    });
});


router.post('/count/add', checkSignIn, function(req, res, next) {
    var TAG = '<CLIENT> [/count/add]';
    var pool = req.app.locals.pool;

    query.addCount(pool, req.body.type + "_files", req.body.count, req.body.id, function(err) {
        var resJson;

        if (err) {
            console.log(TAG + " Can't add count...");
            console.log(req.body);
            console.error(err);
            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }
        else {
            resJson = {
                status: "200",
                message: "카운트 증가에 성공했습니다."
            };
        }


        console.info(resJson.message);
        return res.json(resJson);
    });
});


router.post('/point/add', checkSignIn, function(req, res, next) {
    var TAG = '<CLIENT> [/point/add]';
    var pool = req.app.locals.pool;

    query.addPoint(pool, "consumer", 10, res.locals.consumer.user_id, function(err) {
        var resJson;

        if (err) {
            console.log(TAG + " Can't add point...");
            console.log(req.body);
            console.error(err);
            resJson = {
                status:"500",
                message: "오류가 발생했습니다. 다시 시도 해주세요."
            };
        }
        else {
            resJson = {
                status: "200",
                message: "포인트 증가에 성공했습니다."
            };
        }


        console.info(resJson.message);
        return res.json(resJson);
    });
});


module.exports = router;
