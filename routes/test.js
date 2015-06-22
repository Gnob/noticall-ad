var express = require('express');
var router = express.Router();


router.get('/insert', function(req, res, next) {
    var user = {
        'username': 'Tester',
        'mail': 'test@test.com',
        'pw': 'testtest'
    };

    var pool = req.app.locals.pool;

    pool.getConnection(function(err, connection) {
        var query = connection.query('INSERT INTO advertiser SET ?', user, function(err, result) {
            connection.release();

            if (err) {
                console.error(err);
                throw err;
            }

            console.log(query);
            console.log('\n');
            console.log(result);

            res.status(200).send('success');
        });
    });

});


router.get('/select', function(req, res, next) {
    var pool = req.app.locals.pool;

    pool.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM advertiser', function(err, rows){
            connection.release();

            console.log(rows);

            res.json(rows);
        });
    });
});


router.get('/where', function(req, res, next) {
    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;

    pool.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM advertiser where username='
                + mysql_escape(req.query.username)
                + ' and pw=' + mysql_escape(req.query.pw), function(err, rows) {
            connection.release();

            if (err) {
                console.error(err);
                throw err;
            }

            console.log(rows);

            res.json(rows);
        });
    });
});

module.exports = router;
