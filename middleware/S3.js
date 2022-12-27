const aws = require('aws-sdk')

const s3 = new aws.S3({
    accessKeyId: process.env.Access_Key_ID,
    secretAccessKey: process.env.Secret_Access_Key
})
module.exports = s3;