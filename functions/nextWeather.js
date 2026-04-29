const axios = require('axios');
const cheerio = require('cheerio');

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

const extractFc = (dataStr, cityname) => {
	// 正则表达式匹配 `fc` 到结尾之间的内容
	const regex = /var fc\s*=\s*({[\s\S]*})/;
	const match = dataStr.match(regex);
	if (match && match[1]) {
		try {
			const data = JSON.parse(match[1]);
			const forecasts = data.f || [];

			const content = forecasts.map(forecast => {
				const date = forecast.fi ? forecast.fi.replace(/\//g, '-') : "未知";
				const day = forecast.fj || "未知";
				const tempHigh = forecast.fc || "未知";
				const tempLow = forecast.fd || "未知";
				const windDirection = forecast.fe || "未知";
				const windSpeed = forecast.fg || "未知";
				const humidity = forecast.fm || "未知";
				const comfortIndex = forecast.fn || "未知";

				return `日期: ${date} (${day})\n气温: ${tempLow}°C ~ ${tempHigh}°C\n湿度: ${humidity}%\n舒适度: ${comfortIndex}\n风向: ${windDirection} ${windSpeed}\n`;
			}).join('\n');

			return `\n🚩${cityname}\n\n${content}`;
		} catch (error) {
			console.error(`JSONDecodeError in fc: ${error.message}`);
			return null;
		}
	}
};

module.exports = handleWeather = () => {
	return new Promise(async (resolve, reject) => {
		const baseUrl = "https://d1.weather.com.cn/weather_index/{city_code}.html?_=1722309451962";
		const headers = {
			"Referer": "http://www.weather.com.cn/"
		};

		try {
			let weatherCityContent = []
			weatherCityContent.push("🏳‍🌈未来天气预报信息");
			for(const city of cities) {
				const cityname = city.city_name;
				const url = baseUrl.replace("{city_code}", city.city_code);
				const dataStr = await syncDataWithRetry(url, headers);
				console.log(`正在获取 ${city.city_name} 的数据...`);
				if (dataStr != null) {
					var dataFc = extractFc(dataStr, cityname);
					if (dataFc != null) {
						weatherCityContent.push(dataFc);
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
