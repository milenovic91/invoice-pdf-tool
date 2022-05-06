import './dotEnvConfig'
import { login, getInvoices, getOrders, updateInvoice } from './api'
import { uploadPDF, init } from './StorageClient'
import printDocument from './printDocument'
import fs from 'fs'

// const stdout = fs.createWriteStream('./stdout.txt')
// const console = new Console({ stdout, stderr: stdout })

async function main() {
  try {
    init()
    await login(process.env.IPT_USERNAME, process.env.IPT_PASSWORD)
    console.info(`Successfully logged in at ${process.env.IPT_API_BASE} as ${process.env.IPT_USERNAME}`)
    const { content: invoices} = await getInvoices(Date.now() - 5 * 24 * 60 * 60000, Date.now() + 5 * 24 * 60 * 60000)
    console.info(`Fetched ${invoices?.length} invoices`)
    for (let invoice of invoices) {
      console.info(`Started processing invoice SERIAL=${invoice.serial}...`)
      const orders = await getOrders(invoice.id)

      const doc = await printDocument(invoice, orders)
      
      const pdfUrl = await uploadPDF(invoice, doc)

      await updateInvoice(invoice.id, {
        status: 'PDF_CREATED',
        pdfUrl
      })

      console.info(`Successfully processed invoice SERIAL=${invoice.serial}...`)
    }
    fs.unlinkSync('./pdftemp.pdf')
    console.log('All invoices have been proceessed')
    console.log('stopping')
  } catch (e) {
    console.log('Script failed')
    console.log(e)
    console.log('stopping...')
  }
}

main()
