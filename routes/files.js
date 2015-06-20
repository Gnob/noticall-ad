var express = require('express');
var multer  = require('multer');
var router = express.Router();

var done = false;

// added middleware
router.use(multer(
    {
        dest: './uploads/',
        rename: function (fieldname, filename) {
            return filename+Date.now();
        },
        onFileUploadStart: function (file) {
            if (file.extension != 'mp3' && file.extension != 'jpg') {
                // TODO: 파일 확장자 Filtering Event 구현
                return false;
            }
            console.log(file.originalname + ' is starting ...');
        },
        onFileUploadComplete: function (file) {
            console.log(file.fieldname + ' uploaded to  ' + file.path);
            done=true;
        }
    }
));

router.get('/', function(req, res, next) {
    // res.send('Sending file : ' + req.params.path);
    res.send('Sending file..');
});

router.post('/upload',function(req, res) {
    if(done==true){
        console.log(req.files);
        res.end("File uploaded.");
    }
});


module.exports = router;
