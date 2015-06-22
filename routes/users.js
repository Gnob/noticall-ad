var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/signin', function(req, res) {
    // console.log(req.headers);
    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;

    var user = req.body;
    var isSignedIn = req.mySession.isSignedIn;

    console.log(user);// + ' / ' + pw);
    console.log(req.mySession);

    if (isSignedIn) {
        res.redirect("/main");
    }
    else {
        pool.getConnection(function(err, con) {
            console.log('check mail and pw...');
            con.query('SELECT * FROM advertiser where mail='
                    + mysql_escape(user.mail)
                    + ' and pw=' + mysql_escape(user.pw), function(err, rows) {
                con.release();

                if (err) {
                    console.error(err);
                    throw err;
                }
                else if (rows.length == 0) {
                    console.log('Not valid mail or pw....');
                    // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
                    res.send("[Error] 이메일 주소나 비밀번호를 확인해주세요.");
                }
                else if (rows.length > 1) {
                    console.error('Unknown error : 중복된 가입자 정보가 존재합니다.');
                    // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
                    res.send("[Error#01] 관리자에게 문의해주세요.");
                }
                else {
                    console.log('Success sign in, redirect /main');
                    if (!req.mySession.isSignedIn) {
                        req.mySession.isSignedIn = true;
                        req.mySession.username = rows[0].username;
                        req.mySession.mail = rows[0].mail;
                    }

                    res.redirect("/main");
                }
            });
        });
    }
});


router.post('/signup', function(req, res) {
    // console.log(req.headers);
    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;

    var user = req.body;
    var isSignedIn = req.mySession.isSignedIn;

    console.log('/signup ---- Enter');
    console.log(JSON.stringify(user));
    console.log(req.mySession);

    if (isSignedIn) {
        console.log('already signed in...');
        res.send("You're already signed in.");
    }
    else {
        pool.getConnection(function(err, con) {
            console.log('check username...');
            con.query('SELECT * FROM advertiser where username='
                    + mysql_escape(user.username), function(err, rows) {
                if (err) {
                    con.release();
                    console.error(err);
                    throw err;
                }
                else if (rows.length > 0) {
                    con.release();
                    console.log(rows);
                    console.log('Existing name....');
                    // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 이름...
                    res.send("[Error] 이미 존재하는 이름입니다.");
                }
                else {
                    console.log('check mail...');
                    con.query('SELECT * FROM advertiser where mail='
                            + mysql_escape(user.mail), function(err, rows) {
                        if (err) {
                            con.release();
                            console.error(err);
                            throw err;
                        }
                        else if (rows.length > 0) {
                            con.release();
                            console.log(rows);
                            console.log('Existing mail...');
                            // TODO: 에러 페이지 구현 - [회원가입]이미 존재하는 메일...
                            res.send("[Error] 이미 존재하는 메일입니다.");
                        }
                        else {
                            console.log('insert user into db...');
                            con.query('INSERT INTO advertiser SET ?', user, function(err, rows) {
                                con.release();

                                if (err) {
                                    console.error(err);
                                    throw err;
                                }

                                req.mySession.isSignedUp = true;
                                console.log('Success sign up, redirect /signin');
                                res.redirect("/signin");
                            });
                        }
                    });
                }
            });
        });
    }
});


router.get('/signout', function(req, res) {
    // console.log(req.headers);
    console.log(req.mySession);

    if (req.mySession.isSignedIn) {
        req.mySession.destroy();  // 세션 삭제
        // res.clearCookie(''); // 세션 쿠키 삭제
    }
    res.redirect("/signin");
});

module.exports = router;
