var express = require('express');
var async = require('async');
var query = require('./query');
var router = express.Router();

function checkSuper(req, res, next) {
    console.log('middleware in manager');
    console.log(req.mySession.isSuper);
    console.log(req.get('Superuser'))
    if (req.mySession.token == req.get('Authorization') && req.mySession.isSuper == 1) {
        return next();
    }

    res.status(403).json({ path: '/signin' });
}


router.get('/list', checkSuper, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    var TAG = '[SUPER /list]';
    var locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, null, null, function (err, output) {
        if (err) {
            console.log(TAG + " ERORR!! requestList");
            throw err;
        }

        console.log(TAG + ' Success finish list.')
        // res.render('main', output).end();
        res.json(output);
    });
});


router.post('/chmod', checkSuper, function(req, res, next) {
    var pool = req.app.locals.pool;

    var data = req.body;

    console.log('in chmod');
    console.log(req.body);

    if (data.method == 'allow') {
        query.allowItem(pool, data.item_id, function(err) {
            try {
                if (err) {
                    throw err;
                }

                res.json('Update!');
            } catch (ex) {
                console.error(ex);
                if (ex.name == 'NotExistItem') {
                    res.json({ msg: ex.message });
                } else {
                    res.json(ex.message);
                }
            }
        });
    }
    else if (data.method == 'disallow') {
        query.disallowItem(pool, data.item_id, data.memo, function(err) {
            try {
                if (err) {
                    throw err;
                }

                res.json('Update!');
            } catch (ex) {
                console.error(ex);
                if (ex.name == 'NotExistItem') {
                    res.json({ msg: ex.message });
                } else {
                    res.json(ex.message);
                }
            }
        });
    }
    else {
        res.status(403).json("{msg:'잘못된 요청입니다.'}")
    }

});


// router.get('/allow/:itemId/:flag', checkSuper, function(req, res, next) {
//     var pool = req.app.locals.pool;
//     var flag = req.params.flag == 'o' ? true : false;
//
//     query.allowItem(pool, req.params.itemId, flag, function(err) {
//         try {
//             if (err) {
//                 throw err;
//             }
//
//             res.json('Update!');
//         } catch (ex) {
//             console.error(ex);
//             if (ex.name == 'NotExistItem') {
//                 res.json({ msg: ex.message });
//             } else {
//                 res.json(ex.message);
//             }
//         }
//     });
// });


router.get('/super/:username/:flag', checkSuper, function(req, res, next) {
    var TAG = '[/super]';

    var pool = req.app.locals.pool;
    var flag = req.params.flag == 'o' ? true : false;

    query.giveSuper(pool, req.params.username, flag, function(err) {
        try {
            if (err) {
                throw err;
            }

            res.json('Update!');
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
