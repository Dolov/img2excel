const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')

const DEV = process.env.NODE_ENV === "dev"

if (DEV) {
  const dotenv = require('dotenv')
  dotenv.config({
    path: path.resolve(__dirname, "../.env")
  })
}

const env = {
  region: process.env.AWS_REGION,
  bucketName: process.env.AWS_S3_BUCKETNAME,
  accessKeyId: process.env.AWS_ACCESSKEYID,
  functionName: process.env.AWS_FUNCTIONNAME,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
}

AWS.config.update({
  region: env.region,
  accessKeyId: env.accessKeyId,
  secretAccessKey: env.secretAccessKey
});

const s3 = new AWS.S3();

const lambda = new AWS.Lambda();

const invokeLambda = payload => {
  return new Promise(resolve => {
    lambda.invoke({
      FunctionName: env.functionName, // 替换成你的 Lambda 函数名
      Payload: JSON.stringify(payload) // 传递的参数
    }, (err, data) => {
      resolve(data)
    });
  })
}

const uploadToS3 = async (filePath, fileName) => {
  const fileContent = fs.readFileSync(filePath);
  const params = {
    Key: fileName,
    Body: fileContent,
    Bucket: env.bucketName,
  };
  const result = await s3.upload(params).promise();
  return result;
}

const getSignedUrlPromise = async key => {
  const params = {
    Key: key,
    Bucket: env.bucketName,
    Expires: 3600 // 链接过期时间，单位为秒
  };

  return s3.getSignedUrlPromise('getObject', params);
}

module.exports = {
  s3,
  uploadToS3,
  invokeLambda,
  getSignedUrlPromise,
}