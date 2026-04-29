require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const path = require('path')

function parseAccounts() {
  const qr = String(process.env.WSGW_LOGIN_MODE || '').toLowerCase() === 'qr'
  const raw = process.env.WSGW_ACCOUNTS
  if (raw && String(raw).trim()) {
    try {
      const j = JSON.parse(raw)
      if (Array.isArray(j) && j.length) {
        return j
          .map((x) => ({
            username: String(x.username || x.user || x.account || '').trim(),
            password: String(x.password || x.pass || '').trim(),
            cookie: String(x.cookie || x.ck || '').trim(),
            bizrt: x.bizrt,
          }))
          .filter((x) => x.username && (x.password || x.bizrt || qr))
      }
    } catch (_) {}
  }
  const u = String(process.env.WSGW_USERNAME || '').trim()
  const p = String(process.env.WSGW_PASSWORD || '').trim()
  const envBiz = String(process.env.WSGW_BIZRT || '').trim()
  if (u && (p || envBiz || qr))
    return [
      {
        username: u,
        password: p,
        cookie: String(process.env.WSGW_COOKIE || '').trim(),
        bizrt: null,
      },
    ]
  return []
}

async function runAll() {
  const accounts = parseAccounts()
  if (!accounts.length) {
    console.error(
      '[state-grid] 需配置账号密码、或 WSGW_LOGIN_MODE=qr、或 WSGW_ACCOUNTS 含 bizrt'
    )
    process.exit(1)
  }
  const resolved = require.resolve('./stateGridCore')
  for (let i = 0; i < accounts.length; i++) {
    const { username, password, cookie, bizrt } = accounts[i]
    process.env.WSGW_USERNAME = username
    process.env.WSGW_PASSWORD = password
    if (cookie) process.env.WSGW_COOKIE = cookie
    else delete process.env.WSGW_COOKIE
    if (bizrt != null && bizrt !== '') {
      process.env.WSGW_BIZRT =
        typeof bizrt === 'string' ? bizrt : JSON.stringify(bizrt)
    } else if (accounts.length > 1) delete process.env.WSGW_BIZRT
    delete require.cache[resolved]
    console.log(`[state-grid] ${i + 1}/${accounts.length} ${username}`)
    await require('./stateGridCore')
  }
}

module.exports = { runAll, parseAccounts }
