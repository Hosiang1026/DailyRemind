/*
cron "0 20 * * *" ql_telecom_task.js, tag=电信套餐
* name:电信套餐
* 电信套餐任务:脚本更新地址 task/ql_telecom_task.js
* Python3 pip py/requirements.txt；TELECOM_USER/TELECOM_USERS；可选 TELECOM_CONFIG_JSON；MQTT mqtt_host 等
*/

require('dotenv').config()
const { spawnSync } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..')
const script = path.join(root, 'py', 'telecom', 'telecom_monitor.py')
const py = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
const extra = process.env.TELECOM_CONFIG_JSON || ''
const args = [script]
if (extra) args.push(path.isAbsolute(extra) ? extra : path.join(root, extra))

const r = spawnSync(py, args, { cwd: root, stdio: 'inherit', env: process.env })
process.exit(r.status !== null && r.status !== undefined ? r.status : 1)
