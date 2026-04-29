/*
cron "11 8 * * *" ql_gold_task.js, tag=金银价格
* 金银价格: task/ql_gold_task.js
*/

require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const qlCheckUpdate = require('../utils/qlCheckUpdate')

axios.defaults.timeout = 40 * 1000

const SCRIPT_VERSION = 1.1

const $ = new Env('金银价格')
let notify

function getGold() {
  return new Promise(async (resolve) => {
    try {
      let _content = '👑今日金价\n\n'
      let domestic_content = '🏅国内价格\n'
      let international_content = '🏅国际价格\n'
      let store_content = '🏅金店价格\n'
      let conver_content = '⚖金价换算\n'
      const bdurl = 'http://www.huangjinjiage.cn'
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.62',
      }
      const r = await axios.get(bdurl, { headers, responseType: 'arraybuffer' })
      const $h = cheerio.load(iconv.decode(Buffer.from(r.data), 'gb18030'))

      const domestic_silver = $h('tr#jiage5')
        .find('td')
        .eq(1)
        .text()
        .trim()
      const domestic_gold = $h('tr.bg#jiage4')
        .find('td')
        .eq(1)
        .text()
        .trim()
      domestic_content += '· 白银：' + domestic_silver + '元/克\n'
      domestic_content += '· 黄金：' + domestic_gold + '元/克\n\n'

      const international_silver = $h('tr.bg#jiage3')
        .find('td')
        .eq(1)
        .text()
        .trim()
      const international_gold = $h('tr.bg#jiage1')
        .find('td')
        .eq(1)
        .text()
        .trim()
      international_content += '· 白银：' + international_silver + '美元/盎司\n'
      international_content += '· 黄金：' + international_gold + '美元/盎司\n\n'

      function tabRow(i) {
        const el = $h('.tabtitle').eq(i)
        const brand = el.text().replace(/内地/g, '').trim()
        const gold = el.closest('tr').find('td').eq(1).text().trim()
        return { brand, gold }
      }
      const a11 = tabRow(11)
      const a21 = tabRow(21)
      const a12 = tabRow(12)
      const a19 = tabRow(19)
      const a13 = tabRow(13)
      const a18 = tabRow(18)
      const a20 = tabRow(20)
      store_content += '· ' + a11.brand + '：' + a11.gold + '元/克\n'
      store_content += '· ' + a21.brand + '：' + a21.gold + '元/克\n'
      store_content += '· ' + a12.brand + '：' + a12.gold + '元/克\n'
      store_content += '· ' + a19.brand + '：' + a19.gold + '元/克\n'
      store_content += '· ' + a13.brand + '：' + a13.gold + '元/克\n'
      store_content += '· ' + a18.brand + '：' + a18.gold + '元/克\n'
      store_content += '· ' + a20.brand + '：' + a20.gold + '元/克\n\n'

      const usdcny_price = 7.1329
      const conver_gold =
        (parseFloat(international_gold) / 31.1035) * parseFloat(usdcny_price)
      const difference_gold = parseFloat(domestic_gold) - conver_gold
      conver_content += '· 国际换算：' + Math.round(conver_gold * 100) / 100 + '元/克\n'
      conver_content += '· 1克差价：' + Math.round(difference_gold * 100) / 100 + '元\n'
      conver_content += '· 50克价格：' + Math.round(parseFloat(domestic_gold) * 50 * 100) / 100 + '元\n'
      conver_content += '· 金衡盎司：' + '1盎司 = 31.1035克\n'

      _content += domestic_content + international_content + store_content + conver_content
      resolve(_content)
    } catch (e) {
      resolve(e)
    }
  })
}

async function sendMqttMsg(goldContent) {
  const mqtt_host = process.env.mqtt_host || ''
  const mqtt_port = process.env.mqtt_port || ''
  const mqtt_username = process.env.mqtt_username || ''
  const mqtt_password = process.env.mqtt_password || ''
  if (!mqtt_host || !mqtt_port) {
    return
  }
  const mqtt = require('mqtt')
  const clientId = 'mqtt_gold'
  const connectUrl = `mqtt://${mqtt_host}:${mqtt_port}`
  const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 2000,
    username: mqtt_username,
    password: mqtt_password,
    reconnectPeriod: 1000,
  })
  const topic = 'qinglong/gold'
  const now = new Date()
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  const data = { content: goldContent, timestamp }
  return new Promise((resolve, reject) => {
    client.on('connect', async () => {
      console.log('mqtt:Connected')
      try {
        await new Promise((pubResolve, pubReject) => {
          client.publish(topic, JSON.stringify(data), { qos: 0, retain: true }, (error) => {
            if (error) pubReject(error)
            else pubResolve()
          })
        })
        console.log('mqtt:Published')
        setTimeout(() => {
          client.end()
          resolve()
        }, 500)
      } catch (error) {
        console.error('mqtt:Publish error', error)
        client.end()
        reject(error)
      }
    })
    client.on('error', (error) => {
      console.error('mqtt:Connection error', error)
      client.end()
      reject(error)
    })
    setTimeout(() => {
      if (client.connected === false) {
        client.end()
        reject(new Error('mqtt:Connection timeout'))
      }
    }, 2000)
  })
}

!(async () => {
  qlCheckUpdate(SCRIPT_VERSION, 'ql_gold_task.js')
  await requireConfig()
  const newcontent = await getGold()
  if (typeof newcontent === 'string' && newcontent.trim()) {
    console.log('获取黄金价格成功！\n' + newcontent)
    await notify.sendNotify('金银价格', newcontent)
    try {
      await sendMqttMsg(newcontent)
    } catch (e) {
      console.error('mqtt:', e && e.message ? e.message : e)
    }
  } else {
    console.log(
      '获取黄金价格失败！',
      typeof newcontent === 'string' ? '' : (newcontent && newcontent.message) || newcontent
    )
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done()
  })

function requireConfig() {
  return new Promise((resolve) => {
    notify = $.isNode() ? require('../utils/sendNotify') : ''
    resolve()
  })
}

// prettier-ignore
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
