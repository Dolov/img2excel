

import fs from 'fs'
import path from 'path'
import AWS from 'aws-sdk'
import ImagePixelToExcel, { Options } from './imagePixelToExcel'
import * as dotenv from 'dotenv'
dotenv.config()

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY
});

const s3 = new AWS.S3();

if (process.env.NODE_ENV === 'dev') {
  const imgPath = path.resolve(__dirname, '../../friends.png')
  const excelPath = path.resolve(__dirname, `../../excel-${new Date().getTime()}.xlsx`)
  const file = fs.readFileSync(imgPath)
  const image = new ImagePixelToExcel(file)
  image.init().then(excelData => {
    image.generateExcel(excelPath, excelData)
  })
}

const upload = async (params: AWS.S3.PutObjectRequest) => {
  return new Promise(resolve => {
    s3.upload(params, (err: any, data) => {
      resolve(data)
    });
  })
}

const genExcelAndUploadS3 = async (Bucket: string, Key: string, options?: Options) => {
  const objectData = await s3.getObject({ Bucket, Key }).promise();
  const imagePixelToExcel = new ImagePixelToExcel(objectData.Body as Buffer, options)
  const excelData = await imagePixelToExcel.init()
  const params = {
    Bucket,
    Key: `excel/${Key}.xlsx`,
    Body: excelData
  };
  const response = await upload(params)
  return response
}

const handler = async function (event: any) {
  const { Records } = event || {}
  console.log('event: ', event);
  let Key
  let Bucket
  if (Array.isArray(Records) && Records[0]) {
    const { eventName } = Records[0]
    if (eventName === 'ObjectCreated:Put') {
      Key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
      Bucket = event.Records[0].s3.bucket.name;
    }
  }
  if (event.Bucket && event.Key) {
    Key = event.Key
    Bucket = event.Bucket
  }
  console.log('Key && Bucket: ', Key, Bucket);
  if (Key && Bucket) {
    const response = await genExcelAndUploadS3(Bucket, Key, event.options)
    return {
      status: 200,
      data: response,
    }
  }
  return {
    status: 500,
    success: false
  }
}

module.exports.handler = handler