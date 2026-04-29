require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

function parseAccounts() {
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
          .filter((x) => x.username && (x.password || x.bizrt))
      }
    } catch (_) {}
  }
  const u = String(process.env.WSGW_USERNAME || '').trim()
  const p = String(process.env.WSGW_PASSWORD || '').trim()
  const envBiz = String(process.env.WSGW_BIZRT || '').trim()
  if (u && (p || envBiz))
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
      '[state-grid] 需配置 WSGW_USERNAME+WSGW_PASSWORD，或 WSGW_BIZRT/WSGW_ACCOUNTS 含 bizrt'
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
