import React from 'react'
import { renderToString, renderToFile, Svg, G, Path, Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer'
import moment from 'moment'
import path from 'path'
import fs from 'fs'

Font.register({
  family: 'Nunito',
  format: 'truetype',
  fonts: [
    {src: path.resolve(__dirname, '../fonts/Nunito-Regular.ttf'), fontWeight: 'normal'},
    {src: path.resolve(__dirname, '../fonts/Nunito-ExtraBold.ttf'), fontWeight: 600},
    {src: path.resolve(__dirname, '../fonts/Nunito-Italic.ttf'), fontStyle: 'italic'}
  ]
})

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 20,
    fontFamily: 'Nunito'
  },
  header: {
    flexDirection: 'row',
    marginTop: 30
  },
  headerContent: {
    fontSize: 10,
    lineHeight: 1.5,
    paddingLeft: 10
  },
  headerLabel: {
    color: '#b71a39',
    fontWeight: 600
  },
  body: {
    marginTop: 30,
    fontSize: 8,
    flexDirection: 'column'
  },
  title: {
    fontSize: 12,
    paddingBottom: 5,
    borderBottom: '2px solid #b71a39',
    fontWeight: 'bold'
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    lineHeight: 1.5,
    margin: '10 0',
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row'
  },
  infoLabel: {
    fontStyle: 'italic',
    fontWeight: 'normal',
    width: 100
  },
  summary: {
    marginBottom:  20,
    lineHeight: 1.4
  },
  summaryRow: {
    borderTop: '1px solid #b71a39',
    borderLeft: '1px solid #b71a39',
    borderRight: '1px solid #b71a39',
    padding: 5
  },
  commonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  table: {
    flexDirection: 'column',
    marginTop: 15
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4
  },
  rowCell: {
    width: '10%',
    textAlign: 'center'
  }
});

const Cell = ({ children, width }) => {
  const additionalStyles = width != undefined ? { width } : {}
  return (
    <Text style={{...styles.rowCell, ...additionalStyles}}>{children}</Text>
  )
}

const round = val => Math.ceil(val * 100) / 100

const formatValue = val => val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})

export default async function print(invoice, orders) {
  let discount = 0 - invoice.discount - invoice.discountCorrection
  let discountPercent = Math.abs(round(discount * 100 / invoice.appFee))

  let onlineOrders = orders.filter(order => order.paymentMethod === 'CARD')

  let onlineTotal = onlineOrders.reduce((acc, curr)=> {
    acc += curr.itemsPrice
    if (curr.contractType === 'MP') {
      acc += curr.deliveryPrice
    }
    return acc
  }, 0)
  let ddDeliveries = orders.filter(order => !order.isFromMarketPlace)?.length ?? 0
  let deliveriesTotal = orders.reduce((acc, curr) => {
    return acc + curr.deliveryPrice
  }, 0)

  let ordersTotal = orders.reduce((acc, curr) => {
    acc += curr.itemsPrice
    if (curr.contractType === 'MP') {
      acc += curr.deliveryPrice
    }
    return acc
  }, 0)

  let feeBaseTotal = orders.reduce((acc, curr) => acc + curr.feeBase, 0)

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={{width: 100, height: 103}} src={fs.readFileSync(path.resolve(__dirname, '../logo.png'))} />
          {/* <Logo /> */}
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>Pin Technology d.o.o. Beograd - Savski venac</Text>
            <Text>Dr Milutina Ivkovića 2a/4</Text>
            <Text>11000 Beograd - Savski Venac</Text>
            <Text><Text style={styles.headerLabel}>Telefon </Text>+ 381 63 861 31 33</Text>
            <Text><Text style={styles.headerLabel}>PIB </Text>112774710</Text>
            <Text><Text style={styles.headerLabel}>Matični broj </Text>21736619</Text>
            <Text><Text style={styles.headerLabel}>Račun broj </Text>160-6000001298135-97 Banca Intesa</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.title}>
            <Text>Račun broj {invoice.serial}</Text>
          </View>
          <View style={styles.info}>
            <View>
              <Text>{invoice.billingName}</Text>
              <Text>{invoice.billingAddress}</Text>
              <Text>{invoice.billingPlace}</Text>
              <Text>PIB: {invoice.billingPib}</Text>
              <Text>Matični broj: {invoice.billingMb}</Text>
            </View>
            <View style={{flexDirection: 'column'}}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum prometa usluge:</Text>
                <Text>{moment(invoice.to).format('DD.MM.YYYY.')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Obračunski period:</Text>
                <Text>{moment(invoice.from).format('DD.MM.')}-{moment(invoice.to).format('DD.MM.YYYY.')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mesto izdavanja računa:</Text>
                <Text>Beograd</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum izdavanja računa:</Text>
                <Text>{moment(invoice.issuedAt).format('DD.MM.YYYY.')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum dospeća računa:</Text>
                <Text>{moment(invoice.issuedAt).add(15, 'day').format('DD.MM.YYYY.')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <View style={{...styles.commonRow, fontWeight: 'bold'}}>
                <Text>Opis usluge</Text>
                <Text>Cena</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.commonRow}>
                <Text>Platform fee</Text>
                <Text>{formatValue(invoice.appFee)} RSD</Text>
              </View>
              {!!discount &&
              <View style={styles.commonRow}>
                <Text>Popust {discountPercent}%</Text>
                <Text>{formatValue(discount)} RSD</Text>
              </View>}
            </View>
            <View style={{...styles.summaryRow, flexDirection: 'row', justifyContent: 'flex-end'}}>
              <View style={{width: '25%'}}>
                <View style={styles.commonRow}>
                  <Text>Osnovica:</Text>
                  <Text>{formatValue(invoice.total)} RSD</Text>
                </View>
                <View style={styles.commonRow}>
                  <Text>Stopa PDVa:</Text>
                  <Text>20%</Text>
                </View>
                <View style={styles.commonRow}>
                  <Text>Iznos PDVa:</Text>
                  <Text>{formatValue(round(invoice.total * 0.2))} RSD</Text>
                </View>
              </View>
            </View>
            <View style={{...styles.summaryRow, flexDirection: 'row', justifyContent: 'flex-end', borderBottom: '1px solid #b71a39'}}>
              <View style={{...styles.commonRow, width: '25%', fontWeight: '600'}}>
                <Text>Ukupno za uplatu:</Text>
                <Text>{formatValue(round(invoice.total * 1.2))} RSD</Text>
              </View>
            </View>
          </View>
          <View>
            <Text>Prilikom uplate, pozovite se na broj računa: {invoice.serial}</Text>
            <Text> </Text>
            <Text>Rok za plaćanje je petnaest (15) dana od dana izdavanja računa, pa Vas molimo da račun platite </Text>
            <Text>najkasnije do datuma dospeća: {moment(invoice.issuedAt).add(15, 'day').format('DD.MM.YYYY.')}</Text>
            <Text> </Text>
            <Text style={{fontWeight: 'bold'}}>Hvala Vam na saradnji i što svoje obaveze izmirujete na vreme!</Text>
            <Text style={{fontWeight: '600'}}>Faktura je sastavljena izvorno u elektronskoj formi.</Text>
            <Text style={{fontWeight: 'bold'}}>Faktura je validna bez pečata i potpisa.</Text>
            <Text> </Text>
            <Text>Fakturisao:</Text>
            <Text> </Text>
            <Text>Ivan Levi</Text>
            <Text> </Text>
            <Text>Direktor i lice ovlašćeno za izdavanje računovodstvene isprave</Text>
            <Text>Pin Technology d.o.o. Beograd - Savski venac</Text>
            <Text> </Text>
            <Text> </Text>
          </View>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={{padding: 5, backgroundColor: '#eef0f2', flexDirection: 'row'}}>
            <Text style={{marginRight: 40}}>MR.D spisak narudžbina</Text>
            <Text style={{fontWeight: 'bold'}}>{invoice.storeName}</Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, lineHeight: 1.5, marginBottom: 10, marginTop: 5}}>
            <View style={{width: '20%'}}>
              <Text>Vreme od: {moment(invoice.from).format('DD.MM.YYYY. HH:mm:ss')}</Text>
              <Text>Vreme do: {moment(invoice.to).format('DD.MM.YYYY. HH:mm:ss')}</Text>
            </View>
            <View style={{width: '20%'}}>
              <Text>PayOnline br. narudžbina: {onlineOrders.length}</Text>
              <Text>PayOnline ukupno: {onlineTotal?.toFixed(2)}</Text>
            </View>
            <View style={{width: '20%'}}>
              <Text>Dostava br. narudžbina: {ddDeliveries}</Text>
              <Text>Dostava ukupno: {deliveriesTotal?.toFixed(2)}</Text>
            </View>
            <View style={{width: '20%'}}>
              <Text>Narudžbine: {orders.length}</Text>
              <Text>Ukupno: {ordersTotal?.toFixed(2)}</Text>
            </View>
            <View style={{width: '20%', fontWeight: 'bold'}}>
              <Text>MR.D osnovica: {feeBaseTotal?.toFixed(2)}</Text>
              <Text>Rabat: {invoice.appFee?.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.table}>
            <View style={{...styles.tableRow, fontWeight: 'bold', marginBottom: 10}}>
              <Cell>ID</Cell>
              <Cell width="20%">Datum i vreme</Cell>
              <Cell>Proizvodi</Cell>
              <Cell>Dostava</Cell>
              <Cell width="15%">Osnovica za obračun provizije</Cell>
              <Cell>Način{"\n"}plaćanja</Cell>
              <Cell>Provizija</Cell>
              <Cell>Za naplatu</Cell>
              <Cell>Izvor</Cell>
            </View>
            {orders?.map(order => (
              <View key={order.id} style={styles.tableRow}>
                <Cell>{order.id}</Cell>
                <Cell width="20%">{moment(order.createdAt).format('MMM D, YYYY, HH:mm:ss A')}</Cell>
                <Cell>{order.itemsPrice?.toFixed(2)}</Cell>
                <Cell>{order.deliveryPrice?.toFixed(2)}</Cell>
                <Cell width="15%">{order.feeBase?.toFixed(2)}</Cell>
                <Cell>{order.paymentMethod}</Cell>
                <Cell>{order.fee}%</Cell>
                <Cell>{order.total?.toFixed(2)}</Cell>
                <Cell>MR.D</Cell>
              </View>
            ))}
          </View>
        </View>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={{padding: 5, backgroundColor: '#eef0f2', flexDirection: 'row', marginTop: 10}}>
            <Text style={{marginRight: 40}}>MR.D spisak online narudžbina</Text>
            <Text style={{fontWeight: 'bold'}}>{invoice.storeName}</Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, lineHeight: 1.5, marginBottom: 10, marginTop: 5}}>
            <View style={{width: '20%'}}>
              <Text>Vreme od: {moment(invoice.from).format('DD.MM.YYYY. HH:mm:ss')}</Text>
              <Text>Vreme do: {moment(invoice.to).format('DD.MM.YYYY. HH:mm:ss')}</Text>
            </View>
            <View style={{width: '20%'}}>
              <Text>PayOnline br. narudžbina: {onlineOrders.length}</Text>
              <Text>PayOnline ukupno: {onlineTotal?.toFixed(2)}</Text>
            </View>
            <View style={{width: '20%'}}></View>
            <View style={{width: '20%'}}></View>
            <View style={{width: '20%'}}></View>
          </View>
          {!!onlineOrders.length &&
          <View style={styles.table}>
            <View style={{...styles.tableRow, fontWeight: 'bold', marginBottom: 10}}>
              <Cell>ID</Cell>
              <Cell width="20%">Datum i vreme</Cell>
              <Cell>Proizvodi</Cell>
              <Cell>Dostava</Cell>
              <Cell width="15%">Osnovica za obračun provizije</Cell>
              <Cell>Način{"\n"}plaćanja</Cell>
              <Cell>Provizija</Cell>
              <Cell>Za naplatu</Cell>
              <Cell>Izvor</Cell>
            </View>
            {onlineOrders?.map(order => (
              <View style={styles.tableRow}>
                <Cell>{order.id}</Cell>
                <Cell width="20%">{moment(order.createdAt).format('MMM D, YYYY, HH:mm:ss A')}</Cell>
                <Cell>{order.itemsPrice?.toFixed(2)}</Cell>
                <Cell>{order.deliveryPrice?.toFixed(2)}</Cell>
                <Cell width="15%">{order.feeBase?.toFixed(2)}</Cell>
                <Cell>{order.paymentMethod}</Cell>
                <Cell>{order.fee}%</Cell>
                <Cell>{order.total?.toFixed(2)}</Cell>
                <Cell>MR.D</Cell>
              </View>
            ))}
          </View>}
        </View>
      </Page>
    </Document>
  )
  // return await renderToString(doc)
  return await renderToFile(doc, './pdftemp.pdf')
}

function Logo() {
  return (
    <Svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      width="100.000000pt" height="103.000000pt" viewBox="0 0 230.000000 237.000000"
      preserveAspectRatio="xMidYMid meet">
      <G transform="translate(0.000000,237.000000) scale(0.100000,-0.100000)"
      fill="#b71a39" stroke="none">
      <Path d="M0 1185 l0 -1185 1150 0 1150 0 0 1185 0 1185 -1150 0 -1150 0 0
      -1185z m863 471 c159 -37 259 -183 244 -356 -6 -71 -21 -111 -64 -168 -26 -35
      -215 -364 -226 -394 -10 -28 -24 -21 -51 27 l-25 46 21 34 20 35 -40 0 c-37 0
      -42 3 -66 46 -14 26 -26 48 -26 50 0 2 37 4 82 6 l83 3 23 43 23 42 -134 0
      -135 0 -44 48 c-55 62 -78 126 -78 220 0 152 100 283 243 318 68 16 81 16 150
      0z m564 3 c132 -18 195 -45 276 -119 115 -105 162 -289 122 -479 -35 -169
      -145 -283 -320 -332 -36 -10 -112 -14 -273 -14 l-224 0 -29 33 c-23 26 -29 41
      -29 80 0 26 4 52 9 58 7 8 52 86 85 149 6 12 25 39 42 60 41 52 84 173 84 235
      0 97 -57 229 -125 288 -19 17 -35 33 -35 36 0 17 304 21 417 5z"/>
      <Path d="M734 1476 c-36 -16 -78 -68 -88 -108 -9 -41 9 -107 39 -138 61 -64
      161 -58 219 13 24 30 29 45 29 91 0 59 -21 100 -68 130 -35 23 -93 28 -131 12z"/>
      <Path d="M1190 1185 l0 -275 83 0 c144 0 228 36 279 117 21 34 23 50 23 158 0
      105 -3 125 -22 162 -44 81 -118 113 -264 113 l-99 0 0 -275z"/>
      </G>
    </Svg>
  )
}