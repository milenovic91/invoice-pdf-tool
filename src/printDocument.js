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
  },
  summary2Cell: {
    borderRight: '1px solid #b71a39',
    width: '25%',
    padding: 5,
    textAlign: 'center'
  }
});

const Cell = ({ children, width }) => {
  const additionalStyles = width != undefined ? { width } : {}
  return (
    <Text style={{...styles.rowCell, ...additionalStyles}}>{children}</Text>
  )
}

//const round = val => Math.ceil(val * 100) / 100
const round = val => Number(Number(val).toFixed(2))

const formatValue = val => val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})

const formatPaymentMethod = val => {
  switch (val) {
    case 'CARD':
    case 'HYBRID':
      return 'Card'
    case 'CASH':
      return 'Cash'
    default:
      return ''
  }
}

export default async function print(invoice, orders, summaryInput) {
  let discount = 0 - invoice.discount - invoice.discountCorrection
  let discountPercent = !!invoice.appFee ? Math.abs(round(discount * 100 / invoice.appFee)) : 0
  let vatAmount = round(invoice.total * invoice.vat / 100.)

  let onlineOrders = orders.filter(order => order.paymentMethod === 'CARD' || order.paymentMethod === 'HYBRID')

  let onlineTotal = onlineOrders.reduce((acc, curr)=> {
    acc += curr.itemsPrice
    if (curr.isFromMarketPlace) {
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

  // applicable for fleet invoices
  const perOrderFee = invoice.type === 'F' && orders.length !== 0 ? invoice.appFee / orders.length : 0
  let fleetCashTotal = 0;
  let fleetOnlineTotal = 0;
  let fleetTotal = 0;
  if (invoice.type === 'F') {
    fleetTotal = orders?.reduce((acc, curr) => {
      return acc + curr.deliveryPrice
    }, 0)
    fleetOnlineTotal = onlineOrders?.reduce((acc, curr) => {
      return acc + curr.deliveryPrice
    }, 0)
    fleetCashTotal = fleetTotal - fleetOnlineTotal;
  }

  const serviceDate = invoice.serviceDate || invoice.to;
  const issuedAt = invoice.issuedAt;
  const deliveryDate = invoice.deliveryDate || moment(invoice.issuedAt).add(15, 'day').valueOf();

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image style={{width: 103, height: 103}} src={fs.readFileSync(path.resolve(__dirname, '../newLogo.png'))} />
          {/* <Logo /> */}
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>DNP GO TECHNOLOGIES d.o.o. Beograd - Vračar</Text>
            <Text>Masarikova 5, sprat: 19</Text>
            <Text>11000 Beograd - Vračar</Text>
            <Text><Text style={styles.headerLabel}>Telefon </Text>+ 381 63 861 31 33</Text>
            <Text><Text style={styles.headerLabel}>PIB </Text>111246989</Text>
            <Text><Text style={styles.headerLabel}>Matični broj </Text>21448613</Text>
            <Text><Text style={styles.headerLabel}>Račun broj </Text>160-6000001424001-23 Banca Intesa</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.title}>
            <Text>Račun broj {invoice.serial}</Text>
          </View>
          <View style={styles.info}>
            <View style={{maxWidth: '65%'}}>
              <Text>{invoice.billingName}</Text>
              <Text>{invoice.billingAddress}</Text>
              <Text>{invoice.billingPlace}</Text>
              <Text>PIB: {invoice.billingPib}</Text>
              <Text>Matični broj: {invoice.billingMb}</Text>
            </View>
            <View style={{flexDirection: 'column'}}>
              {serviceDate &&
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum prometa usluge:</Text>
                <Text>{moment(serviceDate).format('DD.MM.YYYY.')}</Text>
              </View>}
              {invoice.from && invoice.to &&
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Obračunski period:</Text>
                <Text>{moment(invoice.from).format('DD.MM.')}-{moment(invoice.to).format('DD.MM.YYYY.')}</Text>
              </View>}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mesto izdavanja računa:</Text>
                <Text>Beograd</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum izdavanja računa:</Text>
                <Text>{moment(issuedAt).format('DD.MM.YYYY.')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Datum dospeća računa:</Text>
                <Text>{moment(deliveryDate).format('DD.MM.YYYY.')}</Text>
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
              {!!invoice.appFee &&
              <View style={styles.commonRow}>
                <Text>Platform fee</Text>
                <Text>{formatValue(invoice.appFee)} RSD</Text>
              </View>}
              {!!discount &&
              <View style={styles.commonRow}>
                <Text>Popust {discountPercent ? discountPercent + '%' : ''}</Text>
                <Text>{formatValue(discount)} RSD</Text>
              </View>}
              {invoice?.items?.map(item => (
                <View style={styles.commonRow}>
                  <Text>{item.name}    {item.count} <Text style={{fontSize: 6}}>(količina)</Text> x {formatValue(item.price)} <Text style={{fontSize: 6}}>(jedinična cena)</Text></Text>
                  <Text>{formatValue(item.count * item.price)} RSD</Text>
                </View>
              ))}
            </View>
            <View style={{...styles.summaryRow, flexDirection: 'row', justifyContent: 'flex-end'}}>
              <View style={{width: '25%'}}>
                <View style={styles.commonRow}>
                  <Text>Osnovica:</Text>
                  <Text>{formatValue(invoice.total)} RSD</Text>
                </View>
                <View style={styles.commonRow}>
                  <Text>Stopa PDVa:</Text>
                  <Text>{invoice.vat}%</Text>
                </View>
                <View style={styles.commonRow}>
                  <Text>Iznos PDVa:</Text>
                  <Text>{formatValue(vatAmount)} RSD</Text>
                </View>
              </View>
            </View>
            <View style={{...styles.summaryRow, flexDirection: 'row', justifyContent: 'flex-end', borderBottom: '1px solid #b71a39'}}>
              <View style={{...styles.commonRow, width: '25%', fontWeight: '600'}}>
                <Text>Ukupno za uplatu:</Text>
                <Text>{formatValue(invoice.total + vatAmount)} RSD</Text>
              </View>
            </View>
          </View>
          <View>
            {!!invoice.vatChangeBase &&
            <>
              <Text>{invoice.vatChangeBase}</Text>
              <Text> </Text>
            </>}
            <Text>Prilikom uplate, pozovite se na broj računa: {invoice.serial}</Text>
            <Text> </Text>
            <Text>Rok za plaćanje je petnaest (15) dana od dana izdavanja računa, pa Vas molimo da račun platite </Text>
            <Text>najkasnije do datuma dospeća: {moment(deliveryDate).format('DD.MM.YYYY.')}</Text>
            <Text> </Text>
            <Text style={{fontWeight: 'bold'}}>Hvala Vam na saradnji i što svoje obaveze izmirujete na vreme!</Text>
            <Text style={{fontWeight: 'bold'}}>Faktura je izdata u skladu sa ugovorom po specifikaciji u prilogu.</Text>
            <Text style={{fontWeight: 'bold'}}>Faktura je sastavljena izvorno u elektronskoj formi.</Text>
            <Text style={{fontWeight: 'bold'}}>Faktura je validna bez pečata i potpisa.</Text>
            <Text> </Text>
            <Text>Fakturisao:</Text>
            <Text> </Text>
            <Text>Ivan Levi</Text>
            <Text> </Text>
            <Text>Direktor i lice ovlašćeno za izdavanje računovodstvene isprave</Text>
            <Text>DNP GO TECHNOLOGIES d.o.o. Beograd - Vračar</Text>
            <Text> </Text>
            <Text> </Text>
          </View>
        </View>
      </Page>
      {summaryInput[invoice.serial] &&
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <Text style={{marginBottom: 20}}>
            Sumirani podaci za obračunski period: {moment(invoice.from).format('DD.MM.YYYY.')}-{moment(invoice.to).format('DD.MM.YYYY.')} za PIB: {summaryInput[invoice.serial].pib}
          </Text>
          <View style={styles.summary}>
            <View style={{...styles.summaryRow, ...styles.commonRow, padding: 0 }}>
              <Text style={styles.summary2Cell}>Ukupan iznos računa za PIB</Text>
              <Text style={styles.summary2Cell}>Ukupan iznos Online-a za PIB</Text>
              <Text style={styles.summary2Cell}>Obaveza MR.D-a prema partneru</Text>
              <Text style={{...styles.summary2Cell, borderRight: 0}}>Obaveza partnera prema MR.D-u</Text>
            </View>
            <View style={{...styles.summaryRow, ...styles.commonRow, padding: 0, borderBottom: '1px solid #b71a39'}}>
              <Text style={styles.summary2Cell}>{formatValue(summaryInput[invoice.serial].pibTotal)}</Text>
              <Text style={styles.summary2Cell}>{formatValue(summaryInput[invoice.serial].pibOnlineTotal)}</Text>
              <Text style={styles.summary2Cell}>{formatValue(summaryInput[invoice.serial].mrdPart)}</Text>
              <Text style={{...styles.summary2Cell, borderRight: 0}}>{formatValue(summaryInput[invoice.serial].customerPart)}</Text>
            </View>
          </View>
        </View>
      </Page>}
      {!!(orders?.length) && invoice.type !== 'F' &&
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
                <Cell>{formatPaymentMethod(order.paymentMethod)}</Cell>
                <Cell>{order.fee}%</Cell>
                <Cell>{order.total?.toFixed(2)}</Cell>
                <Cell>MR.D</Cell>
              </View>
            ))}
          </View>
        </View>
      </Page>}
      {!!(onlineOrders?.length) && invoice.type !== 'F' &&
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
                <Cell>{formatPaymentMethod(order.paymentMethod)}</Cell>
                <Cell>{order.fee}%</Cell>
                <Cell>{order.total?.toFixed(2)}</Cell>
                <Cell>{order.isWhiteLabel ? 'WEB' : 'MR.D'}</Cell>
              </View>
            ))}
          </View>}
        </View>
      </Page>}
      {invoice.type === 'F' &&
      <Page size="A4" style={styles.page}>
        <View style={styles.body}>
          <View style={{padding: 5, backgroundColor: '#eef0f2', flexDirection: 'row', marginTop: 10}}>
            <Text style={{marginRight: 40}}>MR.D spisak narudžbina</Text>
            <Text style={{fontWeight: 'bold'}}>{invoice.fleetName}</Text>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, lineHeight: 1.5, marginBottom: 10, marginTop: 5}}>
            <View style={{width: '20%'}}>
              <Text>Vreme od: {moment(invoice.from).format('DD.MM.YYYY. HH:mm:ss')}</Text>
              <Text>Vreme do: {moment(invoice.to).format('DD.MM.YYYY. HH:mm:ss')}</Text>
            </View>
            <View style={{width: '20%'}}>
              <Text>Keš ukupno: {fleetCashTotal?.toFixed(2)}</Text>
              <Text>Online ukupno: {fleetOnlineTotal?.toFixed(2)}</Text>
            </View>
            <View style={{width: '20%'}}></View>
            <View style={{width: '20%'}}></View>
            <View style={{width: '20%'}}>
              <Text style={{fontWeight: 'bold'}}>Ukupno: {fleetTotal?.toFixed(2)}</Text>
            </View>
          </View>
          {!!orders.length &&
          <View style={styles.table}>
            <View style={{...styles.tableRow, fontWeight: 'bold', marginBottom: 10}}>
              <Cell>Serial</Cell>
              <Cell width="20%">Datum i vreme</Cell>
              <Cell>Dostava</Cell>
              <Cell>Način{"\n"}plaćanja</Cell>
              <Cell>Driver ID</Cell>
              <Cell>Driver Name</Cell>
              <Cell>Provizija</Cell>
              <Cell>Izvor</Cell>
            </View>
            {orders?.map(order => (
              <View style={styles.tableRow}>
                <Cell>{order.id}</Cell>
                <Cell width="20%">{moment(order.createdAt).format('MMM D, YYYY, HH:mm:ss A')}</Cell>
                <Cell>{order.deliveryPrice?.toFixed(2)}</Cell>
                <Cell>{formatPaymentMethod(order.paymentMethod)}</Cell>
                <Cell>{order.driverId}</Cell>
                <Cell>{order.driverDisplayName}</Cell>
                <Cell>{perOrderFee} RSD</Cell>
                <Cell>{order.isWhiteLabel ? 'WEB' : 'MR.D'}</Cell>
              </View>
            ))}
          </View>}
        </View>
      </Page>}
    </Document>
  )
  // return await renderToString(doc)
  return await renderToFile(doc, './pdftemp.pdf')
}
