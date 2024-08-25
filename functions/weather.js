const axios = require('axios');
const cheerio = require('cheerio');

//台风列表 https://d1.weather.com.cn/typhoon/typhoon_list/list_2024.json?callback=getData&_=1722388563506


//显示天气 https://d1.weather.com.cn/sk_2d/101210106.html?_=1722594965119
//https://d1.weather.com.cn/sk_2d/101210106.html?_=1722595936375
//未来降雨： https://d3.weather.com.cn/webgis_rain_new/webgis/minute?lat=30.419&lon=120.299&callback=aa&_=1722594965125



//iP地址自动位置：https://wgeo.weather.com.cn/ip/?_=1722596281348
//通过编码获取城市信息 https://d7.weather.com.cn/geong/v1/api/?params={%22method%22:%22stationinfo%22,%22areaid%22:%22101210106%22,%22category%22:%22%22,%22callback%22:%22zs%22}&callback=zs&_=1722594965120
//城市编码 https://i.tq121.com.cn/j/webgis_v2/city.json?callback=weacity&_=1722595937269


// 获取城市天气编码
const citiesJson = process.env.CITIES;

// 解析 JSON 数据
let cities = [];
try {
    if(citiesJson!=undefined){
        cities = JSON.parse(citiesJson);
    }else{
        cities = [
        { city_name: "浙江-余杭", city_code: "101210106" },
        { city_name: "浙江-吴兴", city_code: "101210205" },
        { city_name: "福建-福州", city_code: "101230101" },
        { city_name: "安徽-怀宁", city_code: "101220605" }
        ];
    }
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
                `· 温湿度: ${data.temp || "0"}°C ${data.sd || "未知"} ${data.rain || "0"}mm`,
                `· 风向情况: ${data.WD || "未知"}${data.WS || ""} ${data.wse || ""} `,
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
        const activeTyphoon = jsonData.typhoonList.find(typhoon => typhoon.includes("active"));

        // 如果找到 activeTyphoon，返回其第一个元素作为数组；否则返回空数组
        return activeTyphoon ? [activeTyphoon[0]] : [];

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

    const typhoonStatus = jsonData.typhoon[7];

    if (typhoonStatus != "active"){
        return null;
    }

    const typhoonName = jsonData.typhoon[3] + jsonData.typhoon[2];

    // 访问 typhoon 数组中的第9个元素
    const ninthTyphoon = jsonData.typhoon[8];

    // 获取第9个元素数组中的最后一个元素
    const lastElement = ninthTyphoon[ninthTyphoon.length - 1];

    if (lastElement && lastElement[1]) {
        try {
            // 遍历最后一个数组中的信息并格式化输出
            const content = [
                `· 台风名称: ${typhoonName }`,
                `· 未来移向: ${lastElement[8] }`,
                `· 未来移速: ${lastElement[9] + "公里/小时"}`,
                `· 风速风力: ${lastElement[7] + "米/秒"}`,
                `· 中心气压: ${lastElement[6] + "百帕"}`,
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

module.exports = handleWeather = () => {
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
        let weatherCityContent = []
        weatherCityContent.push("🌈实时天气信息");
        const dataList = [];
        for(let city of cities) {
            console.log(`正在获取 ${city.city_name} 的实时天气数据...`);
            const url = weatherUrl.replace("{city_code}", city.city_code);
            const dataStr = await syncDataWithRetry(url, headers);
            if (dataStr != null) {
                dataList.push(dataStr);
            var dataSK = extractDataSK(dataStr);
            if (dataSK != null) {
                weatherCityContent.push('\n🚩'+ city.city_name);
                weatherCityContent.push(dataSK);
            }
            }
        }

        let typhoonContent = []
        console.log(`正在获取台风数据...`);
        const typhoonList = await syncDataWithRetry(typhoonListUrl, headers);
        const typhoonCodeList = extractTyphoonListDZ(typhoonList);
        for(let typhoonCode of typhoonCodeList) {
            const url = typhoonUrl.replace("{typhoonCode}", typhoonCode);
            const typhoonData = await syncDataWithRetry(url, headers);
            var typhoonDZ = extractTyphoonDZ(typhoonData);
            if (typhoonDZ != null && typhoonDZ != undefined) {
                typhoonContent.push(typhoonDZ);
            }
        }
        if (typhoonContent.length >0){
            weatherCityContent.push("\n🌪台风实时路径信息");
            mergedContent = weatherCityContent.concat(typhoonContent);
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
            mergedContent.push("\n🚨天气预警信息");
            mergedAllContent = mergedContent.concat(alarmContent);
        }else{
            mergedAllContent = mergedContent;
        }

        mergedAllContent.join('\n\n');
        console.log('获取天气预报成功数据：', mergedAllContent);
        resolve(mergedAllContent.join('\n'))

    } catch (error) {
        console.log('处理天气预报数据失败', error.message || error);
        reject(error.message || error)
    }
    })
}
