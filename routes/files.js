var express = require('express');
var async = require('async');
var multer  = require('multer');
var query = require('./query');
var fs = require('fs');
var router = express.Router();

router.use(function(req, res, next) {
    console.log('middleware in files');
    if (req.mySession.isSignedIn) {
        return next();
    }

    res.redirect('/signin');
});

// middleware of /upload to set up MULTER with req, res object
router.use('/upload', function(req, res, next) {
    var handler = multer({
        dest: './public/uploads/',
        limits: {
            fieldNameSize: 100,
            fieldSize: 30,
            fileSize: 1024 * 1024 * 10,
            files: 2,
            fields: 4
        },
        includeEmptyFields: false,
        putSingleFilesInArray: true,
        rename: function (fieldname, filename) {
            return filename+Date.now();
        },
        onFileUploadStart: function (file, req, res) {
            console.log("[onFileUploadStart] enter");

            var isMp3 = file.extension == 'mp3';
            var isJpg = file.extension == 'jpg';

            if (!isMp3 && !isJpg) {
                console.log("[onFileUploadStart] extension error");
                if (req.app.locals.invalid_ext) {
                    res.json({ msg: "Invalid Extension" });
                    req.app.locals.invalid_ext = 2;
                } else {
                    req.app.locals.invalid_ext = 1;
                }
                return false;
            }
            else if (isMp3) {
                req.app.locals.isMp3 = isMp3;
            }
            else if (isJpg) {
                req.app.locals.isJpg = isJpg;
            }

            console.log("[onFileUploadStart]" + file.originalname + ' is starting ...');
        },
        onFileUploadComplete: function (file, req, res) {
            console.log("[onFileUploadComplete] " + file.fieldname + ' uploaded to  ' + file.path);
        },
        onFileSizeLimit: function (file) {
            console.log("[onFileSizeLimit] " + 'Failed: ', file.originalname);

            fs.unlink('./' + file.path, function (err) {
                if (err) throw err;
                console.log('successfully deleted');
            }); // delete the partially written file

            res.redirect('/main');
        },
        onFilesLimit: function () {
            console.log('[onFilesLimit] Crossed file limit!');
        },
        onParseEnd: function (req, next) {
            console.log('[onParseEnd] Form parsing completed at: ', new Date());

            console.log(req.body);

            // call the next middleware
            next();
        },
        onError: function (error, next) {
            console.log(error)
            next(error)
        }
    });

    handler(req, res, next);
});


// TODO: Upload Cancel 불가능...
router.post('/upload', function(req, res) {
    var TAG = '[/upload]';

    var mp3_file = req.files.ADmp3 && req.files.ADmp3[0];
    var jpg_file = req.files.ADimage && req.files.ADimage[0];
    var isSizeLimit = (mp3_file && mp3_file.truncated) || (jpg_file && jpg_file.truncated);
    var isValid = req.app.locals.isMp3 && req.app.locals.isJpg && !isSizeLimit;

    console.log("====test====");
    console.log("============");

    if (req.app.locals.invalid_ext != 2) {
        if (!isValid) {
            var COND = ' INVALID ::';

            console.log(TAG + COND + " Invalid routine start");
            console.log(TAG + COND + " Uploaded file delete routine START");
            if (mp3_file) {
                console.log(mp3_file);
                query.deleteFile(TAG + COND + ' MP3 FILE ::', mp3_file.path);
            }
            if (jpg_file) {
                console.log(jpg_file);
                query.deleteFile(TAG + COND + ' JPG FILE ::', jpg_file.path);
            }
            console.log(TAG + COND + " Uploaded file delete routine END");

            console.log(TAG + COND + " If it is size limit, don't response here.");
            if (!isSizeLimit) {
                console.log(TAG + COND + " Invalid routine is finished.");
                res.json("Upload Error");
            }
        }
        else {
            var COND = ' VALID ::';
            if (mp3_file && jpg_file) {
                query.insertItem(TAG + COND, mp3_file, jpg_file, req, res);
            }
            else {
                console.log(TAG + COND + " But upload error : " + mp3_file + " / " + jpg_file + " / " + isValid);
                res.json("Valid but upload error");
            }
        }
    }
    else {
        var COND = ' EXTENSION ERROR ::'
        console.log(TAG + COND + " Already response is finished");
    }
});


router.get('/down/:type/:id', function(req, res, next) {
    var TAG = '[/down]'
    var con;

    var pool = req.app.locals.pool;

    query.requestFile(pool, req.params.type, req.params.id, function(err, file) {
        if (err) {
            console.log(TAG + " ERORR!! requestFile");
            throw err;
        }

        console.log(TAG + ' Success to get file uri, serve the file to client.');
        res.download(file.uri, file.filename, function (err) {
            if (err) {
                console.log(TAG + " ERORR!! transfer to download file");
                throw err;
            }
            console.log(TAG + ' Download finish.');
        });
    });
});


router.get('/list', function(req, res, next) {
    var TAG = '[/list]';

    var locs = ["서울", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

    var pool = req.app.locals.pool;

    query.requestList(pool, 'user_id', req.mySession.user_id, function (err, output) {
        if (err) {
            console.log(TAG + " ERORR!! requestList");
            throw err;
        }

        console.log(TAG + ' Success finish list.')
        // res.render('main', output).end();
        res.json(output);
    })
});


// list_id를 참조하자.
router.get('/delete/:listId', function(req, res, next) {
    var TAG = '[/delete]'

    if(!req.params.listId) {
        res.json({msg: 'Unavailable access'});
    }
    else {
        query.deleteItem(TAG, req, res);
    }
});


module.exports = router;
