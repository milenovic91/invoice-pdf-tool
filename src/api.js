// const fetch = require('node-fetch')
import fetch from 'isomorphic-fetch'
import FormData from 'form-data'
import { logError, logWarn } from './utils'
import moment from 'moment'

const API_BASE = process.env.IPT_API_BASE || 'http://localhost:9000'

let user = null

export async function login(username, password) {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  try {
    let response = await fetch(API_BASE + '/api/login', {
      method: 'POST',
      body: formData
    })
    if (!response.ok) {
      throw new Error('Failed to login')
    }
    return user = await response.json()
  } catch (e) {
    logError('Failed to login to MrD API')
    throw e
  }
}

export async function getInvoices(from, to, serial) {
  try {
    if (!(user?.accessToken)) {
      throw new Error('please login')
    }
    const searchParams = new URLSearchParams()
    searchParams.append('size', 999999)
    if (serial) {
      logWarn(`Fetching by serial = ${serial}`);
      searchParams.append('search', serial)
      searchParams.append('statuses', 'PDF_CREATED')
    } else {
      logWarn(`Invoice create date range [${moment(from).format('DD.MM.YYYY.')} - ${moment(to).format('DD.MM.YYYY.')}]`)
      searchParams.append('from', from)
      searchParams.append('to', to)
    }
    searchParams.append('statuses', 'READY')
    searchParams.append('statuses', 'PDF_CREATION_FAILED')
    const response = await fetch(API_BASE + '/api/admin/invoice' + '?' + searchParams.toString(), {
      headers: {
        Authorization: `Bearer ${user.accessToken}`
      }
    })
    if (!response.ok) {
      throw new Error('API error')
    }
    return await response.json()
  } catch (e) {
    throw e
  }
}

export async function getOrders(invoiceId) {
  try {
    if (!(user?.accessToken)) {
      throw new Error('please login')
    }
    const response = await fetch(API_BASE + `/api/admin/invoice/${invoiceId}/orders`, {
      headers: {
        Authorization: `Bearer ${user.accessToken}`
      }
    })
    if (!response.ok) {
      throw new Error('API error')
    }
    return await response.json()
  } catch (e) {
    throw e
  }
}

export async function updateInvoice(id, payload) {
  try {
    if (!(user?.accessToken)) {
      throw new Error('please login')
    }
    const response = await fetch(API_BASE + `/api/admin/invoice/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error('API error')
    }
    return await response.json()
  } catch (e) {
    throw e
  }
}