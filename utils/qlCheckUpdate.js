const https = require('https')
const { exec } = require('child_process')

module.exports = function qlCheckUpdate(scriptVersion, scriptBaseName) {
  console.log('当前运行的脚本版本：' + scriptVersion)
  const req = https.request(
    {
      hostname: 'raw.githubusercontent.com',
      path: '/Hosiang1026/DailyRemind/master/task/' + scriptBaseName,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Node)' },
    },
    (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8')
          const m = text.match(/SCRIPT_VERSION\s*=\s*(\d+\.\d+)/)
          if (m && parseFloat(m[1]) > scriptVersion) {
            console.log('发现新版本：' + m[1])
            console.log('正在自动更新脚本...')
            exec(
              'ql raw https://gitee.com/hosiang1026/DailyRemind/raw/master/task/' +
                scriptBaseName +
                ' &'
            )
          }
        } catch {
          //
        }
      })
    }
  )
  req.setTimeout(20000, () => {
    req.destroy()
  })
  req.on('error', () => {})
  req.end()
}
