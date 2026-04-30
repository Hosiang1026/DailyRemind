/*
cron "0 9 * * *" ql_huzhou_water_task.js, tag=湖州水费
* HUZHOU_WATER_HH；浏览器抓包 accesstoken 填 HUZHOU_WATER_ACCESS_TOKEN；可选 HUZHOU_WATER_COOKIE；MQTT mqtt_host 等
*/

require('dotenv').config();
const notify = require('../utils/sendNotify');
const { run } = require('../functions/huzhouWaterBill');

run()
  .then((r) => {
    if (r && r.skipNotify) return;
    return notify.sendNotify('💧湖州水费', r.text);
  })
  .catch((e) => {
    console.error('[huzhou-water]', e);
    process.exit(1);
  });
