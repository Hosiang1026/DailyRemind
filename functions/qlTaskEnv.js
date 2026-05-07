const INPUT_EXPORT_KEYS = [
    'SENTENCE_OPEN',
    'START_OPEN',
    'START_CONTENT',
    'END_OPEN',
    'END_CONTENT',
    'END_TIME',
    'ROBOT_PUSH',
    'ROBOT_KEY',
    'LOTTERY_OPEN',
    'LOTTERY_SD',
    'LOTTERY_KL8',
    'LOTTERY_QLC',
    'LOTTERY_SSQ',
    'WEATHER_OPEN',
    'WEATHER_KEY',
    'WEATHER_CLOTHES',
    'DAILY_OPEN',
    'DAILY_MARRIAGE',
    'DAILY_ANNIVERSARY',
    'DAILY_BIRTHDAY',
    'DAILY_LEGAL',
    'DAILY_SFTV',
    'DAILY_LFTV',
    'DAILY_TERM',
    'DAILY_SPECIAL',
    'DAILY_INTERNATION',
    'DAILY_LICENSE',
    'GASOLINE_OPEN',
    'GASOLINE_MODEL',
    'GASOLINE_OIL_PROVINCES',
    'CLASS_TABLE_OPEN',
    'CLASS_TABLE_GRADUATE',
    'CLASS_TABLE_HOMEWORK',
    'CLASS_TABLE_COMPUTER',
    'CLASS_TABLE_HR',
];

function isPresent(name) {
    const v = process.env[name];
    return v !== undefined && v !== null;
}

function assertInputExports(taskFile, extraKeys = []) {
    const keys = INPUT_EXPORT_KEYS.concat(extraKeys);
    const missing = keys.filter((k) => !isPresent(k));
    if (missing.length === 0) return;
    const msg =
        `[${taskFile}] 未配置 export: ${missing.join(', ')}，请 source 仓库 sh/exports.sh 或在青龙环境变量中配置`;
    console.log(msg);
    process.exit(1);
}

module.exports = { assertInputExports, INPUT_EXPORT_KEYS };
