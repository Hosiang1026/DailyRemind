/*
* 定时任务名称：电信套餐
* 执行规则：0 20 * * *（每天 20:00）
cron "0 20 * * *" ql_telecom_task.js, tag=电信套餐
* 依赖：Python3，pip install -r py/requirements.txt
* 账号：TELECOM_USER 或 TELECOM_USERS；可选 TELECOM_CONFIG_JSON 为 json 路径，仅话费月账与 push_config，不含密码
* MQTT：mqtt_host、mqtt_port；可选 mqtt_username、mqtt_password、mqtt_topic_telecom（默认 qinglong/telecom）
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
