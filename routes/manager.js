var express = require('express');
var async = require('async');
var query = require('./query');
var router = express.Router();

function checkSuper(req, res, next) {
    console.log('middleware');
    if (req.mySession.isSuper) {
        return next();
    }

    res.redirect('/signin');
}


router.get('/', checkSuper, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, null, null, function (err, output) {
        if (err) {
            console.log("ERORR!! requestList");
            throw err;
        }

        console.log('successful finish list.');
        res.render('manage', { username : req.mySession.username, locs: locs, list: output });
    });
});


router.get('/allow/:itemId/:flag', checkSuper, function(req, res, next) {
    var pool = req.app.locals.pool;
    var flag = req.params.flag == 'o' ? true : false;

    query.allowItem(pool, req.params.itemId, flag, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.send('Update!');
        } catch (ex) {
            console.error(ex);
            if (ex.name == 'NotExistItem') {
                res.json({ msg: ex.message });
            } else {
                res.json(ex.message);
            }
        }
    });
});


router.get('/super/:username/:flag', checkSuper, function(req, res, next) {
    var TAG = '[/super]';

    var pool = req.app.locals.pool;
    var flag = req.params.flag == 'o' ? true : false;

    query.giveSuper(pool, req.params.username, flag, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.send('Update!');
        } catch (ex) {
            console.error(ex);
            if (ex.name == 'NotExistUser') {
                res.json({ msg: ex.message });
            } else {
                res.json(ex.message);
            }
        }
    });
});


module.exports = router;
