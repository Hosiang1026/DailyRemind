const axios = require('axios');
const cheerio = require('cheerio');

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

const extractDataZS = (dataStr, cityname) => {
    const indices = [
        'ys', 'xc', 'lk',
        'dy', 'tr', 'gj', 'fs', 'gl',
        'ac', 'co', 'uv', 'gz'
    ];
    // 正则表达式匹配 `dataZS` 到 `fc` 之间的内容
    const regex = /var dataZS =({.*?});\s*var fc =/s;
    const match = dataStr.match(regex);
    if (match && match[1]) {
        try {
            const data = JSON.parse(match[1]);
            const zs = data.zs || {};

            const content = indices.map(index => {
                const name = zs[`${index}_name`] || "未知";
                const hint = zs[`${index}_hint`] || "未知";
                const des_s = zs[`${index}_des_s`] || "未知";

                return name !== "未知" ? `${name}: ${hint}, ${des_s}` : null;
            }).filter(line => line).join('\n');

            return `\n${cityname} - 生活指数信息:\n${content}`;
        } catch (error) {
            console.error(`JSONDecodeError in dataZS: ${error.message}`);
            return null;
        }
    }
};

module.exports = handleShenghuoZS = () => {
    return new Promise(async (resolve, reject) => {
	const cities = [
    { city_name: "安徽-怀宁", city_code: "101220605" },
    { city_name: "浙江-余杭", city_code: "101210106" },
    { city_name: "浙江-吴兴", city_code: "101210205" },
    { city_name: "福建-福州", city_code: "101230101" }
	];

	const baseUrl = "https://d1.weather.com.cn/weather_index/{city_code}.html?_=1722309451962";
	const headers = {
		"Referer": "http://www.weather.com.cn/"
	};

    try {
        let weatherCityContent = []
        for(const city of cities) {
            const cityname = city.city_name;
            const url = baseUrl.replace("{city_code}", city.city_code);
            const dataStr = await syncDataWithRetry(url, headers);
            console.log(`正在获取 ${city.city_name} 的数据...`);
            if (dataStr != null) {
                var dataZS = extractDataZS(dataStr, cityname);
                if (dataZS != null) {
                    weatherCityContent.push(dataZS);
                }
                weatherCityContent.join('\n\n');
            }
        }
        console.log('获取天气预报成功数据：', weatherCityContent);
        resolve(weatherCityContent.join('\n'))
    } catch (error) {
        console.log('处理天气预报数据失败', error.message || error);
        reject(error.message || error)
    }
    })
}
