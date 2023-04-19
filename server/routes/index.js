const router = require('koa-router')()
const { uploadToS3, invokeLambda, s3 } = require('../utils')

router.prefix('/api')

router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.post('/upload', async (ctx, next) => {
  const { body } = ctx.request
  const { fileName } = body
  console.log('body: ', body);
  const file = ctx.request.files.file
  // const reader = fs.createReadStream(file.filepath)
  // const tempFilePath = `upload/${fileName}`
  // const upStream = fs.createWriteStream(tempFilePath)
  // reader.pipe(upStream)
  // const fileContent = fs.readFileSync(tempFilePath)
  const res = await uploadToS3(file.filepath, `${new Date().getTime()}-${fileName}`)
  ctx.body = res
})

router.post('/excel', async (ctx, next) => {
  const { body } = ctx.request
  const res = await invokeLambda(body)
  let resBody = {}
  try {
    const payload = JSON.parse(res.Payload)
    const key = payload?.data?.Key
    if (!key) throw Error
    resBody = {
      ...res,
      Payload: payload
    }
  } catch (error) {
    console.log('error: ', error);
  }
  ctx.body = resBody
})


router.get('/download', async (ctx, next) => {
  const data = await s3.getObject(ctx.query).promise();
  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${ctx.query.Key}"`,
    'Content-Length': data.ContentLength
  });
  ctx.body = data.Body;
})

module.exports = router
