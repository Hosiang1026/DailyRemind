function parseEnvJson(name) {
    const s = process.env[name];
    if (s == null || s === '') throw new Error('缺少环境变量: ' + name);
    try {
        return JSON.parse(s);
    } catch (e) {
        throw new Error('环境变量 JSON 解析失败 ' + name + ': ' + e.message);
    }
}

function requireEnv(name) {
    const s = process.env[name];
    if (s === undefined || s === null) throw new Error('缺少环境变量: ' + name);
    return String(s);
}

function parseBoolEnv(name) {
    const t = requireEnv(name).trim().toLowerCase();
    if (t === 'true' || t === '1') return true;
    if (t === 'false' || t === '0') return false;
    throw new Error('环境变量布尔无效 ' + name + ': ' + process.env[name]);
}

const atAllEnv = process.env.AT_ALL;
let atAll = false;
if (atAllEnv !== undefined && atAllEnv !== '')
    atAll = atAllEnv === '1' || atAllEnv === 'true';

const robotPush = {
    open: parseBoolEnv('ROBOT_PUSH'),
    key: process.env.ROBOT_KEY != null ? String(process.env.ROBOT_KEY) : '',
};

const start = {
    open: parseBoolEnv('START_OPEN'),
    content: process.env.START_CONTENT != null ? String(process.env.START_CONTENT) : '',
};

const end = {
    open: parseBoolEnv('END_OPEN'),
    content: process.env.END_CONTENT != null ? String(process.env.END_CONTENT) : '',
    time: process.env.END_TIME != null ? String(process.env.END_TIME) : '',
};

const sentence = { open: parseBoolEnv('SENTENCE_OPEN') };

const lottery = {
    open: parseBoolEnv('LOTTERY_OPEN'),
    SD: parseEnvJson('LOTTERY_SD'),
    KL8: parseEnvJson('LOTTERY_KL8'),
    QLC: parseEnvJson('LOTTERY_QLC'),
    SSQ: parseEnvJson('LOTTERY_SSQ'),
};

const weather = {
    open: parseBoolEnv('WEATHER_OPEN'),
    key: process.env.WEATHER_KEY != null ? String(process.env.WEATHER_KEY) : '',
    clothes: parseEnvJson('WEATHER_CLOTHES'),
};

const daily = {
    open: parseBoolEnv('DAILY_OPEN'),
    marriage: parseEnvJson('DAILY_MARRIAGE'),
    anniversary: parseEnvJson('DAILY_ANNIVERSARY'),
    birthday: parseEnvJson('DAILY_BIRTHDAY'),
    legal: parseEnvJson('DAILY_LEGAL'),
    sFtv: parseEnvJson('DAILY_SFTV'),
    lFtv: parseEnvJson('DAILY_LFTV'),
    term: parseEnvJson('DAILY_TERM'),
    special: parseEnvJson('DAILY_SPECIAL'),
    internation: parseEnvJson('DAILY_INTERNATION'),
    license: parseEnvJson('DAILY_LICENSE'),
};

const gasoline = {
    open: parseBoolEnv('GASOLINE_OPEN'),
    model: parseEnvJson('GASOLINE_MODEL'),
    oil_provinces: parseEnvJson('GASOLINE_OIL_PROVINCES'),
};

const classTable = {
    open: parseBoolEnv('CLASS_TABLE_OPEN'),
    graduate: process.env.CLASS_TABLE_GRADUATE != null ? String(process.env.CLASS_TABLE_GRADUATE) : '',
    homework: process.env.CLASS_TABLE_HOMEWORK != null ? String(process.env.CLASS_TABLE_HOMEWORK) : '',
    computer: parseEnvJson('CLASS_TABLE_COMPUTER'),
    hr: parseEnvJson('CLASS_TABLE_HR'),
};

module.exports = { robotPush, start, lottery, weather, daily, gasoline, end, atAll, classTable, sentence }
