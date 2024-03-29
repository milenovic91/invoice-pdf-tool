import moment from 'moment'
const AWS = require('@aws-sdk/client-s3')
import fs from 'fs'
import { requireNonNullVariable } from './utils'

let s3Client = null

export function init() {
  s3Client = new AWS.S3({
    region: 'us-east-1',
    endpoint: 'https://fra1.digitaloceanspaces.com',
    credentials: {
      accessKeyId: process.env.IPT_CLOUD_KEY_ID,
      secretAccessKey: process.env.IPT_CLOUD_SECRET
    }
  })
}

export async function uploadPDF(invoice, /*pdfString*/) {
  requireNonNullVariable(process.env.IPT_CLOUD_KEY_ID, 'IPT_CLOUD_KEY_ID')
  requireNonNullVariable(process.env.IPT_CLOUD_SECRET, 'IPT_CLOUD_SECRET')
  requireNonNullVariable(process.env.IPT_CLOUD_SUBFOLDER, 'IPT_CLOUD_SUBFOLDER')
  try {
    const key = `store-invoices/${process.env.IPT_CLOUD_SUBFOLDER}/${invoice.serial}.${invoice.id}.pdf`
    await s3Client.send(new AWS.PutObjectCommand({
      Bucket: 'mrd-cdn',
      ContentType: 'application/pdf',
      Key: key,
      ACL: "public-read",
      Body: fs.readFileSync('./pdftemp.pdf')
    }))
    // TODO - inspect data
    return 'https://mrd-cdn.fra1.digitaloceanspaces.com' + '/' + key
  } catch (e) {
    throw e
  }
}
