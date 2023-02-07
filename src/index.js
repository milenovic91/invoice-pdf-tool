import './dotEnvConfig'
import { login, getInvoices, getOrders, updateInvoice } from './api'
import { uploadPDF, init } from './StorageClient'
import printDocument from './printDocument'
import fs from 'fs'
import readXlsxFile from 'read-excel-file/node';
import { logInfo, logError, logWarn, requireNonNullVariable } from './utils'

// const stdout = fs.createWriteStream('./stdout.txt')
// const console = new Console({ stdout, stderr: stdout })

async function main() {
  logInfo('MisterD PDF tool is starting...')
  requireNonNullVariable(process.env.IPT_SUMMARIES_FILE, 'IPT_SUMMARIES_FILE')
  var summaryInput = {}
  if (fs.existsSync(process.env.IPT_SUMMARIES_FILE)) {
    try {
      const rows = await readXlsxFile(process.env.IPT_SUMMARIES_FILE)
      var summaryInput = rows.reduce((acc, curr) => {
        let [id, storeName, pib, invoiceSerial, pibTotal, pibOnlineTotal, mrdPart, customerPart] = curr
        acc[invoiceSerial] = { id, storeName, pib, invoiceSerial, pibTotal, pibOnlineTotal, mrdPart, customerPart }
        return acc;
      }, {})
    } catch (e) {
      logError('Could not load and parse ' + process.env.IPT_SUMMARIES_FILE)
      throw e
    }
  }

  try {
    init()
    await login(process.env.IPT_USERNAME, process.env.IPT_PASSWORD)
    logInfo(`Successfully logged in at ${process.env.IPT_API_BASE} as ${process.env.IPT_USERNAME}`)
    let startCreateDate = Date.now() - 10 * 24 * 60 * 60000
    let endCreateDate = Date.now() + 5 * 24 * 60 * 60000
    let passedSerial = null
    process.argv.forEach(val => {
      if (val.startsWith('--serial=')) {
        passedSerial = val.split('=')[1]?.trim() ?? ''
      }
    })
    const { content: invoices} = await getInvoices(startCreateDate, endCreateDate, passedSerial)
    logInfo(`Fetched ${invoices?.length} invoices`)
    for (let invoice of invoices) {
      logWarn(`Started processing invoice SERIAL=${invoice.serial}...`)
      const orders = await getOrders(invoice.id)

      const doc = await printDocument(invoice, orders, summaryInput)
      
      const pdfUrl = await uploadPDF(invoice, doc)

      await updateInvoice(invoice.id, {
        status: 'PDF_CREATED',
        pdfUrl
      })

      logInfo(`Successfully processed invoice SERIAL=${invoice.serial}...`)
    }
    if (fs.existsSync('./pdftemp.pdf')) {
      fs.unlinkSync('./pdftemp.pdf')
    }
    logInfo('MisterD PDF tool is stopping...')
  } catch (e) {
    logError('Script has failed...')
    logError('MisterD PDF tool is stopping...')
    console.log(e)
  }
}

main()
