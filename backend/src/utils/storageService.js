const fs = require('fs')
const path = require('path')

const STORAGE = process.env.UPLOAD_STORAGE || 'local'
const LOCAL_PATH = process.env.UPLOAD_LOCAL_PATH || './uploads'

const EXT_POR_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

async function guardar(buffer, mimetype, nombre) {
  const ext = EXT_POR_MIME[mimetype] || '.jpg'
  const filename = `${nombre}${ext}`

  if (STORAGE === 's3') {
    return guardarS3(buffer, mimetype, filename)
  }
  return guardarLocal(buffer, filename)
}

function guardarLocal(buffer, filename) {
  const dir = path.resolve(LOCAL_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, filename), buffer)
  return `/uploads/${filename}`
}

async function guardarS3(buffer, mimetype, filename) {
  // Lazy-load AWS SDK para no requerir instalación si no se usa S3
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  })
  await client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: filename,
    Body: buffer,
    ContentType: mimetype,
  }))
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${filename}`
}

module.exports = { guardar }
