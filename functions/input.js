function parseEnvJson(name) {
    const s = process.env[name];
    if (s == null || s === '') throw new Error('缺少环境变量: ' + name);
    try {
        return JSON.parse(s);
    } catch (e) {
        throw new Error('环境变量 JSON 解析失败 ' + name + ': ' + e.message);
    }
}
const atAllEnv = process.env.AT_ALL;
let atAll = false;
if (atAllEnv !== undefined && atAllEnv !== '')
    atAll = atAllEnv === '1' || atAllEnv === 'true';

const robotPush = parseEnvJson('ROBOT_PUSH');
const start = parseEnvJson('START');
const lottery = parseEnvJson('LOTTERY');
const weather = parseEnvJson('WEATHER');
const daily = parseEnvJson('DAILY');
const gasoline = parseEnvJson('GASOLINE');
const end = parseEnvJson('END');
const classTable = parseEnvJson('CLASS_TABLE');
const sentence = parseEnvJson('SENTENCE');

module.exports = { robotPush, start, lottery, weather, daily, gasoline, end, atAll, classTable, sentence }
