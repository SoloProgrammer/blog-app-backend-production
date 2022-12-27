const multerS3 = require('multer-s3')
const multer = require('multer');

const s3 = require('./S3')
const aws_uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'blogapp1-bucket',
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString() + "-" + file.originalname)
        }
    })
})

module.exports = aws_uploadS3;
