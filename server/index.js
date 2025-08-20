import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Facebook Graph API proxy
app.get('/api/facebook/insights', async (req, res) => {
  try {
    const { metric = 'page_impressions', period = 'day', since, until, user_access_token, type, ads_dimension } = req.query

    // If a user access token is provided, expand to ALL owned pages of the user
    if (user_access_token) {
      const userToken = String(user_access_token)
      
      if (String(type) === 'ads') {
        // List ad accounts
        const adAccountsUrl = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id&access_token=${encodeURIComponent(
          userToken
        )}`
        const { data: accResp } = await axios.get(adAccountsUrl)
        const accounts = Array.isArray(accResp?.data) ? accResp.data : []
        if (accounts.length === 0) {
          return res.json({ items: [] })
        }

        const results = await Promise.all(
          accounts.map(async (acc) => {
            const timeParams = new URLSearchParams()
            if (since && until) {
              timeParams.set('time_range', JSON.stringify({ since: String(since), until: String(until) }))
            } else if (period) {
              const presetMap = { day: 'yesterday', week: 'last_7d', days_28: 'last_28d', month: 'last_month', lifetime: 'lifetime' }
              timeParams.set('date_preset', String(presetMap[String(period)] || 'last_30d'))
            }

            // Determine API level and fields based on requested dimension
            const dim = String(ads_dimension || 'ad_id')
            const level = dim.startsWith('adset_') ? 'adset' : dim.startsWith('campaign_') ? 'campaign' : 'ad'
            const fields = [
              // include both id and name fields available so UI can choose label
              'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name',
              'reach', 'impressions', 'clicks', 'spend', 'cpm', 'ctr', 'conversions', 'actions', 'date_start', 'date_stop',
            ]
            const insightsUrl = `https://graph.facebook.com/v19.0/act_${acc.account_id}/insights?level=${level}&limit=5000&fields=${fields.join(',')}&${timeParams.toString()}&access_token=${encodeURIComponent(
              userToken
            )}`

            try {
              // Prepare requests per level
              const insightsReq = axios.get(insightsUrl)
              let statusReq = null
              let metaReq = null
              if (level === 'ad') {
                statusReq = axios.get(
                  `https://graph.facebook.com/v19.0/act_${acc.account_id}/ads?limit=5000&fields=id,effective_status,updated_time,created_time,adset_id&access_token=${encodeURIComponent(
                    userToken
                  )}`
                )
                metaReq = axios.get(
                  `https://graph.facebook.com/v19.0/act_${acc.account_id}/adsets?limit=5000&fields=id,start_time,end_time,updated_time&access_token=${encodeURIComponent(
                    userToken
                  )}`
                )
              } else if (level === 'adset') {
                statusReq = axios.get(
                  `https://graph.facebook.com/v19.0/act_${acc.account_id}/adsets?limit=5000&fields=id,effective_status,start_time,end_time,updated_time&access_token=${encodeURIComponent(
                    userToken
                  )}`
                )
              } else if (level === 'campaign') {
                statusReq = axios.get(
                  `https://graph.facebook.com/v19.0/act_${acc.account_id}/campaigns?limit=5000&fields=id,effective_status,start_time,stop_time,updated_time&access_token=${encodeURIComponent(
                    userToken
                  )}`
                )
              }

              const responses = await Promise.all([insightsReq, statusReq, metaReq].filter(Boolean))
              const insightsData = responses[0].data
              const statusData = responses[1] ? responses[1].data : null
              const metaData = responses[2] ? responses[2].data : null

              let statusMap = new Map()
              if (statusData?.data && Array.isArray(statusData.data)) {
                statusMap = new Map(statusData.data.map((e) => [String(e.id), String(e.effective_status)]))
              }

              let adsetTimeMap = new Map()
              let campaignTimeMap = new Map()
              let adMetaMap = new Map()
              if (metaData?.data && Array.isArray(metaData.data)) {
                // meta for ad level: adsets with times
                adsetTimeMap = new Map(
                  metaData.data.map((e) => [String(e.id), { start_time: String(e.start_time || ''), end_time: String(e.end_time || ''), updated_time: String(e.updated_time || '') }])
                )
              }
              if (statusData?.data && level === 'adset') {
                adsetTimeMap = new Map(
                  statusData.data.map((e) => [String(e.id), { start_time: String(e.start_time || ''), end_time: String(e.end_time || ''), updated_time: String(e.updated_time || '') }])
                )
              }
              if (statusData?.data && level === 'campaign') {
                campaignTimeMap = new Map(
                  statusData.data.map((e) => [String(e.id), { start_time: String(e.start_time || ''), stop_time: String(e.stop_time || ''), updated_time: String(e.updated_time || '') }])
                )
              }
              if (statusData?.data && level === 'ad') {
                adMetaMap = new Map(
                  statusData.data.map((e) => [
                    String(e.id),
                    {
                      effective_status: String(e.effective_status || ''),
                      updated_time: String(e.updated_time || ''),
                      created_time: String(e.created_time || ''),
                      adset_id: String(e.adset_id || ''),
                    },
                  ])
                )
              }

              const rows = Array.isArray(insightsData?.data) ? insightsData.data : []
              for (const r of rows) {
                const idKey = level === 'campaign' ? 'campaign_id' : level === 'adset' ? 'adset_id' : 'ad_id'
                const key = String(r[idKey] || '')
                if (key && statusMap.has(key)) r.status = statusMap.get(key)
                if (level === 'ad') {
                  const t = adsetTimeMap.get(String(r.adset_id || ''))
                  const meta = adMetaMap.get(String(r.ad_id || '')) || {}
                  if (t) {
                    r.entity_start = t.start_time
                    r.entity_end = t.end_time || (meta.effective_status && meta.effective_status !== 'ACTIVE' ? meta.updated_time : '')
                  }
                } else if (level === 'adset') {
                  const t = adsetTimeMap.get(String(r.adset_id || ''))
                  if (t) {
                    r.entity_start = t.start_time
                    r.entity_end = t.end_time || (r.status && r.status !== 'ACTIVE' ? t.updated_time : '')
                  }
                } else if (level === 'campaign') {
                  const t = campaignTimeMap.get(String(r.campaign_id || ''))
                  if (t) {
                    r.entity_start = t.start_time
                    r.entity_end = t.stop_time || (r.status && r.status !== 'ACTIVE' ? t.updated_time : '')
                  }
                }
              }

              return { name: String(acc.name), data: insightsData }
            } catch (e) {
              return { name: String(acc.name), error: e?.message || 'error' }
            }
          })
        )

        return res.json({ items: results })
      }

      // Default: Pages flow
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
        userToken
      )}`
      const { data: pagesResp } = await axios.get(pagesUrl)
      const pages = Array.isArray(pagesResp?.data) ? pagesResp.data : []
      if (pages.length === 0) {
        return res.json({ items: [] })
      }
      const results = await Promise.all(
        pages.map(async (page) => {
          const params = new URLSearchParams({
            metric: String(metric),
            period: String(period),
            access_token: String(page.access_token),
          })
          if (since) params.set('since', String(since))
          if (until) params.set('until', String(until))
          const url = `https://graph.facebook.com/v19.0/${page.id}/insights?${params.toString()}`
          try {
            const { data } = await axios.get(url)
            return { name: `${String(metric)} (${String(page.name)})`, data }
          } catch (e) {
            return { name: `${String(metric)} (${String(page.name)})`, error: e?.message || 'error' }
          }
        })
      )

      return res.json({ items: results })
    }

    // Fallback: use single page from env
    const accessToken = process.env.FB_ACCESS_TOKEN
    const pageId = process.env.FB_PAGE_ID
    if (!accessToken || !pageId) {
      return res.status(400).json({ error: 'FB_ACCESS_TOKEN or FB_PAGE_ID missing' })
    }

    const params = new URLSearchParams({
      metric: String(metric),
      period: String(period),
      access_token: accessToken,
    })
    if (since) params.set('since', String(since))
    if (until) params.set('until', String(until))

    const url = `https://graph.facebook.com/v19.0/${pageId}/insights?${params.toString()}`
    const { data } = await axios.get(url)
    res.json(data)
  } catch (error) {
    const status = error.response?.status || 500
    res.status(status).json({ error: 'Facebook API error', details: error.message })
  }
})

// Google Sheets values API proxy
app.get('/api/sheets/data', async (req, res) => {
  try {
    const sheetsId = process.env.GOOGLE_SHEETS_ID
    const range = (req.query.range || process.env.GOOGLE_SHEETS_RANGE || 'Sheet1!A1:Z1000')
    const apiKey = process.env.GOOGLE_API_KEY
    if (!sheetsId || !apiKey) {
      return res.status(400).json({ error: 'GOOGLE_SHEETS_ID or GOOGLE_API_KEY missing' })
    }
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${encodeURIComponent(
      String(range)
    )}?key=${apiKey}`
    const { data } = await axios.get(url)
    res.json(data)
  } catch (error) {
    const status = error.response?.status || 500
    res.status(status).json({ error: 'Sheets API error', details: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})


