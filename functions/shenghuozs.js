const { weather } = require('../scripts/qinglong/sh/input')
var calendar = require("./calendar");
const axios = require('axios');
const cheerio = require('cheerio');

const cities = [
    { city_name: "浙江余杭", city_code: "101210106" }
	];

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

const extractDataZS = (dataStr) => {
    const indices = [
        'fs', //防晒
        'dy', //钓鱼
        'ys', //雨伞
		'xc', //洗车
		'lk' //路况
    ];
    // 正则表达式匹配 `dataZS` 到 `fc` 之间的内容
    const regex = /var dataZS =({.*?});\s*var fc =/s;
    const match = dataStr.match(regex);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            const zs = data.zs || {};

            const contentArray = indices.map(index => {
                const name = zs[`${index}_name`] || "未知";
                const hint = zs[`${index}_hint`] || "未知";
                return name !== "未知" ? `· ${name}: ${hint}` : null;
            }).filter(item => item); // 过滤掉 `null` 项

            return contentArray; // 返回数组
        } catch (error) {
            console.error(`JSONDecodeError in dataZS: ${error.message}`);
            return null;
        }
    }
};

module.exports = handleShenghuoZS = () => {
    return new Promise(async (resolve, reject) => {
	const baseUrl = "https://d1.weather.com.cn/weather_index/{city_code}.html?_=1722309451962";
	const headers = {
		"Referer": "http://www.weather.com.cn/"
	};

    try {
        let weatherCityContent = []
        let nowDate = new Date();
        let currentYear = nowDate.getFullYear();
        let currentMonth = nowDate.getMonth();
        let currentDate = nowDate.getDate();
        let nowDateStr = `${currentYear}-${(currentMonth + 1) < 10 ? '0' + (currentMonth + 1) : (currentMonth + 1)}-${(currentDate) < 10 ? '0' + (currentDate) : (currentDate)}`

        for(const city of cities) {
            const url = baseUrl.replace("{city_code}", city.city_code);
            const dataStr = await syncDataWithRetry(url, headers);
            console.log(`正在获取 ${city.city_name} 的数据...`);
            if (dataStr != null) {
                var dataZS = extractDataZS(dataStr);
                if (dataZS.length > 0) {
                    weatherCityContent.push('🎈生活指数 \n');
                    dataZS.sort((a, b) => calendar.getTextLength(a) - calendar.getTextLength(b));
                    weatherCityContent.push(dataZS.join('\n'));
                }
                weatherCityContent.join('\n\n');
            }
        }

        //季节穿衣搭配 - 阴历
        var endClothesObj;
        let clothesArr = weather.clothes;
        if(clothesArr.length > 0){
            for (let i = 0; i < clothesArr.length; i++) {
                const element = clothesArr[i];
                let clothesName = element.name;
                let clothesDateArr = element.date;
                let clothesNum = element.num;
                let clothesNight = element.night;
                let clothesRemark = element.remark;
                for (let j = 0; j < clothesDateArr.length; j++) {
                    const clothesDate = clothesDateArr[j];
                    let beginDate = currentYear-1 + '-' + clothesDate;
                    let solarBeginDate = calendar.conversion(beginDate);
                    if (new Date(solarBeginDate) <= new Date(nowDateStr)) {
                        let diffNum = calendar.sumTimeToNow(solarBeginDate, nowDateStr);
                        let keepNum = clothesNum - diffNum;
                        if (keepNum >= 0) {
                            endClothesObj = {clothesName: clothesName, clothesNight: clothesNight, clothesRemark: clothesRemark, clothesBeginDate: solarBeginDate, keepNum: keepNum+1};
                        }
                    }
                }

                for (let j = 0; j < clothesDateArr.length; j++) {
                    const clothesDate = clothesDateArr[j];
                    let beginDate = currentYear + '-' + clothesDate;
                    let solarBeginDate = calendar.conversion(beginDate);
                    if (new Date(solarBeginDate) <= new Date(nowDateStr)) {
                        let diffNum = calendar.sumTimeToNow(solarBeginDate, nowDateStr);
                        let keepNum = clothesNum - diffNum;
                        if (keepNum >= 0) {
                            endClothesObj = {clothesName: clothesName, clothesNight: clothesNight, clothesRemark: clothesRemark, clothesBeginDate: solarBeginDate, keepNum: keepNum+1};
                        }
                    }
                }
            }
        }

        //季节穿衣搭配
        weatherCityContent.push(`\n👕穿衣推荐 \n`);
        let clothesName = endClothesObj.clothesName;
        let clothesNight = endClothesObj.clothesNight;
        let clothesRemark = endClothesObj.clothesRemark;
        let clothesBeginDate = endClothesObj.clothesBeginDate;
        let keepNum = endClothesObj.keepNum;
        weatherCityContent.push(`· 持续时间: `+ keepNum + `天`);
        weatherCityContent.push(`· 夜间睡觉: `+ clothesNight);
        weatherCityContent.push(`· 白天活动: `+ clothesName);
        weatherCityContent.push(`· 开始日期: `+ clothesBeginDate);
        weatherCityContent.push(`· 穿衣搭配: `+ clothesRemark);



        console.log('获取生活指数成功：', weatherCityContent);
        resolve(weatherCityContent.join('\n'))
    } catch (error) {
        console.log('处理生活指数失败', error.message || error);
        reject(error.message || error)
    }
    })
}
