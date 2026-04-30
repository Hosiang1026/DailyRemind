const axios = require('axios');
const https = require('https');

require('dotenv').config();

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36';

function line(label, v) {
  if (v === null || v === undefined || v === '') return null;
  return `${label}: ${v}`;
}

function isAuthExpired(data) {
  const msg = data && data.message != null ? String(data.message) : '';
  const st = data && data.status;
  if (String(st) === '10001') return true;
  if (msg.includes('授权登陆已失效')) return true;
  return false;
}

function formatBillBody(data, hh) {
  const items = data && data.items;
  if (!Array.isArray(items) || !items.length) {
    const st = data && data.status != null ? String(data.status) : '';
    const msg = data && data.message != null ? String(data.message) : '';
    const parts = [`户号: ${hh}`];
    if (msg) parts.push('', `接口: ${st || '-'} ${msg}`);
    return parts.join('\n');
  }
  const cur = items[0];
  const fee = [
    line('水费', cur.je),
    line('用水量', cur.ysl),
    line('合计金额', cur.hjje),
    line('应收款余额', cur.yskye),
    line('销账标志', cur.xzbz),
    line('销账日期', cur.xzrq),
  ].filter(Boolean);
  const meter = [
    line('抄表水量', cur.scsl),
    line('抄表情况', cur.cbqk),
    line('上次抄表', cur.sccb),
    line('本次抄表', cur.bccb),
  ].filter(Boolean);
  const past = [];
  for (let i = 1; i < items.length; i++) {
    const r = items[i];
    const m = r.sfyf || r.zdyf || '';
    const t = r.hjje != null && r.hjje !== '' ? r.hjje : '-';
    if (m) past.push(`${m} 合计${t}`);
  }
  const blocks = [
    `户号: ${hh}`,
    '',
    '【近期水费】',
    ...fee,
    '',
    '【近期抄表】',
    ...meter,
  ];
  if (past.length) {
    blocks.push('', '【往期水费】', ...past);
  }
  return blocks.join('\n');
}

async function sendMqttMsg(text) {
  const mqtt_host = process.env.mqtt_host || '';
  const mqtt_port = process.env.mqtt_port || '';
  const mqtt_username = process.env.mqtt_username || '';
  const mqtt_password = process.env.mqtt_password || '';
  if (!mqtt_host || !mqtt_port) return;

  const mqtt = require('mqtt');
  const topic = process.env.HUZHOU_WATER_MQTT_TOPIC || 'qinglong/huzhou-water';
  const clientId = 'mqtt_huzhou_water';
  const connectUrl = `mqtt://${mqtt_host}:${mqtt_port}`;
  const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 2000,
    username: mqtt_username,
    password: mqtt_password,
    reconnectPeriod: 1000,
  });

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const payload = { content: `💧水费\n\n${text}`, timestamp };

  return new Promise((resolve, reject) => {
    client.on('connect', () => {
      client.publish(topic, JSON.stringify(payload), { qos: 0, retain: true }, (err) => {
        if (err) {
          client.end();
          reject(err);
          return;
        }
        setTimeout(() => {
          client.end();
          resolve();
        }, 500);
      });
    });
    client.on('error', (e) => {
      client.end();
      reject(e);
    });
    setTimeout(() => {
      if (!client.connected) {
        client.end();
        reject(new Error('mqtt:Connection timeout'));
      }
    }, 2000);
  });
}

async function fetchWaterBill() {
  const hh = (process.env.HUZHOU_WATER_HH || '').trim() || '70119012';
  const url = `https://wt.hzwgservice.cn/netbus/mobile/buss/getWaterBill?hh=${encodeURIComponent(hh)}`;
  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Origin: 'https://wt.hzwgservice.cn',
    Referer: 'https://wt.hzwgservice.cn/app/waterBill',
    'User-Agent': UA,
  };
  const token = (process.env.HUZHOU_WATER_ACCESS_TOKEN || '').trim();
  if (token) headers.accesstoken = token;
  const ck = process.env.HUZHOU_WATER_COOKIE;
  if (ck) headers.Cookie = ck;
  const extra = process.env.HUZHOU_WATER_HEADERS;
  if (extra) {
    try {
      Object.assign(headers, JSON.parse(extra));
    } catch (e) {
      throw new Error('HUZHOU_WATER_HEADERS JSON 无效');
    }
  }
  const bodyEnv = process.env.HUZHOU_WATER_POST_BODY;
  let postBody = '';
  if (bodyEnv) {
    try {
      postBody = JSON.parse(bodyEnv);
    } catch (e) {
      throw new Error('HUZHOU_WATER_POST_BODY JSON 无效');
    }
    headers['Content-Type'] = 'application/json';
  }
  const axiosCfg = {
    headers,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 20000,
    validateStatus: () => true,
  };
  const res = await axios.post(url, postBody, axiosCfg);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = typeof res.data === 'object' && res.data !== null ? res.data : {};
  return { data, hh };
}

async function run() {
  const { data, hh } = await fetchWaterBill();
  if (isAuthExpired(data)) {
    console.log('[huzhou-water] 授权已失效，跳过通知与 MQTT');
    return { skipNotify: true };
  }
  const text = formatBillBody(data, hh);
  await sendMqttMsg(text);
  return { skipNotify: false, text };
}

module.exports = { run, fetchWaterBill, formatBillBody, sendMqttMsg };
