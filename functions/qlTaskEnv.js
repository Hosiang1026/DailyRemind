const INPUT_EXPORT_KEYS = [
    'ROBOT_PUSH',
    'START',
    'LOTTERY',
    'WEATHER',
    'DAILY',
    'GASOLINE',
    'END',
    'CLASS_TABLE',
    'SENTENCE',
];

function isPresent(name) {
    const v = process.env[name];
    return v != null && String(v).trim() !== '';
}

function assertInputExports(taskFile) {
    const missing = INPUT_EXPORT_KEYS.filter((k) => !isPresent(k));
    if (missing.length === 0) return;
    const msg =
        `[${taskFile}] 未配置 export: ${missing.join(', ')}，请 source 仓库 scripts/qinglong/sh/exports.sh 或在青龙环境变量中配置`;
    console.log(msg);
    process.exit(1);
}

module.exports = { assertInputExports, INPUT_EXPORT_KEYS };
