require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const path = require('path')

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
          }))
          .filter((x) => x.username && x.password)
      }
    } catch (_) {}
  }
  const u = String(process.env.WSGW_USERNAME || '').trim()
  const p = String(process.env.WSGW_PASSWORD || '').trim()
  if (u && p) return [{ username: u, password: p }]
  return []
}

async function runAll() {
  const accounts = parseAccounts()
  if (!accounts.length) {
    console.error(
      '[state-grid] 需配置 WSGW_USERNAME/WSGW_PASSWORD 或 WSGW_ACCOUNTS=[{"username":"","password":""},...]'
    )
    process.exit(1)
  }
  const resolved = require.resolve('./stateGridCore')
  for (let i = 0; i < accounts.length; i++) {
    const { username, password } = accounts[i]
    process.env.WSGW_USERNAME = username
    process.env.WSGW_PASSWORD = password
    delete require.cache[resolved]
    console.log(`[state-grid] ${i + 1}/${accounts.length} ${username}`)
    await require('./stateGridCore')
  }
}

module.exports = { runAll, parseAccounts }
