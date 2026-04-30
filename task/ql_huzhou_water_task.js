/*
cron "0 9 * * *" ql_huzhou_water_task.js, tag=湖州水费
* name:湖州水费
* 脚本: task/ql_huzhou_water_task.js
* 近期水费 je>0 才走 sendNotify（临时去掉钉钉 env）；MQTT 每次成功拉单都发
*/

require('dotenv').config();
const notify = require('../utils/sendNotify');
const { run } = require('../functions/huzhouWaterBill');

function stashDingEnv() {
  const saved = {};
  for (const k of Object.keys(process.env)) {
    if (k.startsWith('DD_BOT_TOKEN') || k.startsWith('DD_BOT_SECRET')) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  }
  return saved;
}

function restoreDingEnv(saved) {
  for (const [k, v] of Object.entries(saved)) process.env[k] = v;
}

run()
  .then(async (r) => {
    if (r && r.skipNotify) return;
    console.log('通知内容:\n' + (r.text || ''));
    if (!r.pushWechat) return;
    const saved = stashDingEnv();
    try {
      await notify.sendNotify('💧湖州水费', r.text);
    } finally {
      restoreDingEnv(saved);
    }
  })
  .catch((e) => {
    console.error('[huzhou-water]', e);
    process.exit(1);
  });
