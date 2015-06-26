var express = require('express');
var async = require('async');
var query = require('./query');
var multiparty = require('multiparty');
var router = express.Router();


router.post('/upload', function(req, res, next) {
    var count = 0;
    var form = new multiparty.Form();

    // Errors may be emitted
    // Note that if you are listening to 'part' events, the same error may be
    // emitted from the `form` and the `part`.
    form.on('error', function(err) {
      console.log('Error parsing form: ' + err.stack);
    });

    // Parts are emitted when parsing the form
    form.on('part', function(part) {
      // You *must* act on the part by reading it
      // NOTE: if you want to ignore it, just call "part.resume()"

      console.log(part);

      if (!part.filename) {
        // filename is not defined when this is a field and not a file
        console.log('got field named ' + part.name);
        // ignore field's content
        part.resume();
      }

      if (part.filename) {
        // filename is defined when this is a file
        count++;
        console.log('got file named ' + part.name);
        // ignore file's content here
        part.resume();
      }

      part.on('error', function(err) {
        // decide what to do
      });
    });

    // Close emitted after form parsed
    form.on('close', function() {
      console.log('Upload completed!');
    });

    // Parse req
    form.parse(req, function(err, fields, files) {
      Object.keys(fields).forEach(function(name) {
        console.log('got field named ' + name);
      });

      Object.keys(files).forEach(function(name) {
        console.log('got file named ' + name);
        console.log(files);
      });

      console.log('Upload completed!');
      res.json({msg:'finish'})
    });
});

router.get('/allow/:itemId/:flag', function(req, res, next) {
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


router.get('/super/:username/:flag', function(req, res, next) {
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


router.get('/waterfall', function(req, res, next) {
    var user = {
        'username': 'Waterfall44',
        'mail': 'test44@water.fall',
        'pw': 'testtest'
    };

    var pool = req.app.locals.pool;

    async.waterfall([
        function(callback) {
            pool.getConnection(callback);
        },
        function(con, callback) {
            con.query('INSERT INTO advertiser SET ?', user, function(err, result) {
                callback(err, result, con);
            });
        }
    ],
    function (err, result, con) {
        con.release();

        if (err) {
            console.error(err);
            throw err;
        }

        console.log(result);

        res.status(200).send('success');
    });
});

router.get('/insert', function(req, res, next) {
    var user = {
        'username': 'Tester44',
        'mail': 'test44@test.com',
        'pw': 'testtest44'
    };

    var pool = req.app.locals.pool;

    pool.getConnection(function(err, connection) {
        var query = connection.query('INSERT INTO advertiser SET ?', user, function(err, result) {
            connection.release();

            if (err) {
                console.error(err);
                throw err;
            }

            console.log(result);

            res.status(200).send('success');
        });
    });

});


router.get('/select', function(req, res, next) {
    var pool = req.app.locals.pool;

    pool.getConnection(function(err, connection) {
        var output = [];
        connection.query('SELECT * FROM advertiser', function(err, rows){
            output.push("====advertiser====");
            output.push(rows);
            connection.query('SELECT * FROM consumer', function(err, rows){
                output.push("====consumer====");
                output.push(rows);
                connection.query('SELECT * FROM audio_files', function(err, rows){
                    output.push("====audio_files====");
                    output.push(rows);
                    connection.query('SELECT * FROM poster_files', function(err, rows){
                        output.push("====poster_files====");
                        output.push(rows);
                        connection.query('SELECT * FROM file_list', function(err, rows){
                            output.push("====file_list====");
                            output.push(rows);
                            connection.query('SELECT * FROM ad_item', function(err, rows){
                                output.push("====ad_item====");
                                output.push(rows);

                                connection.release();

                                var i, j;
                                var outstring = "";

                                for (i=0;i<output.length;i++) {
                                    if (typeof output[i] === 'object') {
                                        for (j=0;j<output[i].length;j++) {
                                            outstring += JSON.stringify(output[i][j]);
                                            outstring += "<br>";
                                        }
                                    }
                                    else {
                                        outstring += output[i];
                                        outstring += "<br>";
                                    }
                                }

                                res.send(outstring);
                            });
                        });
                    });
                });
            });
        });
    });
});


router.get('/join', function(req, res, next) {
    var pool = req.app.locals.pool;

    pool.getConnection(function(err, con) {
        // con.query('SELECT file_list.location, ad_item.title, audio_files.filename, audio_files.down_count, poster_files.filename, poster_files.down_count From file_list ' +
        // 'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id ' +
        // 'INNER JOIN audio_files ON file_list.audio_id = audio_files.file_id ' +
        // 'INNER JOIN poster_files ON file_list.poster_id = poster_files.file_id;',
        con.query('SELECT file_list.location, ad_item.title, audio_files.filename AS audio_name, audio_files.down_count AS audio_count From file_list ' +
        'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id ' +
        'INNER JOIN audio_files ON file_list.audio_id = audio_files.file_id ' +
        'WHERE file_list.list_id=4',
        function (err, rows) {
            if (err) {
                con.release();
                console.error(err);
                throw err;
            }

            if (rows.length == 0) {
                con.release();
                console.log("Empty list");
                res.json({msg: "Empty list... Check id"}).end();
            }
            else {
                var output = rows[0];
                con.query('SELECT poster_files.filename AS poster_name , poster_files.down_count AS poster_count From file_list ' +
                'INNER JOIN ad_item ON file_list.list_id = ad_item.list_id ' +
                'INNER JOIN poster_files ON file_list.poster_id = poster_files.file_id ' +
                'WHERE file_list.list_id=4',
                function (err, rows) {
                    con.release();

                    if (err) {
                        console.error(err);
                        throw err;
                    }

                    if (rows.length == 0) {
                        console.log("Invalid poster_id");
                        res.json({msg: "Strange work..."}).end();
                    }
                    else {
                        for (var attr in rows[0]) { output[attr] = rows[0][attr]; }
                        console.log("Success Join");
                        res.json(output).end();
                    }
                });
            }
        });
    });
});

router.get('/delete', function(req, res, next) {
    var pool = req.app.locals.pool;
    var mysql_escape = req.app.locals.mysql_escape;

    pool.getConnection(function(err, connection) {
        var query = connection.query('DELETE FROM ' + req.query.table + ' where ' + req.query.columm + '='
                + mysql_escape(req.query.value), function(err, rows){
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
