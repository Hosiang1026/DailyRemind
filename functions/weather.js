const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const rainDbPath = path.join(__dirname, '..', 'db', 'weather_rain_by_month.json');
function normalizeRainDb(db) {
    if (!db.records) db.records = {};
    if (!db.marks) db.marks = {};
    if (!db.sunnyRecords) db.sunnyRecords = {};
    if (!db.sunnyMarks) db.sunnyMarks = {};
    if (!db.hotRecords) db.hotRecords = {};
    if (!db.hotMarks) db.hotMarks = {};
    if (!db.coldRecords) db.coldRecords = {};
    if (!db.coldMarks) db.coldMarks = {};
    for (const city of Object.keys(db.records)) {
        for (const month of Object.keys(db.records[city])) {
            const v = db.records[city][month];
            if (Array.isArray(v)) {
                db.records[city][month] = v.length;
                for (const dayKey of v) db.marks[city + '\t' + dayKey] = 1;
            }
        }
    }
    return db;
}
function loadRainDb() {
    try {
        if (fs.existsSync(rainDbPath)) return normalizeRainDb(JSON.parse(fs.readFileSync(rainDbPath, 'utf8')));
    } catch (e) { }
    return { records: {}, marks: {}, sunnyRecords: {}, sunnyMarks: {}, hotRecords: {}, hotMarks: {}, coldRecords: {}, coldMarks: {} };
}
function parseSkDayContext(dataStr, refDate) {
    const regex = /var dataSK\s*=\s*({[\s\S]*})/;
    const match = dataStr.match(regex);
    if (!match || !match[1]) return null;
    let data;
    try { data = JSON.parse(match[1]); } catch (e) { return null; }
    const dateStr = (data.date || '').replace(/\(星期[一二三四五六日]\)/, '');
    let y = refDate.getFullYear(), mo, d;
    const m = dateStr.match(/(\d+)月(\d+)日/);
    if (m) {
        mo = parseInt(m[1], 10);
        d = parseInt(m[2], 10);
    } else {
        mo = refDate.getMonth() + 1;
        d = refDate.getDate();
    }
    const pad = (n) => String(n).padStart(2, '0');
    const dayKey = `${y}-${pad(mo)}-${pad(d)}`;
    const monthKey = `${y}-${pad(mo)}`;
    const tempRaw = data.temp;
    const temp = tempRaw === undefined || tempRaw === null || tempRaw === '' ? NaN : parseFloat(String(tempRaw).replace(/[^\d.-]/g, ''));
    return { data, dayKey, monthKey, temp };
}
function saveRainDb(db) {
    const dir = path.dirname(rainDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(rainDbPath, JSON.stringify(db, null, 2), 'utf8');
}
function mutateRainRecord(db, cityName, dataStr, refDate) {
    const ctx = parseSkDayContext(dataStr, refDate);
    if (!ctx) return;
    const w = ctx.data.weather || '';
    if (w.indexOf('雨') === -1) return;
    const markKey = cityName + '\t' + ctx.dayKey;
    if (!db.marks) db.marks = {};
    if (!db.records[cityName]) db.records[cityName] = {};
    if (db.marks[markKey]) return;
    db.marks[markKey] = 1;
    const cur = db.records[cityName][ctx.monthKey];
    db.records[cityName][ctx.monthKey] = (typeof cur === 'number' ? cur : 0) + 1;
}
function mutateSunnyRecord(db, cityName, dataStr, refDate) {
    const ctx = parseSkDayContext(dataStr, refDate);
    if (!ctx) return;
    const w = ctx.data.weather || '';
    if (w.indexOf('雨') !== -1) return;
    if (w.indexOf('晴') === -1) return;
    const markKey = cityName + '\t' + ctx.dayKey;
    if (!db.sunnyMarks) db.sunnyMarks = {};
    if (!db.sunnyRecords[cityName]) db.sunnyRecords[cityName] = {};
    if (db.sunnyMarks[markKey]) return;
    db.sunnyMarks[markKey] = 1;
    const cur = db.sunnyRecords[cityName][ctx.monthKey];
    db.sunnyRecords[cityName][ctx.monthKey] = (typeof cur === 'number' ? cur : 0) + 1;
}
function mutateHotRecord(db, cityName, dataStr, refDate) {
    const ctx = parseSkDayContext(dataStr, refDate);
    if (!ctx || Number.isNaN(ctx.temp) || ctx.temp <= 30) return;
    const markKey = cityName + '\t' + ctx.dayKey;
    if (!db.hotMarks) db.hotMarks = {};
    if (!db.hotRecords[cityName]) db.hotRecords[cityName] = {};
    if (db.hotMarks[markKey]) return;
    db.hotMarks[markKey] = 1;
    const cur = db.hotRecords[cityName][ctx.monthKey];
    db.hotRecords[cityName][ctx.monthKey] = (typeof cur === 'number' ? cur : 0) + 1;
}
function mutateColdRecord(db, cityName, dataStr, refDate) {
    const ctx = parseSkDayContext(dataStr, refDate);
    if (!ctx || Number.isNaN(ctx.temp) || ctx.temp >= 10) return;
    const markKey = cityName + '\t' + ctx.dayKey;
    if (!db.coldMarks) db.coldMarks = {};
    if (!db.coldRecords[cityName]) db.coldRecords[cityName] = {};
    if (db.coldMarks[markKey]) return;
    db.coldMarks[markKey] = 1;
    const cur = db.coldRecords[cityName][ctx.monthKey];
    db.coldRecords[cityName][ctx.monthKey] = (typeof cur === 'number' ? cur : 0) + 1;
}
function formatRainSunMonthlyStats(db, cityList, refDate) {
    const y = refDate.getFullYear();
    const padM = (n) => String(n).padStart(2, '0');
    const maxMonthKey = `${y}-${padM(refDate.getMonth() + 1)}`;
    const prefix = `${y}-`;
    const names = [];
    for (const c of cityList) {
        if (!names.includes(c.city_name)) names.push(c.city_name);
    }
    const lines = [`\n\n📊天气信息统计`, ''];
    for (let i = 0; i < names.length; i++) {
        const cityName = names[i];
        const rM = db.records[cityName] || {};
        const sM = db.sunnyRecords[cityName] || {};
        const hM = db.hotRecords[cityName] || {};
        const cM = db.coldRecords[cityName] || {};
        const months = new Set([...Object.keys(rM), ...Object.keys(sM), ...Object.keys(hM), ...Object.keys(cM)]);
        const sorted = [...months]
            .filter((mk) => mk.startsWith(prefix) && mk >= `${y}-01` && mk <= maxMonthKey)
            .sort();
        if (i > 0) lines.push('');
        if (sorted.length === 0) {
            lines.push(`🚩${cityName}: （暂无）`);
            continue;
        }
        lines.push(`🚩${cityName} `);
        for (const mk of sorted) {
            const r = typeof rM[mk] === 'number' ? rM[mk] : 0;
            const s = typeof sM[mk] === 'number' ? sM[mk] : 0;
            const h = typeof hM[mk] === 'number' ? hM[mk] : 0;
            const c = typeof cM[mk] === 'number' ? cM[mk] : 0;
            lines.push(`${mk}: 雨${r}天 晴${s}天 高温${h}天 低温${c}天`);
        }
    }
    return lines.join('\n');
}

//台风列表 https://d1.weather.com.cn/typhoon/typhoon_list/list_2024.json?callback=getData&_=1722388563506


//显示天气 https://d1.weather.com.cn/sk_2d/101210106.html?_=1722594965119
//https://d1.weather.com.cn/sk_2d/101210106.html?_=1722595936375
//未来降雨： https://d3.weather.com.cn/webgis_rain_new/webgis/minute?lat=30.419&lon=120.299&callback=aa&_=1722594965125



//iP地址自动位置：https://wgeo.weather.com.cn/ip/?_=1722596281348
//通过编码获取城市信息 https://d7.weather.com.cn/geong/v1/api/?params={%22method%22:%22stationinfo%22,%22areaid%22:%22101210106%22,%22category%22:%22%22,%22callback%22:%22zs%22}&callback=zs&_=1722594965120
//城市编码 https://i.tq121.com.cn/j/webgis_v2/city.json?callback=weacity&_=1722595937269


// 获取城市天气编码
const citiesJson = process.env.CITIES;

var cities = [];
if (!citiesJson || String(citiesJson).trim() === "") {
    console.error("请配置环境变量 CITIES（城市天气编码 JSON）");
    process.exit(1);
}
try {
    cities = JSON.parse(citiesJson);
} catch (error) {
    console.error("环境变量-城市天气编码配置错误:", error);
}

const syncDataWithRetry = async (url, headers, maxRetries = 3) => {
    let retryCount = 0;
    while (retryCount <= maxRetries) {
        try {
            const response = await axios.get(url, { headers });
            console.log(`Response status code: ${response.status}`);

            if (response.status === 200) {
                const data = response.data;

                // 检查返回数据是否为HTML页面
                if (data.toLowerCase().includes("<html>")) {
                    const $ = cheerio.load(data);
                    const title = $("title").text();

                    // 如果标题包含“无法访问”，则重试
                    if (title.includes("无法访问")) {
                        throw new Error("Page not accessible");
                    }
                }

                return data;
            } else {
                console.log(`Request failed with status code: ${response.status}`);
                retryCount++;
            }
        } catch (error) {
            console.error(`Error occurred: ${error.message}`);
            retryCount++;
        }
    }
    return null;
};

//获取城市天气，但不准确
// const extractCityDZ = (dataStr) => {
//     // 正则表达式匹配 `cityDZ` 到 `alarmDZ` 之间的内容
//     const regex = /var cityDZ =({.*?});\s*var alarmDZ =/s;
//     const match = dataStr.match(regex);
//     if (match && match[1]) {
//         try {
//             const data = JSON.parse(match[1]);
//             const weatherInfo = data.weatherinfo || {};
//
//             const content = [
//                 `城市: ${weatherInfo.city || "未知"}`,
//                 `城市名称: ${weatherInfo.cityname || "未知"}`,
//                 `温度: ${weatherInfo.temp || "未知"}°C`,
//                 `天气: ${weatherInfo.weather || "未知"}`,
//                 `风况: ${weatherInfo.wd || "未知"}`,
//                 `风速: ${weatherInfo.ws || "未知"}`,
//                 `预报时间: ${weatherInfo.fctime || "未知"}`
//             ].join('\n');
//
//             return `\n城市基本信息:\n${content}`;
//         } catch (error) {
//             console.error(`JSONDecodeError in cityDZ: ${error.message}`);
//             return null;
//         }
//     }
// };

const extractDataSK = (dataStr) => {
    // 正则表达式匹配 `fc` 到结尾之间的内容
    const regex = /var dataSK\s*=\s*({[\s\S]*})/;
    const match = dataStr.match(regex);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            var weatherIcon = '';
            var weathers = data.weather;
            switch (weathers) {
                case "晴":
                    weatherIcon = "🌤";
                    break;
                case "雾":
                    weatherIcon = "🌫";
                    break;
                case "霾":
                    weatherIcon = "🌫";
                    break;
                case "多云":
                    weatherIcon = "🌥";
                    break;
                case "阴":
                    weatherIcon = "☁";
                    break;
                case "小雨":
                    weatherIcon = "🌨";
                    break;
                case "中雨":
                    weatherIcon = "🌧";
                    break;
                case "大雨":
                    weatherIcon = "⛈";
                    break;
                default:
                    if (weathers.indexOf('晴') != -1){
                        weatherIcon = "🌤";
                    }
                    if (weathers.indexOf('雨') != -1){
                        weatherIcon = "🌨";
                    }
            }

            // 使用正则表达式去掉(星期三)
            const dateWithoutWeekday = data.date.replace(/\(星期[一二三四五六日]\)/, '');

            const content = [
                `· 天气: ${weathers || "未知"} ${weatherIcon || ""}`,
                `· 风况: ${data.WD || "未知"}${data.WS || ""}${data.wse || ""} `,
                `· 温湿度: ${data.temp || "0"}°C ${data.sd || "未知"} ${data.rain || "0"}mm`,
                `· 预报时间: ${dateWithoutWeekday || ""} ${data.time || ""}`
            ].join('\n');

            return `\n${content}`;
        } catch (error) {
            console.error(`JSONDecodeError in dataSK: ${error.message}`);
            return null;
        }
    }
};

const extractAlarmDZ = (dataStr) => {
    // 正则表达式匹配 `alarmDZ` 到 `dataSK` 之间的内容
    const regex = /var alarmDZ =({.*?});\s*var dataSK =/s;
    const match = dataStr.match(regex);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            const alerts = data.w || [];

            if(alerts.length > 0){
                const content = alerts.map(alert => `${alert.w9 || "未知"}`).join('\n');
                return `\n${content}`;
            }

        } catch (error) {
            console.error(`JSONDecodeError in alarmDZ: ${error.message}`);
            return null;
        }
    }
};

const extractTyphoonListDZ = (dataStr) => {
    try {
        // 提取 JSON 对象部分
        const jsonString = dataStr.match(/getData\(([\s\S]+)\)/)[1];

        // 将字符串转换为 JSON 对象
        const jsonData = JSON.parse(jsonString);

        // 遍历 typhoonList 数组，寻找状态为 "active" 的台风数组
        const activeTyphoonCodes = jsonData.typhoonList
            .filter(typhoon => typhoon.includes("active")) // 筛选出包含 "active" 的台风
            .map(typhoon => typhoon[0]);

        // 如果找到 activeTyphoon，返回其第一个元素作为数组；否则返回空数组
        return activeTyphoonCodes ? activeTyphoonCodes : [];

    } catch (error) {
        console.error(`JSONDecodeError in extractTyphoonListDZ: ${error.message}`);
        return null;
    }

};

const extractTyphoonDZ = (dataStr) => {
    // 提取 JSON 对象部分
    const jsonString = dataStr.match(/getData\(([\s\S]+)\)/)[1];

    // 将字符串转换为 JSON 对象
    const jsonData = JSON.parse(jsonString);

    const typhoonCode = jsonData.typhoon[3];
    const typhoonNameStr = jsonData.typhoon[2];
    const typhoonName = typhoonCode + `-` + typhoonNameStr + '\n';

    // 访问 typhoon 数组中的第9个元素
    const ninthTyphoon = jsonData.typhoon[8];

    // 获取第9个元素数组中的最后一个元素
    const lastElement = ninthTyphoon[ninthTyphoon.length - 1];

    if (lastElement && lastElement[1]) {

        try {
            // 获取风速（米/秒）
            const windSpeed = lastElement[7]; // 假设 windSpeed 是以米/秒为单位的风速

            // 将风速从米/秒转换为公里/小时 (1 米/秒 = 3.6 公里/小时)
            const windSpeedKmh = windSpeed * 3.6;

            // 根据风速获取台风等级及级别
            let typhoonLevel;
            let typhoonGrade;

            if (windSpeedKmh < 62) {
                typhoonLevel = '热带低压';
                typhoonGrade = '6级以下';
            } else if (windSpeedKmh >= 62 && windSpeedKmh <= 74) {
                typhoonLevel = '热带风暴';
                typhoonGrade = '8级';
            } else if (windSpeedKmh > 74 && windSpeedKmh <= 88) {
                typhoonLevel = '热带风暴';
                typhoonGrade = '9级';
            } else if (windSpeedKmh >= 89 && windSpeedKmh <= 102) {
                typhoonLevel = '强热带风暴';
                typhoonGrade = '10级';
            } else if (windSpeedKmh > 102 && windSpeedKmh <= 117) {
                typhoonLevel = '强热带风暴';
                typhoonGrade = '11级';
            } else if (windSpeedKmh >= 118 && windSpeedKmh <= 133) {
                typhoonLevel = '台风';
                typhoonGrade = '12级';
            } else if (windSpeedKmh > 133 && windSpeedKmh <= 149) {
                typhoonLevel = '台风';
                typhoonGrade = '13级';
            } else if (windSpeedKmh >= 150 && windSpeedKmh <= 166) {
                typhoonLevel = '强台风';
                typhoonGrade = '14级';
            } else if (windSpeedKmh > 166 && windSpeedKmh <= 184) {
                typhoonLevel = '强台风';
                typhoonGrade = '15级';
            } else if (windSpeedKmh >= 185 && windSpeedKmh <= 201) {
                typhoonLevel = '超强台风';
                typhoonGrade = '16级';
            } else if (windSpeedKmh > 201 && windSpeedKmh <= 220) {
                typhoonLevel = '超强台风';
                typhoonGrade = '17级';
            } else if (windSpeedKmh > 220) {
                typhoonLevel = '超强台风';
                typhoonGrade = '18级及以上';
            }

            // 遍历最后一个数组中的信息并格式化输出
            const content = [
                `🌀${typhoonName}`,
                `· ${typhoonLevel}: ${typhoonGrade}`,
                `· 未来移向: ${lastElement[8] }`,
                `· 风速风力: ${lastElement[7] + "米/秒"}`,
                `· 中心气压: ${lastElement[6] + "百帕"}`,
                `· 未来移速: ${lastElement[9] + "公里/小时"}`,
                `· 中心位置: ${lastElement[5] + "N"}/${lastElement[4] + "E"}`,
                `· 到达时间: ${lastElement[1] }`,
            ].join('\n');
            return `\n${content}`;
        } catch (error) {
            console.error(`JSONDecodeError in TyphoonDZ: ${error.message}`);
            return null;
        }
    }
};

module.exports = handleWeather = (opts = {}) => {
    return new Promise(async (resolve, reject) => {

    //实况天气
	const weatherUrl = "https://d1.weather.com.cn/sk_2d/{city_code}.html?_=1722594965119";
	//预警天气汇总
    const alarmUrl = "https://d1.weather.com.cn/weather_index/{city_code}.html?_=1722309451962";
    //台风列表
    const typhoonListUrl = "https://d1.weather.com.cn/typhoon/typhoon_list/list_2024.json?callback=getData&_=1722388563506";
    //台风信息
    const typhoonUrl = "https://d1.weather.com.cn/typhoon/typhoon_data/2024/{typhoonCode}.json?callback=getData&_=1724557325237";

	const headers = {
		"Referer": "http://www.weather.com.cn/"
	};

    try {
        let mergedContent = []
        let mergedAllContent = []
        mergedAllContent.push("🌈实时天气信息");
        const dataList = [];
        const now = new Date();
        let rainDb = null;
        if (opts.recordMonthlyRain) rainDb = loadRainDb();
        const startDate = new Date(now.getFullYear(), 9, 1); // 10月1日 00:00:00
        const endDate = new Date(now.getFullYear(), 9, 7, 23, 59, 59); // 10月7日 23:59:59
        if(now >= startDate && now <= endDate){
            const fuzhouData = { city_name: "福建-福州", city_code: "101230101" }
            cities.push(fuzhouData);
        }

        const newYearStartDate = new Date(now.getFullYear(), 1, 15); // 1月15日 00:00:00
        const newYearEndDate = new Date(now.getFullYear(), 2, 15, 23, 59, 59); // 2月15日 23:59:59
		if(now >= newYearStartDate && now <= newYearEndDate){
            const fuzhouData = { city_name: "安徽-怀宁", city_code: "101220605" }
            cities.push(fuzhouData);
        }

        for(let city of cities) {
            console.log(`正在获取 ${city.city_name} 的实时天气数据...`);
            const url = weatherUrl.replace("{city_code}", city.city_code);
            const dataStr = await syncDataWithRetry(url, headers);
            if (dataStr != null) {
                dataList.push(dataStr);
                if (rainDb) {
                    mutateRainRecord(rainDb, city.city_name, dataStr, now);
                    mutateSunnyRecord(rainDb, city.city_name, dataStr, now);
                    mutateHotRecord(rainDb, city.city_name, dataStr, now);
                    mutateColdRecord(rainDb, city.city_name, dataStr, now);
                }
            var dataSK = extractDataSK(dataStr);
            if (dataSK != null) {
                mergedAllContent.push('\n🚩'+ city.city_name);
                mergedAllContent.push(dataSK);
            }
            }
        }

        let typhoonContent = []
        console.log(`正在获取台风数据...`);
        const typhoonList = await syncDataWithRetry(typhoonListUrl, headers);
        const typhoonCodeList = extractTyphoonListDZ(typhoonList);
        if(typhoonCodeList.length > 0){
            for(let typhoonCode of typhoonCodeList) {
                const url = typhoonUrl.replace("{typhoonCode}", typhoonCode);
                const typhoonData = await syncDataWithRetry(url, headers);
                var typhoonDZ = extractTyphoonDZ(typhoonData);
                if (typhoonDZ != null && typhoonDZ != undefined) {
                    typhoonContent.push(typhoonDZ);
                }
            }

            if (typhoonContent.length > 0){
                let typhoonTitle = []
                typhoonTitle.push("\n🌪实时台风信息");
                typhoonContent = typhoonTitle.concat(typhoonContent);
                mergedAllContent = mergedAllContent.concat(typhoonContent);
            }
        }

        let alarmContent = []
        for(let city of cities) {
            console.log(`正在获取 ${city.city_name} 的天气预警数据...`);
            const url = alarmUrl.replace("{city_code}", city.city_code);
            const alarmData = await syncDataWithRetry(url, headers);
            var alarmDZ = extractAlarmDZ(alarmData);
            if (alarmDZ != null&&alarmDZ != undefined){
                alarmContent.push(alarmDZ);
            }
        }
        if (alarmContent.length >0){
            let alarmTitle = []
            alarmTitle.push("\n🚨天气预警信息");
            alarmContent = alarmTitle.concat(alarmContent);
            mergedAllContent = mergedAllContent.concat(alarmContent);
        }

        mergedAllContent.join('\n\n');
        console.log('获取天气预报成功数据：', mergedAllContent);
        if (rainDb) saveRainDb(rainDb);
        let body = mergedAllContent.join('\n');
        if (opts.recordMonthlyRain && rainDb) body += formatRainSunMonthlyStats(rainDb, cities, now);
        resolve(body)

    } catch (error) {
        console.log('处理天气预报数据失败', error.message || error);
        reject(error.message || error)
    }
    })
}
