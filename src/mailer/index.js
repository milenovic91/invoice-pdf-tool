import { createTransport } from 'nodemailer'
import list from './list'
import moment from 'moment'
import template from './template'

(async function main() {
  try {
    let transporter = await createTransport({
      host: 'mail.mrdonesi.com',
      port: 587,
      secure: false,
      auth: {
        user: 'kontakt@misterd.rs',
        pass: 'test123testQwjzrs'
      }
    })
    
    const today = moment().format('DD.MM')

    const rows = list
      .split('\n')
      .map(row => !!row && row.trim().split(' '))
      .filter(row => !!row && row[0] === today)

    console.log(`${rows.length} mails to send...`)
    let cnt = 0;

    for (let row of rows) {
      console.log(`sending ${row[2]}`)
      await transporter.sendMail({
        from: '"Mister D" <kontakt@misterd.rs>', // sender address
        to: row[2], // list of receivers
        bcc: cnt++ % 100 === 0 ? 'milenibgd@gmail.com' : '',
        subject: "Promo kod 300 RSD", // Subject line
        html: template({code: row[1]}), // html body
      })
    }

    console.log('done...');
  } catch (e) {
    console.log(e);
  }
})()
