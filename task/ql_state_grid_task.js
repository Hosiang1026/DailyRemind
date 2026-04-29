/*
cron "30 8 * * *" ql_state_grid_task.js, tag=国家电网
* name:国家电网
* 国家电网任务:脚本更新地址 task/ql_state_grid_task.js
* WSGW_USERNAME / WSGW_PASSWORD；或多账号 WSGW_ACCOUNTS JSON 数组
* MQTT 与同仓库 mqtt_host mqtt_port mqtt_username mqtt_password
* 主题 nodejs/state-grid/{户号}；token 缓存 db/state-grid/
*/

require('dotenv').config()
const { runAll } = require('../functions/stateGrid')

runAll().catch((e) => {
  console.error('[state-grid]', e)
  process.exit(1)
})
